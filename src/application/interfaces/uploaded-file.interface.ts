export interface UploadedFile {
  buffer: Buffer;
  
  originalName: string;
  
  mimeType: string;
  
  size: number;
  
  encoding?: string;
  
  fieldName?: string;
}
