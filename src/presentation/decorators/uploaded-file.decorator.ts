import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UploadedFile as ApplicationUploadedFile } from '../../application/interfaces/uploaded-file.interface';
import { MulterFileMapper } from '../mappers';

export const UploadedFileParam = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ApplicationUploadedFile | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const multerFile = request.file;
    
    if (!multerFile) {
      return undefined;
    }
    
    return MulterFileMapper.toDomain(multerFile);
  },
);
