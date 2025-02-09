import { PdfAPI } from '../lib/apis/pdf.api';
import { BillingEntity } from 'src/billing/billing.entity';
import { BillingQueues } from '../lib/enums/queue.enum';
import { GenerateBankSlipException } from 'src/lib/exception-filters/custom-exceptions/generate-bank-slip.exception';
import { PassThrough } from 'node:stream';
import { Billing } from '../billing/schemas/billing.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';

@Processor(BillingQueues.GENERATE_BANK_SLIP)
export class BankSlipQueue extends WorkerHost {
  private readonly saveAtPath: string = 'path/to/save/file';

  constructor(
    @InjectModel(Billing.name) private billingModel: Model<Billing>,
    @InjectQueue(BillingQueues.SEND_BANK_SLIP_EMAIL)
    private sendBankSlipEmailQueue: Queue,
    private readonly pdfAPI: PdfAPI,
  ) {
    super();
  }

  async process(job: Job<BillingEntity, any, string>): Promise<any> {
    try {
      await this.pdfAPI.generate({
        path: this.saveAtPath,
        data: {
          personName: job.data.name,
          debtId: job.data.debtId,
          dueDate: job.data.debtDueDate,
        },
      });

      const isJobQueued = !!((await this.sendBankSlipEmailQueue.getJob(
        job.data.debtId,
      )) as Job) as boolean;

      if (isJobQueued) return;

      await this.sendBankSlipEmailQueue.add(
        BillingQueues.SEND_BANK_SLIP_EMAIL,
        {
          to: job.data.email,
          attachment: new PassThrough(),
          billingEntity: job.data,
        },
        {
          jobId: job.data.debtId,
        },
      );

      await this.billingModel.updateOne(
        {
          debtId: job.data.debtId,
        },
        { generatedBankSlipAt: new Date() },
      );
    } catch (error: unknown) {
      throw new GenerateBankSlipException(error as string);
    }
  }
}
