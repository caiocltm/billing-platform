import { plainToInstance } from 'class-transformer';
import {
  Contains,
  IsEnum,
  IsNumber,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Local = 'local',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @Min(0)
  @Max(65535)
  PORT: number;

  @IsString()
  APP_NAME: string;

  @IsString()
  @Contains('mongodb://')
  DATABASE_URI: string;

  @IsString()
  DATABASE_NAME: string;

  @IsNumber()
  @Min(1)
  MAX_FILE_SIZE: number;

  @IsString()
  FILE_TYPE: string;
}

function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) throw new Error(errors.toString());

  return validatedConfig;
}

export default {
  validate,
};
