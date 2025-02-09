import { Injectable } from '@nestjs/common';
import { appendFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export type GeneratePDFParams = {
  path: string;
  data: {
    personName: string;
    debtId: string;
    dueDate: Date;
  };
};

@Injectable()
export class PdfAPI {
  private readonly reportFile = join(
    __dirname,
    '..',
    '..',
    '..',
    'public',
    'generated-pdf.report.txt',
  );

  constructor() {
    writeFile(this.reportFile, '').catch((error: Error) =>
      console.log(error.message),
    );
  }

  public async generate(params: GeneratePDFParams): Promise<GeneratePDFParams> {
    return new Promise((resolve) => {
      appendFile(
        this.reportFile,
        `GENERATED PDF ------ Person name: [${params.data.personName}] => Debt ID: [${params.data.debtId}] => Due date: [${params.data.dueDate.toISOString()}]\n`,
      )
        .then(() => resolve(params))
        .catch((error: Error) => console.log(error.message));
    });
  }
}
