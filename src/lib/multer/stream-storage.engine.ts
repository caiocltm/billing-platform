import { StorageEngine } from 'multer';
import { Request } from 'express';
import { Readable } from 'stream'; // Import Readable
import { ConsoleLogger } from '@nestjs/common';

interface CustomFile extends Express.Multer.File {
  stream: Readable;
}

export class StreamStorageEngine implements StorageEngine {
  _handleFile(
    req: Request,
    file: CustomFile,
    callback: (error?: any, info?: Partial<CustomFile>) => void,
  ): void {
    const logger = new ConsoleLogger({
      prefix: 'Upload File',
      context: 'Stream Storage Engine',
    });

    const stream = new Readable();

    file.stream.on('data', (chunk) => {
      stream.push(chunk);
    });

    file.stream.on('end', () => {
      stream.push(null);

      let fileSize = 0;

      stream.on('data', (chunk: Buffer) => {
        fileSize += chunk.length;
      });

      stream.on('end', () => {
        logger.log(
          `File ${file.originalname} streamed. Size: ${fileSize} bytes`,
        );

        callback(null, {
          stream,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: fileSize,
        });
      });

      stream.on('error', (err) => {
        logger.error('Error in stream', err);
        callback(err);
      });
    });

    file.stream.on('error', (error) => {
      logger.error('Error streaming file:', error);

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
