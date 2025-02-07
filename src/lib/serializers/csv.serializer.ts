import { Readable } from 'node:stream';
import CSV from 'csv-parser';
import { CSVRow } from '../interfaces/csv-row.interface';

export class CSVSerializer {
  private stream: Readable;

  constructor(stream: Readable) {
    this.stream = stream;
  }

  public async serialize(row: (row: CSVRow) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stream
        .pipe(CSV())
        .on('data', (data: CSVRow) => row(data))
        .on('end', () => resolve())
        .on('error', reject);
    });
  }
}
