import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Multer } from 'multer';
import { FileValidationError } from '../../application/errors';
import { ImageFileValidator } from '../../application/validators';
import { MulterFileMapper } from '../mappers';


@Injectable()
export class ImageValidationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ImageValidationInterceptor.name);

  constructor(private readonly validator: ImageFileValidator) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    const multerFile: Multer.File | undefined = req.file;

    const uploadedFile = multerFile
      ? MulterFileMapper.toDomain(multerFile)
      : undefined;

    const requestedResize = req.body?.width || req.body?.height
      ? {
          width: req.body.width ? Number(req.body.width) : undefined,
          height: req.body.height ? Number(req.body.height) : undefined,
        }
      : undefined;

    const result = await this.validator.validate(uploadedFile, requestedResize);

    if (!result.isValid) {
      this.logger.warn(`File validation failed: ${result.error}`);
      throw new FileValidationError(result.error || 'File validation failed');
    }

    req.imageMetadata = result.data.metadata;
    req.imageMimeType = result.data.mimeType;

    return next.handle();
  }
}
  