import Busboy from 'busboy';
import CSV from 'csv-parser';
import {
  ConsoleLogger,
  Controller,
  Get,
  Post,
  Render,
  Res,
  Req,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Row } from './lib/types/row.type';
import { Readable } from 'node:stream';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Events } from './billing/enums/events.enum';

@Controller()
export class AppController {
  public static VIEW_TEMPLATE_NAME = 'index';

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Get()
  @Render(AppController.VIEW_TEMPLATE_NAME)
  renderIndexPage(): void {
    new ConsoleLogger({ context: 'Index Page' }).log('Rendering index page...');
  }

  @Post('upload')
  uploadFile(@Req() req: Request, @Res() res: Response): void {
    const MAX_FILE_SIZE = this.configService.get('MAX_FILE_SIZE') as number;
    const FILE_TYPE = this.configService.get('FILE_TYPE') as string;
    const logger = new ConsoleLogger({ context: this.uploadFile.name });

    let linesProcessed = 0;
    let bytesRead = 0;

    const busboy = Busboy({
      headers: req.headers,
      limits: { fileSize: MAX_FILE_SIZE },
    });

    busboy.on(
      'file',
      (
        _fieldName: string,
        file: Readable,
        { mimeType, filename }: { filename: string; mimeType: string },
      ) => {
        const fileContentLength = parseInt(
          req.headers['content-length'] as string,
        );

        if (mimeType !== FILE_TYPE) {
          return res.render(AppController.VIEW_TEMPLATE_NAME, {
            result: `[INVALID_FILE_TYPE] Allowed only file of type ${FILE_TYPE}`,
            fileName: filename,
            fileSize: fileContentLength,
            fileType: mimeType,
            linesProcessed: 0,
          });
        }

        file.on('data', (chunk: Buffer) => {
          bytesRead += chunk.length;

          if (bytesRead > MAX_FILE_SIZE) {
            file.destroy();

            return res.render(AppController.VIEW_TEMPLATE_NAME, {
              result: `[INVALID_FILE_SIZE] Allowed only files with size less or equal than [${MAX_FILE_SIZE} bytes]`,
              fileName: filename,
              fileSize: fileContentLength,
              fileType: mimeType,
              linesProcessed,
            });
          }
        });

        file
          .pipe(CSV())
          .on('data', (data: Row) => {
            linesProcessed++;

            this.eventEmitter.emit(Events.BILLING_SERIALIZED, data);
          })
          .on('end', () => {
            const info = `Successfully uploaded ${FILE_TYPE} file ${filename} and processed ${linesProcessed} lines`;

            logger.log(info);

            return res.render(AppController.VIEW_TEMPLATE_NAME, {
              result: info,
              fileName: filename,
              fileSize: fileContentLength,
              fileType: mimeType,
              linesProcessed,
            });
          })
          .on('error', (error: Error) => {
            const info = `Error on upload ${FILE_TYPE} file ${filename}. Error: ${error.message}`;

            logger.error(info);

            file.destroy();

            return res.render(AppController.VIEW_TEMPLATE_NAME, {
              result: info,
              fileName: filename,
              fileSize: fileContentLength,
              fileType: mimeType,
              linesProcessed,
            });
          });
      },
    );

    busboy.on('error', (error: Error) => {
      busboy.destroy();

      return res.render(AppController.VIEW_TEMPLATE_NAME, {
        result: `Error on Busboy to upload file. Error: ${error.message}`,
        linesProcessed,
      });
    });

    req.pipe(busboy);
  }
}
