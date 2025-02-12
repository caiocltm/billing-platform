import { PdfAPI } from 'src/lib/apis/pdf.api';
import { BillingEntity } from '../billing.entity';
import { BucketAPI, BucketFile } from 'src/lib/apis/bucket.api';
import { Injectable } from '@nestjs/common';
import { GenerateBankSlipFileException } from 'src/lib/exception-filters/custom-exceptions/generate-bank-slip-file.exception';

@Injectable()
export class BankSlipGenerator {
  private readonly saveAtPath: string = 'path/to/save/dummy.file';

  constructor(
    private readonly pdfAPI: PdfAPI,
    private readonly bucketApi: BucketAPI,
  ) {}

  async generate(billingEntity: BillingEntity): Promise<BucketFile> {
    try {
      const filename = `${billingEntity.email}-${billingEntity.debtId}.pdf`;

      await this.pdfAPI.generate({
        path: `${this.saveAtPath}/${filename}`,
        data: {
          personName: billingEntity.name,
          debtId: billingEntity.debtId,
          dueDate: billingEntity.debtDueDate,
        },
      });

      return this.bucketApi.uploadFromPath({ filename, path: this.saveAtPath });
    } catch (error: unknown) {
      throw new GenerateBankSlipFileException()
        .errorAt(`${BankSlipGenerator.name}.${this.generate.name}`)
        .dueTo(error);
    }
  }
}
