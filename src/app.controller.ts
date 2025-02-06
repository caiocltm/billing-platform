/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  ConsoleLogger,
  Controller,
  Get,
  Post,
  Render,
  UploadedFile,
  UseInterceptors,
  ParseFilePipeBuilder,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StreamStorageEngine } from './lib/multer/stream-storage.engine';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  @Render('index')
  renderIndexPage(): void {
    new ConsoleLogger({ context: 'Index Page' }).log('Rendering index page...');
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', { storage: new StreamStorageEngine() }),
  )
  uploadFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: 'text/csv',
        })
        .addMaxSizeValidator({
          maxSize: 110000000,
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          fileIsRequired: true,
        }),
    )
    file: Express.Multer.File,
    @Res() res: Response,
  ): void {
    const logger = new ConsoleLogger({ context: 'Upload File' });

    logger.log('Uploading .csv file...', file.mimetype, file.size, file.stream);

    return res.render('index', {
      message: 'File Uploaded!',
    });
  }
}
