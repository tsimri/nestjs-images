import { Image } from '../../domain/entities/image.entity';
import { ImageStatus } from '../../domain/enums/image-status.enum';

export interface FindImagesParams {
  title?: string;
  page: number;
  limit: number;
}

export interface FindImagesResult {
  images: Image[];
  total: number;
}

export interface CreateImageData {
  url: string;
  title: string | null;
  width: number;
  height: number;
  status: ImageStatus;
}

export interface UpdateImageData {
  url?: string;
  title?: string | null;
  width?: number;
  height?: number;
  status?: ImageStatus;
}

