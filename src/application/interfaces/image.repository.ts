import { Image } from '../../domain/entities/image.entity';
import {
  FindImagesParams,
  FindImagesResult,
  CreateImageData,
  UpdateImageData,
} from './image-repository.types';

export { FindImagesParams, FindImagesResult, CreateImageData, UpdateImageData };

export interface ImageRepository {
  findManyWithCount(params: FindImagesParams): Promise<FindImagesResult>;
  findById(id: string): Promise<Image | null>;
  create(data: CreateImageData): Promise<Image>;
  update(id: string, data: UpdateImageData): Promise<Image>;
  softDelete(id: string): Promise<void>;
}

export const ImageRepository = Symbol('ImageRepository');

