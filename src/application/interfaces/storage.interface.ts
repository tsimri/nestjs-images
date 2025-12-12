export interface UploadFileResult {
  key: string;
  url: string;
  bucket: string;
}

export interface IStorageService {
  uploadFile(
    file: Buffer,
    fileName: string,
    contentType?: string,
  ): Promise<UploadFileResult>;
  deleteFile(key: string): Promise<void>;
  getFileUrl(key: string): Promise<string>;
  getFileBuffer(key: string): Promise<Buffer>;
  fileExists(key: string): Promise<boolean>;
}

