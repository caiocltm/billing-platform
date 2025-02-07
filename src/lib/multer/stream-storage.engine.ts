import { CSVSerializer } from '../serializers/csv.serializer';
import { StorageEngine } from 'multer';
import { Request } from 'express';
import { Readable } from 'stream';
import { ConsoleLogger } from '@nestjs/common';
import { CSVRow } from '../interfaces/csv-row.interface';
import { appendFile } from 'fs/promises';

export interface CustomFile extends Express.Multer.File {
  stream: Readable;
  linesRead: number;
  processedChunks: number;
}

export class StreamStorageEngine implements StorageEngine {
  _handleFile(
    _req: Request,
    file: CustomFile,
    callback: (error?: any, info?: Partial<CustomFile>) => void,
  ): void {
    const logger = new ConsoleLogger({
      prefix: 'StreamStorageEngine',
      context: 'Uploading and Serializing File',
    });

    let fileSize = 0;
    let processedChunks = 0;
    let linesRead = 0;

    file.stream.on('data', (chunk: Buffer) => {
      processedChunks++;
      fileSize += chunk.length;
    });

    const csvSerializer = new CSVSerializer(file.stream);

    csvSerializer
      .serialize((row: CSVRow) => {
        linesRead++;
      })
      .then(() => {
        callback(null, {
          stream: file.stream,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: fileSize,
          linesRead,
          processedChunks,
        });
      })
      .catch((error) => {
        logger.error(error);
      });
  }

  _removeFile(
    req: Request,
    file: CustomFile,
    callback: (error: Error | null) => void,
  ): void {
    callback(null);
  }
}
