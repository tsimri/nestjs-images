import { Process, Processor } from '@nestjs/bull';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bull';
import * as sharp from 'sharp';
import { promises as fs } from 'fs';
import { ProcessImageJob } from '../../application/interfaces/process-image-job.interface';
import { IStorageService } from '../../application/interfaces/storage.interface';
import { ImageRepository } from '../../application/interfaces/image.repository';
import { ImageStatus } from '../../domain/enums/image-status.enum';
import { getMimeType } from '../../application/helpers';


@Processor('image-processing')
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);

  constructor(
    @Inject('IStorageService') private readonly storage: IStorageService,
    @Inject(ImageRepository) private readonly imageRepository: ImageRepository,
  ) {}

  @Process('process-image')
  async handleImageProcessing(job: Job<ProcessImageJob>): Promise<void> {
    const data = job.data;
    const { imageId, localFilePath, originalWidth, originalHeight } = data;

    this.logger.log(
      `Processing image ${imageId} from local file: ${localFilePath}`,
    );

    let finalWidth = originalWidth;
    let finalHeight = originalHeight;

    try {
      this.logger.log(
        `Reading image ${imageId} from local filesystem: ${localFilePath}`,
      );
      const buffer = await fs.readFile(localFilePath);

      const {
        processedBuffer,
        width: processedWidth,
        height: processedHeight,
        extension,
        finalMimetype,
      } = await this.processImageBuffer(buffer, data);

      finalWidth = processedWidth ?? finalWidth;
      finalHeight = processedHeight ?? finalHeight;

      this.logger.log(
        `Uploading processed image ${imageId} to storage as ${extension}`,
      );

      const uploadResult = await this.storage.uploadFile(
        processedBuffer,
        `images/${imageId}.${extension}`,
        finalMimetype,
      );


      this.logger.log(`Updating image ${imageId} in database`);
      await this.imageRepository.update(imageId, {
        url: uploadResult.url,
        width: finalWidth,
        height: finalHeight,
        status: ImageStatus.COMPLETED,
      });

      this.logger.log(`Successfully processed image ${imageId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process image ${job.data.imageId}`,
        error instanceof Error ? error.stack : String(error),
      );

      await this.markImageAsFailed(job.data.imageId);

      throw error;
    } finally {
      await this.safeRemoveFile(job.data.localFilePath);
    }
  }

  private async processImageBuffer(
    buffer: Buffer,
    job: ProcessImageJob,
  ): Promise<{
    processedBuffer: Buffer;
    width?: number;
    height?: number;
    extension: string;
    finalMimetype: string;
  }> {
    const {
      imageId,
      originalWidth,
      originalHeight,
      targetWidth,
      targetHeight,
      format,
      mimetype,
    } = job;

    let sharpInstance = sharp(buffer);

    if (targetWidth || targetHeight) {
      this.logger.log(
        `Resizing image ${imageId} from ${originalWidth}x${originalHeight} to ${targetWidth || 'auto'}x${targetHeight || 'auto'}`,
      );

      const width = typeof targetWidth === 'number' ? targetWidth : undefined;
      const height = typeof targetHeight === 'number' ? targetHeight : undefined;

      sharpInstance = sharpInstance.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: false,
      });
    }

    let outputExtension = format;
    let outputMimetype = mimetype;

    switch (format) {
      case 'png':
        sharpInstance = sharpInstance.png();
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp();
        break;
      case 'gif':
        // GIF to PNG (first frame)
        sharpInstance = sharpInstance.png();
        outputExtension = 'png';
        outputMimetype = getMimeType('png');
        break;
      case 'jpeg':
      case 'jpg':
      default:
        sharpInstance = sharpInstance.jpeg({ quality: 90 });
        outputExtension = 'jpg';
        outputMimetype = getMimeType('jpg');
        break;
    }

    const { data, info } = await sharpInstance.toBuffer({
      resolveWithObject: true,
    });

    const finalWidth = info.width;
    const finalHeight = info.height;

    return {
      processedBuffer: data,
      width: finalWidth,
      height: finalHeight,
      extension: outputExtension,
      finalMimetype: outputMimetype,
    };
  }

  private async safeRemoveFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      this.logger.log(`Cleaned up temp file: ${filePath}`);
    } catch (err) {
      this.logger.warn(
        `Failed to cleanup temp file ${filePath}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  private async markImageAsFailed(imageId: string): Promise<void> {
    try {
      await this.imageRepository.update(imageId, {
        status: ImageStatus.FAILED,
      });
      this.logger.log(`Marked image ${imageId} as FAILED`);
    } catch (err) {
      this.logger.error(
        `Failed to mark image ${imageId} as FAILED`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}


