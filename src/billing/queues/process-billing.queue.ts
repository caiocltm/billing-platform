import { BillingRepository } from '../billing.repository';
import { EmailNotifyBankSlipService } from '../services/email-notify-bank-slip.service';
import { BillingEntity } from 'src/billing/billing.entity';
import { BillingQueues } from '../../lib/enums/queue.enum';
import { ProcessBillingException } from 'src/lib/exception-filters/custom-exceptions/process-billing.exception';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { plainToInstance } from 'class-transformer';
import { BillingSerializedDto } from 'src/lib/dtos/billing-serialized.dto';
import { Row } from 'src/lib/types/row.type';
import { BankSlipGenerator } from '../services/bank-skip-generator.service';
import { Injectable } from '@nestjs/common';
import { BucketFile } from 'src/lib/apis/bucket.api';
import { Billing } from '../schemas/billing.schema';

@Processor(BillingQueues.PROCESS_BILLING, {
  name: BillingQueues.PROCESS_BILLING,
  concurrency: 100,
})
@Injectable()
export class ProcessBillingQueue extends WorkerHost {
  constructor(
    private readonly bankSlipGenerator: BankSlipGenerator,
    private readonly emailNotifyBankSlipService: EmailNotifyBankSlipService,
    private readonly billingRepository: BillingRepository,
  ) {
    super();
  }

  async process(job: Job<Row, any, string>): Promise<any> {
    try {
      const billingSerializedDto = plainToInstance(
        BillingSerializedDto,
        job.data,
        {
          enableImplicitConversion: true,
        },
      );

      const billingEntity = new BillingEntity(billingSerializedDto);

      const billing = await this.billingRepository.upsert(billingEntity);

      if (!billing) throw new Error('Error when upserting billing');

      await this.processBilling(billing, billingEntity);
    } catch (error: unknown) {
      throw new ProcessBillingException()
        .errorAt(`${ProcessBillingQueue.name}.${this.process.name}`)
        .dueTo(error);
    }
  }

  private async processBilling(
    billing: Billing,
    billingEntity: BillingEntity,
  ): Promise<void> {
    try {
      if (billing.generatedBankSlipAt && billing.emailSentAt) return;

      let bucketFile: BucketFile | null = null;

      if (!billing.generatedBankSlipAt)
        bucketFile = await this.generateBankSlip(billingEntity);

      if (!billing.emailSentAt && bucketFile) {
        await this.sendBankSlipNotification(billingEntity, bucketFile);

        return;
      }
    } catch (error: unknown) {
      throw new ProcessBillingException()
        .errorAt(`${ProcessBillingQueue.name}.${this.processBilling.name}`)
        .dueTo(error);
    }
  }

  private async generateBankSlip(
    billingEntity: BillingEntity,
  ): Promise<BucketFile> {
    try {
      const file = await this.bankSlipGenerator.generate(billingEntity);

      await this.billingRepository.updateGeneratedBankSlip(
        billingEntity.debtId,
        new Date(),
      );

      return file;
    } catch (error: unknown) {
      throw new ProcessBillingException()
        .errorAt(`${ProcessBillingQueue.name}.${this.generateBankSlip.name}`)
        .dueTo(error);
    }
  }

  private async sendBankSlipNotification(
    billingEntity: BillingEntity,
    bucketFile: BucketFile,
  ): Promise<boolean> {
    try {
      await this.emailNotifyBankSlipService.send({
        email: billingEntity.email,
        bucketFile,
        subject: `Bank slip for ${billingEntity.name} due to debt ${billingEntity.debtId}`,
      });

      await this.billingRepository.updateEmailSent(
        billingEntity.debtId,
        new Date(),
      );

      return true;
    } catch (error: unknown) {
      throw new ProcessBillingException()
        .errorAt(
          `${ProcessBillingQueue.name}.${this.sendBankSlipNotification.name}`,
        )
        .dueTo(error);
    }
  }
}
