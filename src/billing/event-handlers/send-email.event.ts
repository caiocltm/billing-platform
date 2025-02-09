import { OnEvent } from '@nestjs/event-emitter';
import { Events } from '../enums/events.enum';
import { Injectable } from '@nestjs/common';
import { SendEmailException } from 'src/lib/exception-filters/custom-exceptions/send-email.exception';
import { EmailParams, EmailSenderAPI } from 'src/lib/apis/email-sender.api';
import { Billing } from '../schemas/billing.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class BankSlipEmailEvent {
  constructor(
    @InjectModel(Billing.name) private billingModel: Model<Billing>,
    private readonly emailSenderAPI: EmailSenderAPI,
  ) {}

  @OnEvent(Events.SEND_BANK_SLIP_EMAIL, { async: true })
  async handle(params: EmailParams): Promise<void> {
    try {
      await this.emailSenderAPI.send({
        to: params.to,
        attachment: params.attachment,
      });

      await this.billingModel.updateOne(
        {
          debtId: params.billingEntity?.debtId,
        },
        { emailSentAt: new Date() },
      );
    } catch (error: unknown) {
      throw new SendEmailException(error as string);
    }
  }
}
