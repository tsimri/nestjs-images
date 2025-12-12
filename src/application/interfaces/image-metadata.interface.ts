export interface ImageMetadata {

  width?: number;

  height?: number;

  format?: string;
  
  size?: number;
  
  space?: string;
  
  channels?: number;
  
  depth?: string;
  
  density?: number;
  
  hasProfile?: boolean;

  hasAlpha?: boolean;

  orientation?: number;
  
  isProgressive?: boolean;
}
