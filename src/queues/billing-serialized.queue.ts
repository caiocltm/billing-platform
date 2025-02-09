import { plainToInstance } from 'class-transformer';
import { BillingEntity } from 'src/billing/billing.entity';
import { BillingSerializedDto } from '../lib/dtos/billing-serialized.dto';
import { BillingQueues } from '../lib/enums/queue.enum';
import { Row } from 'src/lib/types/row.type';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';

@Processor(BillingQueues.BILLING_SERIALIZED)
export class BillingSerializedQueue extends WorkerHost {
  constructor(
    @InjectQueue(BillingQueues.STORE_BILLING_ENTITY)
    private storeBillingQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<Row, any, string>): Promise<any> {
    const billingSerializedDto = plainToInstance(
      BillingSerializedDto,
      job.data,
      {
        enableImplicitConversion: true,
      },
    );

    const billingEntity = new BillingEntity(billingSerializedDto);

    await this.storeBillingQueue.add(
      BillingQueues.STORE_BILLING_ENTITY,
      billingEntity,
    );
  }
}
