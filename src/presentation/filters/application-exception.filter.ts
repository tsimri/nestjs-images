import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApplicationError } from '../../application/errors/application-error';
import { ImageUploadFailedError } from '../../application/errors/image-upload-failed.error';
import { InvalidFileFormatError } from '../../application/errors/invalid-file-format.error';
import { FileValidationError } from '../../application/errors/file-validation.error';

@Catch(ApplicationError)
export class ApplicationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApplicationExceptionFilter.name);

  catch(exception: ApplicationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception.message;

    if (
      exception instanceof InvalidFileFormatError ||
      exception instanceof FileValidationError
    ) {
      status = HttpStatus.BAD_REQUEST;
    } else if (exception instanceof ImageUploadFailedError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;

      this.logger.error(
        `ImageUploadFailedError: ${message}`,
        exception.cause?.stack || exception.stack,
      );
    }

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
