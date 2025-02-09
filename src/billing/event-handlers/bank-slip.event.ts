import { PdfAPI } from '../../lib/apis/pdf.api';
import { BillingEntity } from 'src/billing/billing.entity';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Events } from '../enums/events.enum';
import { Injectable } from '@nestjs/common';
import { GenerateBankSlipException } from 'src/lib/exception-filters/custom-exceptions/generate-bank-slip.exception';
import { PassThrough } from 'node:stream';
import { Billing } from '../schemas/billing.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class BankSlipEvent {
  private readonly saveAtPath: string = 'path/to/save/file';

  constructor(
    @InjectModel(Billing.name) private billingModel: Model<Billing>,
    private readonly eventEmitter: EventEmitter2,
    private readonly pdfAPI: PdfAPI,
  ) {}

  @OnEvent(Events.GENERATE_BANK_SLIP, { async: true })
  async handle(data: BillingEntity): Promise<void> {
    try {
      await this.pdfAPI.generate({
        path: this.saveAtPath,
        data: {
          personName: data.name,
          debtId: data.debtId,
          dueDate: data.debtDueDate,
        },
      });

      await this.billingModel.updateOne(
        {
          debtId: data.debtId,
        },
        { generatedBankSlipAt: new Date() },
      );

      this.eventEmitter.emit(Events.SEND_BANK_SLIP_EMAIL, {
        to: data.email,
        attachment: new PassThrough(),
        billingEntity: data,
      });
    } catch (error: unknown) {
      throw new GenerateBankSlipException(error as string);
    }
  }
}
