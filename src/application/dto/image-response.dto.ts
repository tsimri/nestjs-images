import { ApiProperty } from '@nestjs/swagger';
import { ImageStatus } from '../../domain/enums/image-status.enum';
import { Image } from '../../domain/entities/image.entity';

export class ImageResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the image',
    example: 'clh3x8q9s0000356d3e8h9g2i',
  })
  id: string;

  @ApiProperty({
    description: 'Pre-signed URL to access the image (empty string when status is processing)',
    example: 'https://s3.amazonaws.com/bucket/image.jpg?signature=...',
  })
  url: string;

  @ApiProperty({
    description: 'Image title',
    example: 'My vacation photo',
    nullable: true,
  })
  title: string | null;

  @ApiProperty({
    description: 'Image width in pixels',
    example: 800,
  })
  width: number;

  @ApiProperty({
    description: 'Image height in pixels',
    example: 600,
  })
  height: number;

  @ApiProperty({
    description: 'Image processing status',
    enum: ImageStatus,
    example: ImageStatus.COMPLETED,
  })
  status: ImageStatus; 

  static fromEntity(image: Image): ImageResponseDto {
    return {
      id: image.id,
      url: image.url,
      title: image.title,
      width: image.width,
      height: image.height,
      status: image.status,
    };
  }

  static fromEntities(images: Image[]): ImageResponseDto[] {
    return images.map(img => ImageResponseDto.fromEntity(img));
  }
}

