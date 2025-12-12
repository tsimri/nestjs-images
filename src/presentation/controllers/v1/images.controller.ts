import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseInterceptors,
  Body,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { ImagesService } from '../../../application/services/images.service';
import { GetImagesQueryDto } from '../../../application/dto/get-images-query.dto';
import { UploadImageDto } from '../../../application/dto/upload-image.dto';
import { ImageResponseDto } from '../../../application/dto/image-response.dto';
import { PaginatedResponseDto } from '../../../application/dto/paginated-response.dto';
import { ImageMetadata } from '../../../application/interfaces/image-metadata.interface';
import { UploadedFile } from '../../../application/interfaces/uploaded-file.interface';
import { ImageValidationInterceptor } from '../../interceptors/file-validation.interceptor';
import { UploadedFileParam } from '../../decorators';

type ImageRequest = Request & { imageMetadata?: ImageMetadata };

@ApiTags('images')
@Controller({ path: 'images', version: '1' })
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @Throttle({ default: { limit: 60, ttl: 60000 } }) // 60 uploads per 60 seconds
  @ApiOperation({
    summary: 'Upload a new image',
    description:
      'Upload an image file with optional resizing parameters. The image will be processed asynchronously and stored in S3. Rate limited to 60 requests per minute.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file and optional metadata',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, WebP, GIF, TIFF)',
        },
        title: {
          type: 'string',
          description: 'Image title',
          example: 'My vacation photo',
        },
        width: {
          type: 'number',
          description: 'Target width for resizing',
          minimum: 1,
          maximum: 10000,
          example: 800,
        },
        height: {
          type: 'number',
          description: 'Target height for resizing',
          minimum: 1,
          maximum: 10000,
          example: 600,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully and queued for processing',
    type: ImageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file format or validation error',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max (will be validated in ImageValidationInterceptor)
      },
    }),
    ImageValidationInterceptor,
  )
  async uploadImage(
    @UploadedFileParam() file: UploadedFile,
    @Body() dto: UploadImageDto,
    @Req() req: ImageRequest,
  ): Promise<ImageResponseDto> {
    return this.imagesService.uploadImage(file, dto, req.imageMetadata);
  }

  @Get()
  @Throttle({ default: { limit: 90, ttl: 60000 } }) // 90 requests per 60 seconds
  @ApiOperation({
    summary: 'Get list of images',
    description:
      'Retrieve a paginated list of images with optional filtering by title. Rate limited to 90 requests per minute.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of images retrieved successfully',
    type: PaginatedResponseDto<ImageResponseDto>,
  })
  async getImages(
    @Query() query: GetImagesQueryDto,
  ): Promise<PaginatedResponseDto<ImageResponseDto>> {
    return this.imagesService.findAll(query);
  }

  @Get(':id')
  @Throttle({ default: { limit: 120, ttl: 60000 } }) // 120 requests per 60 seconds
  @ApiOperation({
    summary: 'Get image by ID',
    description: 'Retrieve detailed information about a specific image. Rate limited to 120 requests per minute.',
  })
  @ApiParam({
    name: 'id',
    description: 'Image unique identifier',
    example: 'clh3x8q9s0000356d3e8h9g2i',
  })
  @ApiResponse({
    status: 200,
    description: 'Image details retrieved successfully',
    type: ImageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Image not found',
  })
  async getImageById(@Param('id') id: string): Promise<ImageResponseDto> {
    return this.imagesService.findOne(id);
  }
}

