import { Multer } from 'multer';
import { UploadedFile } from '../../application/interfaces/uploaded-file.interface';

export class MulterFileMapper {
  static toDomain(multerFile: Multer.File): UploadedFile {
    return {
      buffer: multerFile.buffer,
      originalName: multerFile.originalname,
      mimeType: multerFile.mimetype,
      size: multerFile.size,
      encoding: multerFile.encoding,
      fieldName: multerFile.fieldname,
    };
  }
}
