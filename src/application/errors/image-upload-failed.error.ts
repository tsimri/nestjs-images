import { ApplicationError } from './application-error';

export class ImageUploadFailedError extends ApplicationError {
  constructor(
    message: string = 'Failed to upload image',
    public readonly cause?: Error,
  ) {
    super(message);
  }
}
