import { Queue, Job } from 'bullmq';
import { BillingQueues } from 'src/lib/enums/queue.enum';
import { QueueException } from 'src/lib/exception-filters/custom-exceptions/queue.exception';

export class QueueManager {
  private readonly queueMap: Map<BillingQueues, Queue>;

  constructor(private readonly queues: Queue[]) {
    this.queueMap = new Map(
      this.queues.map((queue) => [queue.name as BillingQueues, queue]),
    );
  }

  async addJobToQueue(
    queueName: BillingQueues,
    jobData: any,
  ): Promise<Job<any>> {
    try {
      const queue = this.queueMap.get(queueName);

      if (!queue) {
        throw new Error(`Queue with name ${queueName} does not exist`);
      }

      return queue.add(queueName, jobData);
    } catch (error: unknown) {
      throw new QueueException((error as Error)?.message);
    }
  }
}
