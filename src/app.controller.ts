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
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Row } from './lib/types/row.type';
import { Readable } from 'node:stream';
import { ConfigService } from '@nestjs/config';
import { BillingQueues } from './lib/enums/queue.enum';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { QueueException } from './lib/exception-filters/custom-exceptions/queue.exception';

@Controller()
export class AppController {
  public static VIEW_TEMPLATE_NAME = 'index';

  constructor(
    private configService: ConfigService,
    @InjectQueue(BillingQueues.BILLING_SERIALIZED)
    private billingSerializedQueue: Queue,
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
        if (mimeType !== FILE_TYPE) {
          return res.render(AppController.VIEW_TEMPLATE_NAME, {
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            result: `[INVALID_FILE_TYPE] Allowed only file of type ${FILE_TYPE}`,
            fileName: filename,
            fileType: mimeType,
            linesProcessed: 0,
          });
        }

        file
          .pipe(CSV())
          .on('data', (data: Row) => {
            linesProcessed++;

            this.billingSerializedQueue
              .add(BillingQueues.BILLING_SERIALIZED, data)
              .catch((error: Error) => {
                throw new QueueException(error.message);
              });
          })
          .on('end', () => {
            const info = `Successfully uploaded ${FILE_TYPE} file ${filename} and processed ${linesProcessed} lines`;

            logger.log(info);

            return res.render(AppController.VIEW_TEMPLATE_NAME, {
              status: HttpStatus.OK,
              result: info,
              fileName: filename,
              fileType: mimeType,
              linesProcessed,
            });
          })
          .on('error', (error: Error) => {
            const info = `Error on upload ${FILE_TYPE} file ${filename}. Error: ${error.message}`;

            logger.error(info);

            file.destroy();

            return res.render(AppController.VIEW_TEMPLATE_NAME, {
              status: HttpStatus.INTERNAL_SERVER_ERROR,
              result: info,
              fileName: filename,
              fileType: mimeType,
              linesProcessed,
            });
          });
      },
    );

    busboy.on('error', (error: Error) => {
      return res.render(AppController.VIEW_TEMPLATE_NAME, {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        result: `Error on Busboy to upload file. Error: ${error.message}`,
        linesProcessed,
      });
    });

    req.pipe(busboy);
  }
}
