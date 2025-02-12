import { EmailSenderAPI } from 'src/lib/apis/email-sender.api';
import { Injectable } from '@nestjs/common';
import { BucketFile } from 'src/lib/apis/bucket.api';
import { SendEmailException } from 'src/lib/exception-filters/custom-exceptions/send-email.exception';

export type BankSlipEmailNotification = {
  email: string;
  subject: string;
  bucketFile: BucketFile;
};

@Injectable()
export class EmailNotifyBankSlipService {
  constructor(private readonly emailSenderAPI: EmailSenderAPI) {}

  async send(
    bankSlipEmailNotification: BankSlipEmailNotification,
  ): Promise<void> {
    try {
      await this.emailSenderAPI.send({
        to: bankSlipEmailNotification.email,
        attachment: bankSlipEmailNotification.bucketFile.getFileStream(),
        subject: bankSlipEmailNotification.subject,
      });
    } catch (error) {
      throw new SendEmailException()
        .errorAt(`${EmailNotifyBankSlipService.name}.${this.send.name}`)
        .dueTo(error);
    }
  }
}
