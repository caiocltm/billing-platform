import { Model } from 'mongoose';
import { Billing } from './schemas/billing.schema';
import { InjectModel } from '@nestjs/mongoose';
import { BillingEntity } from './billing.entity';
import { Injectable } from '@nestjs/common';
import { DatabaseOperation } from 'src/lib/exception-filters/custom-exceptions/database-operation.exception';

interface IBillingRepository {
  upsert(billingEntity: BillingEntity): Promise<Billing>;

  updateGeneratedBankSlip(
    debtId: string,
    generatedBankSlipAt: Date,
  ): Promise<void>;

  updateEmailSent(debtId: string, emailSentAt: Date): Promise<void>;
}

@Injectable()
export class BillingRepository implements IBillingRepository {
  constructor(
    @InjectModel(Billing.name) private billingModel: Model<Billing>,
  ) {}

  async upsert(billingEntity: BillingEntity): Promise<Billing> {
    try {
      const storedBilling = await this.billingModel.findOneAndUpdate(
        { debtId: billingEntity.debtId },
        billingEntity,
        { upsert: true, new: true },
      );

      if (!storedBilling) throw new Error('Error when upserting billing');

      return storedBilling;
    } catch (error: unknown) {
      throw new DatabaseOperation()
        .errorAt(`${BillingRepository.name}.${this.upsert.name}`)
        .dueTo(error);
    }
  }

  async updateGeneratedBankSlip(
    debtId: string,
    generatedBankSlipAt: Date,
  ): Promise<void> {
    try {
      await this.billingModel.updateOne({ debtId }, { generatedBankSlipAt });
    } catch (error: unknown) {
      throw new DatabaseOperation()
        .errorAt(
          `${BillingRepository.name}.${this.updateGeneratedBankSlip.name}`,
        )
        .dueTo(error);
    }
  }

  async updateEmailSent(debtId: string, emailSentAt: Date): Promise<void> {
    try {
      await this.billingModel.updateOne({ debtId }, { emailSentAt });
    } catch (error: unknown) {
      throw new DatabaseOperation()
        .errorAt(`${BillingRepository.name}.${this.updateEmailSent.name}`)
        .dueTo(error);
    }
  }
}
