import { BillingQueues } from '../lib/enums/queue.enum';
import { InjectModel } from '@nestjs/mongoose';
import { Billing } from '../billing/schemas/billing.schema';
import { Model } from 'mongoose';
import { BillingEntity } from 'src/billing/billing.entity';
import { StoreBillingException } from 'src/lib/exception-filters/custom-exceptions/store-billing.exception';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';

@Processor(BillingQueues.STORE_BILLING_ENTITY)
export class StoreBillingQueue extends WorkerHost {
  constructor(
    @InjectModel(Billing.name) private billingModel: Model<Billing>,
    @InjectQueue(BillingQueues.GENERATE_BANK_SLIP)
    private generateBankSlipQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<BillingEntity, any, string>): Promise<any> {
    try {
      const storedBilling = await this.billingModel.findOne({
        debtId: job.data.debtId,
      });

      if (storedBilling) {
        if (!storedBilling.generatedBankSlipAt) {
          const isJobQueued = !!((await this.generateBankSlipQueue.getJob(
            job.data.debtId,
          )) as Job) as boolean;

          if (!isJobQueued)
            await this.generateBankSlipQueue.add(
              BillingQueues.GENERATE_BANK_SLIP,
              job.data,
              {
                jobId: job.data.debtId,
              },
            );
        }

        return;
      }

      await this.billingModel.create({
        debtAmount: job.data.debtAmount,
        debtDueDate: job.data.debtDueDate,
        debtId: job.data.debtId,
        email: job.data.email,
        governmentId: job.data.governmentId,
        name: job.data.name,
      });
    } catch (error: unknown) {
      throw new StoreBillingException(error as string);
    }
  }
}
