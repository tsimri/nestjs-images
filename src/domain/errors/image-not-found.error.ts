import { DomainError } from './domain-error';

export class ImageNotFoundError extends DomainError {
  constructor(imageId: string) {
    super(`Image with ID ${imageId} not found`);
  }
}
