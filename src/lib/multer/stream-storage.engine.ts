import { CSVSerializer } from './../serializer/csv.serializer';
import { StorageEngine } from 'multer';
import { Request } from 'express';
import { Readable } from 'stream'; // Import Readable
import { ConsoleLogger } from '@nestjs/common';

export interface CustomFile extends Express.Multer.File {
  stream: Readable;
  linesRead: number;
}

export class StreamStorageEngine implements StorageEngine {
  constructor(private readonly csvSerializer: CSVSerializer) {}

  _handleFile(
    req: Request,
    file: CustomFile,
    callback: (error?: any, info?: Partial<CustomFile>) => void,
  ): void {
    const logger = new ConsoleLogger({
      prefix: 'StreamStorageEngine',
      context: 'Uploading and Serializing File',
    });
    const headers: string[] = [];

    let fileSize = 0;
    let processedChunks = 0;
    let linesRead = 0;

    file.stream.on('data', (chunk: Buffer) => {
      let csvContent = chunk.toString().trim();

      if (processedChunks === 0) {
        headers.push(...csvContent.split('\n')[0].split(','));

        csvContent = csvContent.split('\n').slice(1).join('\n');
      }

      const objects = this.csvSerializer.serialize(csvContent, headers);

      fileSize += chunk.length;
      linesRead += objects.length;

      processedChunks++;
    });

    file.stream.on('end', () => {
      callback(null, {
        stream: file.stream,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: fileSize,
        linesRead,
      });
    });

    file.stream.on('error', (error: Error) => {
      logger.error('Error uploading file:', error);

      callback(error);
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
