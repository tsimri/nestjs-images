export interface ValidationConfig {
  maxFileSize: number;

  maxDimension: number;

  allowedMimeTypes: string[];
}

export const VALIDATION_CONFIG = 'VALIDATION_CONFIG';
