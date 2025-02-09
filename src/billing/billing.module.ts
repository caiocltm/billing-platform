import { Module } from '@nestjs/common';
import { BillingSerializedEvent } from './event-handlers/billing-serialized.event';
import { StoreBillingEvent } from './event-handlers/store-billing.event';
import { BankSlipEvent } from './event-handlers/bank-slip.event';
import { MongooseModule } from '@nestjs/mongoose';
import { BillingSchema, Billing } from './schemas/billing.schema';
import { BankSlipEmailEvent } from './event-handlers/send-email.event';
import { EmailSenderAPI } from 'src/lib/apis/email-sender.api';
import { PdfAPI } from 'src/lib/apis/pdf.api';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Billing.name, schema: BillingSchema }]),
  ],
  controllers: [],
  providers: [
    BillingSerializedEvent,
    BankSlipEvent,
    StoreBillingEvent,
    BankSlipEmailEvent,
    EmailSenderAPI,
    PdfAPI,
  ],
  exports: [EmailSenderAPI, PdfAPI],
})
export class BillingModule {}
