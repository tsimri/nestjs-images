import { DomainError } from './domain-error';

export class ImageDeletedError extends DomainError {
  constructor(imageId: string) {
    super(`Image with ID ${imageId} has been deleted`);
  }
}
