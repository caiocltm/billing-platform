import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConsoleLogger } from '@nestjs/common';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './lib/exception-filters/all-exception.filter';

function setupStaticPages(app: NestExpressApplication): void {
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');
}

function setupSwagger(appName: string, app: NestExpressApplication): void {
  const config = new DocumentBuilder()
    .setTitle(appName)
    .setDescription(
      'Uploads files, generates slips and send them to the user email.',
    )
    .setVersion('1.0.0')
    .addTag('billing')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, documentFactory);
}

function setupFilter(app: NestExpressApplication): void {
  app.useGlobalFilters(new AllExceptionsFilter());
}

async function bootstrap(): Promise<void> {
  const appName = process.env.APP_NAME as string;
  const logger = new ConsoleLogger({
    prefix: appName,
    context: 'App bootstrap',
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger,
  });

  setupSwagger(appName, app);
  setupStaticPages(app);
  setupFilter(app);

  await app.listen(process.env.PORT as string, () => {
    logger.log(`Server successfully initiated at port ${process.env.PORT}`);
  });
}

void bootstrap();
