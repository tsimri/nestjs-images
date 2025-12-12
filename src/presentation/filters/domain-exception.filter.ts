import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '../../domain/errors/domain-error';
import { ImageNotFoundError } from '../../domain/errors/image-not-found.error';
import { ImageDeletedError } from '../../domain/errors/image-deleted.error';
import { InvalidImageDimensionsError } from '../../domain/errors/invalid-image-dimensions.error';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception.message;

    if (
      exception instanceof ImageNotFoundError ||
      exception instanceof ImageDeletedError
    ) {
      status = HttpStatus.NOT_FOUND;
    } else if (exception instanceof InvalidImageDimensionsError) {
      status = HttpStatus.BAD_REQUEST;
    }

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
