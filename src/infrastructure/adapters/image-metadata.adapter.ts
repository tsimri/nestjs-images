import * as sharp from 'sharp';
import { ImageMetadata } from '../../application/interfaces/image-metadata.interface';

export class ImageMetadataAdapter {
  static fromSharp(sharpMetadata: sharp.Metadata): ImageMetadata {
    return {
      width: sharpMetadata.width,
      height: sharpMetadata.height,
      format: sharpMetadata.format,
      size: sharpMetadata.size,
      space: sharpMetadata.space,
      channels: sharpMetadata.channels,
      depth: sharpMetadata.depth,
      density: sharpMetadata.density,
      hasProfile: sharpMetadata.hasProfile,
      hasAlpha: sharpMetadata.hasAlpha,
      orientation: sharpMetadata.orientation,
      isProgressive: sharpMetadata.isProgressive,
    };
  }
}
