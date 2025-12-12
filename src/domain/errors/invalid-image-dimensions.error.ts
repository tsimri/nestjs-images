import { DomainError } from './domain-error';

export class InvalidImageDimensionsError extends DomainError {
  constructor(message: string = 'Invalid image dimensions') {
    super(message);
  }
}
