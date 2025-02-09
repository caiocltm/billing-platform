import { PdfAPI } from '../../lib/apis/pdf.api';
import { BillingEntity } from 'src/billing/billing.entity';
import { BillingQueues } from '../../lib/enums/queue.enum';
import { GenerateBankSlipException } from 'src/lib/exception-filters/custom-exceptions/generate-bank-slip.exception';
import { Billing } from '../schemas/billing.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailSenderAPI } from 'src/lib/apis/email-sender.api';
import { plainToInstance } from 'class-transformer';
import { BillingSerializedDto } from 'src/lib/dtos/billing-serialized.dto';
import { Row } from 'src/lib/types/row.type';
import { createReadStream } from 'node:fs';

@Processor(BillingQueues.PROCESS_BANK_SLIP)
export class ProcessBankSlipQueue extends WorkerHost {
  private readonly saveAtPath: string = 'path/to/save/file';

  constructor(
    @InjectModel(Billing.name) private billingModel: Model<Billing>,
    private readonly pdfAPI: PdfAPI,
    private readonly emailSenderAPI: EmailSenderAPI,
  ) {
    super();
  }

  async process(job: Job<Row, any, string>): Promise<any> {
    try {
      const billingSerializedDto = plainToInstance(
        BillingSerializedDto,
        job.data,
        {
          enableImplicitConversion: true,
        },
      );

      const billingEntity = new BillingEntity(billingSerializedDto);

      const storedBilling = await this.billingModel.findOne({
        debtId: billingEntity.debtId,
      });

      if (!storedBilling) {
        await this.billingModel.create(billingEntity);
      }

      const generatedPDF = await this.pdfAPI.generate({
        path: this.saveAtPath,
        data: {
          personName: billingEntity.name,
          debtId: billingEntity.debtId,
          dueDate: billingEntity.debtDueDate,
        },
      });

      await this.emailSenderAPI.send({
        to: billingEntity.email,
        attachment: createReadStream(generatedPDF.path),
      });

      await this.billingModel.updateOne(
        {
          debtId: billingEntity.debtId,
        },
        { emailSentAt: new Date(), generatedBankSlipAt: new Date() },
      );
    } catch (error: unknown) {
      throw new GenerateBankSlipException(error as string);
    }
  }
}
