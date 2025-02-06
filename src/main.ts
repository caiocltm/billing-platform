import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConsoleLogger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      prefix: 'Billing Platform',
    }),
  });

  const config = new DocumentBuilder()
    .setTitle('Billing Platform')
    .setDescription('Uploads files and generates slips')
    .setVersion('1.0.0')
    .addTag('billing')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 8888);
}

void bootstrap();
