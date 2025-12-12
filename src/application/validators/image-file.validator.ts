import { Injectable, Logger, Inject } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';
import * as sharp from 'sharp';
import { UploadedFile } from '../interfaces/uploaded-file.interface';
import { ImageMetadata } from '../interfaces/image-metadata.interface';
import { ValidationResult } from './validation-result.interface';
import { ValidationConfig, VALIDATION_CONFIG } from '../config';
import { ImageMetadataAdapter } from '../../infrastructure/adapters/image-metadata.adapter';

@Injectable()
export class ImageFileValidator {
  private readonly logger = new Logger(ImageFileValidator.name);

  constructor(
    @Inject(VALIDATION_CONFIG) private readonly config: ValidationConfig,
  ) {
    this.logger.log(
      `Image validation config: maxFileSize=${this.config.maxFileSize / 1024 / 1024}MB, maxDimension=${this.config.maxDimension}px`,
    );
  }

  async validate(
    file: UploadedFile | undefined,
    requestedResize?: { width?: number; height?: number },
  ): Promise<ValidationResult<{ metadata: ImageMetadata; mimeType: string }>> {
    const filePresenceResult = this.validateFilePresence(file);
    if (!filePresenceResult.isValid) {
      return { isValid: false, error: filePresenceResult.error };
    }

    const sizeResult = this.validateFileSize(file!.size);
    if (!sizeResult.isValid) {
      return { isValid: false, error: sizeResult.error };
    }

    const mimeResult = await this.detectAndValidateMime(file!.buffer);
    if (!mimeResult.isValid) {
      return { isValid: false, error: mimeResult.error };
    }

    const metadataResult = await this.readAndValidateMetadata(file!.buffer);
    if (!metadataResult.isValid) {
      return { isValid: false, error: metadataResult.error };
    }

    const metadata = metadataResult.data!;

    if (requestedResize) {
      const resizeResult = this.validateRequestedResize(requestedResize, metadata);
      if (!resizeResult.isValid) {
        return { isValid: false, error: resizeResult.error };
      }
    }

    return {
      isValid: true,
      data: {
        metadata,
        mimeType: mimeResult.data!,
      },
    };
  }


  private validateFilePresence(file: UploadedFile | undefined): ValidationResult<never> {
    if (!file) {
      return {
        isValid: false,
        error: 'File is required',
      };
    }

    return { isValid: true };
  }

  private validateFileSize(size: number): ValidationResult<never> {
    if (size > this.config.maxFileSize) {
      const maxMb = this.config.maxFileSize / 1024 / 1024;
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${maxMb}MB`,
      };
    }

    return { isValid: true };
  }

  private async detectAndValidateMime(buffer: Buffer): Promise<ValidationResult<string>> {
    try {
      const fileType = await fileTypeFromBuffer(buffer);

      if (!fileType || !this.config.allowedMimeTypes.includes(fileType.mime)) {
        this.logger.warn(
          `Invalid file type detected: ${fileType?.mime || 'unknown'}`,
        );
        return {
          isValid: false,
          error: 'Invalid file format. Only images are allowed.',
        };
      }

      return {
        isValid: true,
        data: fileType.mime,
      };
    } catch (error: any) {
      this.logger.error(`MIME type detection failed: ${error?.message || error}`);
      return {
        isValid: false,
        error: 'Failed to detect file type',
      };
    }
  }

  private async readAndValidateMetadata(
    buffer: Buffer,
  ): Promise<ValidationResult<ImageMetadata>> {
    let metadata: ImageMetadata;
    
    try {
      const sharpMetadata = await sharp(buffer).metadata();
      metadata = ImageMetadataAdapter.fromSharp(sharpMetadata);
    } catch (error: any) {
      this.logger.error(
        `Failed to read image metadata: ${error?.message || error}`,
      );
      return {
        isValid: false,
        error: 'Invalid image file',
      };
    }

    if (!metadata.width || !metadata.height) {
      return {
        isValid: false,
        error: 'Unable to read image dimensions',
      };
    }

    if (
      metadata.width > this.config.maxDimension ||
      metadata.height > this.config.maxDimension
    ) {
      return {
        isValid: false,
        error: `Image dimensions too large. Maximum allowed: ${this.config.maxDimension}x${this.config.maxDimension}`,
      };
    }

    return {
      isValid: true,
      data: metadata,
    };
  }

  private validateRequestedResize(
    requestedResize: { width?: number; height?: number },
    metadata: ImageMetadata,
  ): ValidationResult<never> {
    const { width, height } = requestedResize;

    if (width === undefined && height === undefined) {
      return { isValid: true };
    }

    if (width !== undefined && (isNaN(width) || width <= 0)) {
      return {
        isValid: false,
        error: 'Invalid width value',
      };
    }

    if (height !== undefined && (isNaN(height) || height <= 0)) {
      return {
        isValid: false,
        error: 'Invalid height value',
      };
    }

    return { isValid: true };
  }
}
