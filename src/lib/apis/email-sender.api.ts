import { Injectable } from '@nestjs/common';
import { Readable } from 'node:stream';
import { BillingEntity } from 'src/billing/billing.entity';

export interface EmailParams {
  to: string;
  attachment: Readable;
  billingEntity?: BillingEntity;
}

@Injectable()
export class EmailSenderAPI {
  constructor() {}

  public async send(params: EmailParams): Promise<EmailParams> {
    return new Promise((resolve) => resolve(params));
  }
}
