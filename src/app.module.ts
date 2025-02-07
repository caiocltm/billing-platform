import { AppController } from './app.controller';
import { Module } from '@nestjs/common';
import { BillingService } from './billing/billing.service';
import { ConfigModule } from '@nestjs/config';
import EnvVariables from './lib/config/env-variables.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: EnvVariables.validate,
    }),
  ],
  controllers: [AppController],
  providers: [BillingService],
})
export class AppModule {}
