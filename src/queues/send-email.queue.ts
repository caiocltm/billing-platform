import { BillingQueues } from '../lib/enums/queue.enum';
import { SendEmailException } from 'src/lib/exception-filters/custom-exceptions/send-email.exception';
import { EmailParams, EmailSenderAPI } from 'src/lib/apis/email-sender.api';
import { Billing } from '../billing/schemas/billing.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { BucketAPI } from 'src/lib/apis/bucket.api';

@Processor(BillingQueues.SEND_BANK_SLIP_EMAIL)
export class BankSlipEmailQueue extends WorkerHost {
  constructor(
    @InjectModel(Billing.name) private billingModel: Model<Billing>,
    private readonly emailSenderAPI: EmailSenderAPI,
    private readonly bucketAPI: BucketAPI,
  ) {
    super();
  }

  async process(job: Job<EmailParams, any, string>): Promise<any> {
    try {
      const generatedPDF = await this.bucketAPI.getFileStream({
        filename: job.data.billingEntity?.debtId as string,
        name: BillingQueues.GENERATE_BANK_SLIP,
      });

      await this.emailSenderAPI.send({
        to: job.data.to,
        attachment: generatedPDF.stream,
      });

      await this.billingModel.updateOne(
        {
          debtId: job.data.billingEntity?.debtId,
        },
        { emailSentAt: new Date() },
      );
    } catch (error: unknown) {
      throw new SendEmailException(error as string);
    }
  }
}
