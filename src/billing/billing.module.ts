import { Module } from '@nestjs/common';
import { ProcessBankSlipQueue } from './queues/process-bank-slip.queue';
import { MongooseModule } from '@nestjs/mongoose';
import { BillingSchema, Billing } from './schemas/billing.schema';
import { EmailSenderAPI } from 'src/lib/apis/email-sender.api';
import { PdfAPI } from 'src/lib/apis/pdf.api';
import { BucketAPI } from 'src/lib/apis/bucket.api';
import { BillingQueues } from 'src/lib/enums/queue.enum';
import { BullModule } from '@nestjs/bullmq';
import { DefaultJobOptions } from 'bullmq';

const defaultJobOptions: DefaultJobOptions = {
  removeOnComplete: true,
  removeOnFail: true,
  attempts: 1000,
  backoff: {
    type: 'exponential',
    delay: 500,
  },
};

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Billing.name, schema: BillingSchema }]),
    BullModule.registerQueue({
      name: BillingQueues.PROCESS_BANK_SLIP,
      defaultJobOptions,
    }),
  ],
  controllers: [],
  providers: [ProcessBankSlipQueue, EmailSenderAPI, PdfAPI, BucketAPI],
  exports: [ProcessBankSlipQueue, EmailSenderAPI, PdfAPI, BucketAPI],
})
export class BillingModule {}
