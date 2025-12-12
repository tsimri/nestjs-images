import { ApplicationError } from './application-error';

export class InvalidFileFormatError extends ApplicationError {
  constructor(message: string = 'Invalid or unsupported file type') {
    super(message);
  }
}
