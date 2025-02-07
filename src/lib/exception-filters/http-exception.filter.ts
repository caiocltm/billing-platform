import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  ConsoleLogger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const logger = new ConsoleLogger({
      context: 'Exception filter',
      prefix: 'Exception',
    });
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    logger.error(exception.message);

    return response.render('index', {
      message: exception.message,
    });
  }
}
