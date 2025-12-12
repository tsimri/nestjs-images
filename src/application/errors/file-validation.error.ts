import { ApplicationError } from './application-error';

export class FileValidationError extends ApplicationError {
  constructor(message: string) {
    super(message);
  }
}
