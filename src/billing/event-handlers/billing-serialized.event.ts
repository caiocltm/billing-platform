import { plainToInstance } from 'class-transformer';
import { BillingEntity } from 'src/billing/billing.entity';
import { BillingSerializedDto } from '../../lib/dtos/billing-serialized.dto';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Events } from '../enums/events.enum';
import { Row } from 'src/lib/types/row.type';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BillingSerializedEvent {
  constructor(private eventEmitter: EventEmitter2) {}

  @OnEvent(Events.BILLING_SERIALIZED, { async: true })
  handle(data: Row): void {
    const billingSerializedDto = plainToInstance(BillingSerializedDto, data, {
      enableImplicitConversion: true,
    });

    const billingEntity = new BillingEntity(billingSerializedDto);

    this.eventEmitter.emit(Events.BILLING_ENTITY_CREATED, billingEntity);
  }
}
