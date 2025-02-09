import { InjectModel } from '@nestjs/mongoose';
import { Billing } from '../schemas/billing.schema';
import { Model } from 'mongoose';
import { BillingEntity } from 'src/billing/billing.entity';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Events } from '../enums/events.enum';
import { Injectable } from '@nestjs/common';
import { StoreBillingException } from 'src/lib/exception-filters/custom-exceptions/store-billing.exception';

@Injectable()
export class StoreBillingEvent {
  constructor(
    @InjectModel(Billing.name) private billingModel: Model<Billing>,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent(Events.BILLING_ENTITY_CREATED, { async: true })
  async handle(data: BillingEntity): Promise<void> {
    try {
      const storedBilling = await this.billingModel.findOne({
        debtId: data.debtId,
      });

      if (storedBilling) {
        if (!storedBilling.generatedBankSlipAt) {
          this.eventEmitter.emit(Events.GENERATE_BANK_SLIP, data);
        }

        return;
      }

      await this.billingModel.create({
        debtAmount: data.debtAmount,
        debtDueDate: data.debtDueDate,
        debtId: data.debtId,
        email: data.email,
        governmentId: data.governmentId,
        name: data.name,
      });

      this.eventEmitter.emit(Events.GENERATE_BANK_SLIP, data);
    } catch (error: unknown) {
      throw new StoreBillingException(error as string);
    }
  }
}
