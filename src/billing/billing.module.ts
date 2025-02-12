import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { BillingQueues } from 'src/lib/enums/queue.enum';
import { DefaultJobOptions } from 'bullmq';
import { Billing, BillingSchema } from './schemas/billing.schema';
import { ProcessBillingQueue } from './queues/process-billing.queue';
import { EmailSenderAPI } from 'src/lib/apis/email-sender.api';
import { PdfAPI } from 'src/lib/apis/pdf.api';
import { BucketAPI } from 'src/lib/apis/bucket.api';
import { BankSlipGenerator } from './services/bank-skip-generator.service';
import { EmailNotifyBankSlipService } from './services/email-notify-bank-slip.service';
import { BillingRepository } from './billing.repository';
import { BillingService } from './billing.service';

const defaultJobOptions: DefaultJobOptions = {
  removeOnComplete: true,
  removeOnFail: true,
  attempts: 10,
  backoff: {
    type: 'exponential',
    delay: 500,
  },
};

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Billing.name, schema: BillingSchema }]),
    BullModule.registerQueue({
      name: BillingQueues.PROCESS_BILLING,
      defaultJobOptions,
    }),
  ],
  controllers: [],
  providers: [
    BankSlipGenerator,
    EmailNotifyBankSlipService,
    BillingRepository,
    ProcessBillingQueue,
    EmailSenderAPI,
    PdfAPI,
    BucketAPI,
    BillingService,
  ],
  exports: [
    BullModule,
    BankSlipGenerator,
    EmailNotifyBankSlipService,
    BillingRepository,
    ProcessBillingQueue,
    EmailSenderAPI,
    PdfAPI,
    BucketAPI,
    BillingService,
  ],
})
export class BillingModule {}
