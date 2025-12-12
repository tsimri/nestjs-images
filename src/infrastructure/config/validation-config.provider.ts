import { ConfigService } from '@nestjs/config';
import { ValidationConfig, VALIDATION_CONFIG } from '../../application/config';
import { getSupportedMimeTypes } from '../../application/helpers';

export const ValidationConfigProvider = {
  provide: VALIDATION_CONFIG,
  useFactory: (configService: ConfigService): ValidationConfig => {
    const maxFileSizeMb = configService.get<number>('MAX_FILE_SIZE_MB', 100);
    const maxDimension = configService.get<number>('MAX_IMAGE_DIMENSION', 10000);

    return {
      maxFileSize: maxFileSizeMb * 1024 * 1024, // Convert MB to bytes
      maxDimension,
      allowedMimeTypes: getSupportedMimeTypes(),
    };
  },
  inject: [ConfigService],
};
