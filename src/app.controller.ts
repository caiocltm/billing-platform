import {
  ConsoleLogger,
  Controller,
  Get,
  Post,
  Render,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import ParseFile from './lib/pipe/parse-file.pipe';
import FileInterceptor from './lib/interceptor/file.interceptor';
import { CustomFile } from './lib/multer/stream-storage.engine';

@Controller()
export class AppController {
  public static VIEW_TEMPLATE_NAME = 'index';

  constructor() {}

  @Get()
  @Render(AppController.VIEW_TEMPLATE_NAME)
  renderIndexPage(): void {
    new ConsoleLogger({ context: 'Index Page' }).log('Rendering index page...');
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor)
  uploadFile(
    @UploadedFile(ParseFile) file: CustomFile,
    @Res() res: Response,
  ): void {
    const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(4);

    res.render(AppController.VIEW_TEMPLATE_NAME, {
      result: 'File successfully uploaded',
      fileName: file.originalname,
      fileSize: `${fileSizeInMB}MB`,
      fileType: file.mimetype,
      linesProcessed: file.linesRead,
    });
  }
}
