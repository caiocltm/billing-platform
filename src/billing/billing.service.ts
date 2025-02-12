import { ConsoleLogger, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { BillingQueues } from 'src/lib/enums/queue.enum';
import { Row } from 'src/lib/types/row.type';
import { retryBackoffInterval } from 'src/lib/shared/retry-backoff-interval';

@Injectable()
export class BillingService {
  public static BATCH_SIZE = 1000;
  public static RETRY_ATTEMPTS = 10;
  private readonly logger = new ConsoleLogger({
    prefix: BillingService.name,
  });

  constructor(
    @InjectQueue(BillingQueues.PROCESS_BILLING)
    private processBankSlipQueue: Queue,
  ) {}

  async processBillingsBatch(
    billings: Row[],
    retryAttempts = 0,
  ): Promise<void> {
    this.logger.setContext(this.processBillingsBatch.name);

    if (retryAttempts >= BillingService.RETRY_ATTEMPTS) {
      this.logger.warn(
        `Maximum retry attempts of ${retryAttempts}/${BillingService.RETRY_ATTEMPTS} reached. Exiting process...`,
      );

      return;
    }

    const bulkParameters = billings.map((billing: Row) => ({
      name: BillingQueues.PROCESS_BILLING,
      data: billing,
      opts: {
        jobId: billing.debtId,
      },
    }));

    try {
      await this.processBankSlipQueue.addBulk(bulkParameters);
    } catch (error: unknown) {
      this.logger.error(
        `Error while adding jobs to the queue. Error ${(error as Error).message}`,
      );

      await retryBackoffInterval(1000, retryAttempts);

      return await this.processBillingsBatch(billings, (retryAttempts += 1));
    }
  }
}
