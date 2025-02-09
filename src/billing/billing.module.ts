import { Module } from '@nestjs/common';
import { BillingSerializedQueue } from '../queues/billing-serialized.queue';
import { StoreBillingQueue } from '../queues/store-billing.queue';
import { BankSlipQueue } from '../queues/bank-slip.queue';
import { MongooseModule } from '@nestjs/mongoose';
import { BillingSchema, Billing } from './schemas/billing.schema';
import { BankSlipEmailQueue } from '../queues/send-email.queue';
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
    BullModule.registerQueue(
      {
        name: BillingQueues.BILLING_SERIALIZED,
        defaultJobOptions,
      },
      {
        name: BillingQueues.STORE_BILLING_ENTITY,
        defaultJobOptions,
      },
      {
        name: BillingQueues.GENERATE_BANK_SLIP,
        defaultJobOptions,
      },
      {
        name: BillingQueues.SEND_BANK_SLIP_EMAIL,
        defaultJobOptions,
      },
    ),
  ],
  controllers: [],
  providers: [
    BankSlipEmailQueue,
    StoreBillingQueue,
    BillingSerializedQueue,
    BankSlipQueue,
    EmailSenderAPI,
    PdfAPI,
    BucketAPI,
  ],
  exports: [EmailSenderAPI, PdfAPI, BucketAPI],
})
export class BillingModule {}
