import { Injectable, Inject, Logger } from '@nestjs/common';
import { ImageRepository } from '../interfaces/image.repository';
import { GetImagesQueryDto } from '../dto/get-images-query.dto';
import { ImageResponseDto } from '../dto/image-response.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';
import { UploadImageDto } from '../dto/upload-image.dto';
import { ImageMetadata } from '../interfaces/image-metadata.interface';
import { UploadedFile } from '../interfaces/uploaded-file.interface';
import { ImageStatus } from '../../domain/enums/image-status.enum';
import { Image } from '../../domain/entities/image.entity';
import { getMimeType as getMimeTypeHelper } from '../helpers';
import {
  ImageNotFoundError,
  ImageDeletedError,
  InvalidImageDimensionsError,
} from '../../domain/errors';
import { ImageUploadFailedError } from '../errors';
import { TempFileService } from './temp-file.service';
import { ImageQueueService } from './image-queue.service';


@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    @Inject(ImageRepository) private readonly imageRepository: ImageRepository,
    private readonly tempFileService: TempFileService,
    private readonly queueService: ImageQueueService,
  ) {}

  async findAll(
    query: GetImagesQueryDto,
  ): Promise<PaginatedResponseDto<ImageResponseDto>> {
    const { title, page = 1, limit = 10 } = query;

    const { images, total } = await this.imageRepository.findManyWithCount({
      title,
      page,
      limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: ImageResponseDto.fromEntities(images),
      page,
      limit,
      total,
      totalPages,
    };
  }

  async findOne(id: string): Promise<ImageResponseDto> {
    const image = await this.imageRepository.findById(id);

    if (!image) {
      throw new ImageNotFoundError(id);
    }

    if (image.isDeleted) {
      throw new ImageDeletedError(id);
    }

    return ImageResponseDto.fromEntity(image);
  }

  async uploadImage(
    file: UploadedFile,
    dto: UploadImageDto,
    metadata: ImageMetadata,
  ): Promise<ImageResponseDto> {
    const format = this.resolveFormat(metadata);
    const mimetype = this.getMimeType(format);

    let imageEntity: Image | null = null;
    let localFilePath: string | null = null;

    try {
      imageEntity = await this.createImageRecord(dto, metadata);

      localFilePath = await this.tempFileService.saveTempFile(
        imageEntity.id,
        file.buffer,
        format,
      );

      await this.queueService.enqueueProcessing({
        imageId: imageEntity.id,
        localFilePath,
        originalWidth: metadata.width,
        originalHeight: metadata.height,
        targetWidth: dto.width ? Number(dto.width) : undefined,
        targetHeight: dto.height ? Number(dto.height) : undefined,
        format,
        mimetype,
      });

      return ImageResponseDto.fromEntity(imageEntity);
    } catch (err) {
      this.logger.error('Image upload failed', err);

      // Cleanup on error
      if (localFilePath) {
        await this.tempFileService.removeTempFile(localFilePath);
      }

      if (imageEntity) {
        await this.markImageAsFailed(imageEntity.id);
      }

      throw new ImageUploadFailedError('Failed to upload image', err);
    }
  }

  private resolveFormat(metadata: ImageMetadata): string {
    return metadata.format || 'jpeg';
  }

  private getMimeType(format: string): string {
    return getMimeTypeHelper(format);
  }

  private async createImageRecord(
    dto: UploadImageDto,
    metadata: ImageMetadata,
  ): Promise<Image> {
    const originalWidth = metadata.width;
    const originalHeight = metadata.height;

    if (!originalWidth || !originalHeight) {
      throw new InvalidImageDimensionsError(
        'Unable to read image dimensions. The uploaded file may be corrupted or unsupported.',
      );
    }

    const requestedWidth =
      dto.width !== undefined ? Number(dto.width) : originalWidth;
    const requestedHeight =
      dto.height !== undefined ? Number(dto.height) : originalHeight;

    if (requestedWidth <= 0 || requestedHeight <= 0) {
      throw new InvalidImageDimensionsError(
        'Invalid image dimensions: width and height must be positive numbers.',
      );
    }

    return this.imageRepository.create({
      url: '',
      title: dto.title || null,
      width: requestedWidth,
      height: requestedHeight,
      status: ImageStatus.PROCESSING,
    });
  }

  private async markImageAsFailed(imageId: string): Promise<void> {
    try {
      await this.imageRepository.update(imageId, {
        status: ImageStatus.FAILED,
      });
      this.logger.log(`Marked image ${imageId} as failed`);
    } catch (err) {
      this.logger.error(
        `Failed to mark image ${imageId} as failed: ${err.message}`,
      );
    }
  }
}

