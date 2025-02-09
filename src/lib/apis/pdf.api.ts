import { Injectable } from '@nestjs/common';

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
  constructor() {}

  public async generate(params: GeneratePDFParams): Promise<GeneratePDFParams> {
    return new Promise((resolve) => resolve(params));
  }
}
