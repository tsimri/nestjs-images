import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  validateSync,
  Min,
  Max,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT?: number;

  @IsString()
  DATABASE_HOST?: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  DATABASE_PORT?: number;

  @IsString()
  DATABASE_USER?: string;

  @IsString()
  DATABASE_PASSWORD?: string;

  @IsString()
  DATABASE_NAME?: string;

  @IsString()
  AWS_ENDPOINT_URL?: string;

  @IsString()
  AWS_PUBLIC_ENDPOINT_URL?: string; // URL accessible from the browser (eg. http://localhost:4566)

  @IsString()
  AWS_ACCESS_KEY_ID?: string;

  @IsString()
  AWS_SECRET_ACCESS_KEY?: string;

  @IsString()
  AWS_REGION?: string;

  @IsString()
  AWS_S3_BUCKET_NAME?: string;

  @IsString()
  REDIS_HOST?: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  REDIS_PORT?: number;

  // Image validation settings
  @IsNumber()
  @Min(1)
  MAX_FILE_SIZE_MB?: number; // Default: 100MB

  @IsNumber()
  @Min(1)
  MAX_IMAGE_DIMENSION?: number; // Default: 10000
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: true,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}

