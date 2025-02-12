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
import { pipeline } from 'node:stream/promises';
import { BillingService } from './billing/billing.service';

@Controller()
export class AppController {
  private readonly logger = new ConsoleLogger({ prefix: AppController.name });
  public static VIEW_TEMPLATE_NAME = 'index';
  public static BATCH_SIZE = 200;
  private FILE_TYPE: string;
  private MAX_FILE_SIZE: number;

  constructor(
    private configService: ConfigService,
    private billingService: BillingService,
  ) {
    this.MAX_FILE_SIZE = this.configService.get('MAX_FILE_SIZE') as number;
    this.FILE_TYPE = this.configService.get('FILE_TYPE') as string;
  }

  @Get()
  @Render(AppController.VIEW_TEMPLATE_NAME)
  renderIndexPage(): void {
    this.logger.setContext(this.renderIndexPage.name);

    this.logger.log('Rendering index page...');
  }

  @Post('upload')
  uploadFile(@Req() req: Request, @Res() res: Response): void {
    this.logger.setContext(this.uploadFile.name);

    let linesProcessed = 0;

    const busboy = Busboy({
      headers: req.headers,
      limits: { fileSize: this.MAX_FILE_SIZE },
    });

    busboy.on(
      'file',
      (
        _fieldName: string,
        file: Readable,
        { mimeType, filename }: { filename: string; mimeType: string },
      ) => {
        if (mimeType !== this.FILE_TYPE) {
          req.unpipe(busboy);
          file.destroy();

          return res.render(AppController.VIEW_TEMPLATE_NAME, {
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            result: `[INVALID_FILE_TYPE] Allowed only file of type ${this.FILE_TYPE}`,
            fileName: filename,
            fileType: mimeType,
            linesProcessed: 0,
          });
        }

        file.on('limit', () => {
          req.unpipe(busboy);
          file.destroy();

          res.render(AppController.VIEW_TEMPLATE_NAME, {
            status: HttpStatus.PAYLOAD_TOO_LARGE,
            result: `[FILE_TOO_LARGE] File size exceeds the limit of ${this.MAX_FILE_SIZE} bytes.`,
            fileName: filename,
            fileType: mimeType,
            linesProcessed: 0,
          });
        });

        pipeline(
          file,
          CSV(),
          async function* (this: AppController, data: AsyncGenerator<Row>) {
            let batch: Row[] = [];

            for await (const billing of data) {
              linesProcessed++;

              if (batch.length >= AppController.BATCH_SIZE) {
                await this.billingService.processBillingsBatch(batch);

                batch = [];

                continue;
              }

              batch.push(billing);
            }

            if (batch.length) {
              await this.billingService.processBillingsBatch(batch);

              batch = [];
            }

            yield data;
          }.bind(this),
        )
          .then(() => {
            const info = `Successfully uploaded ${this.FILE_TYPE} file and initiated process of ${linesProcessed} billings`;

            this.logger.log(info);

            res.render(AppController.VIEW_TEMPLATE_NAME, {
              status: HttpStatus.OK,
              result: info,
              fileName: filename,
              fileType: mimeType,
              linesProcessed,
            });
          })
          .catch((error: Error) => {
            this.logger.error(
              `Error on upload ${this.FILE_TYPE} file ${filename}. Error: ${error?.message}`,
            );
          });
      },
    );

    busboy.on('error', (error: Error) => {
      req.unpipe(busboy);

      res.render(AppController.VIEW_TEMPLATE_NAME, {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        result: `Error on Busboy to upload file. Error: ${error.message}`,
        linesProcessed,
      });
    });

    req.pipe(busboy);
  }
}
