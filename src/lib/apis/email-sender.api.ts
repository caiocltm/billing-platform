import { Injectable } from '@nestjs/common';
import { appendFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { BillingEntity } from 'src/billing/billing.entity';

export interface EmailParams {
  to: string;
  attachment: PassThrough;
  billingEntity?: BillingEntity;
}

@Injectable()
export class EmailSenderAPI {
  private readonly reportFile = join(
    __dirname,
    '..',
    '..',
    '..',
    'public',
    'email-sent.report.txt',
  );

  constructor() {
    writeFile(this.reportFile, '').catch((error: Error) =>
      console.log(error.message),
    );
  }

  public async send(params: EmailParams): Promise<EmailParams> {
    return new Promise((resolve) => {
      appendFile(
        this.reportFile,
        `SENT EMAIL ------ To: [${params.to}] => Debt ID: [${params.billingEntity?.debtId}]\n`,
      )
        .then(() => resolve(params))
        .catch((error: Error) => console.log(error.message));
    });
  }
}
