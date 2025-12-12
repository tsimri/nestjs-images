export interface ProcessImageJob {
  imageId: string;
  localFilePath: string;
  originalWidth: number;
  originalHeight: number;
  targetWidth?: number;
  targetHeight?: number;
  format: string;
  mimetype: string;
}

