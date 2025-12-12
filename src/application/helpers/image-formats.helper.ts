export const FORMAT_TO_MIME: Record<string, string> = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
};

export const SUPPORTED_IMAGE_FORMATS = Object.keys(FORMAT_TO_MIME);

export const getSupportedMimeTypes = (): string[] => {
  return Array.from(new Set(Object.values(FORMAT_TO_MIME)));
};

export const getMimeType = (format: string, defaultMime = 'image/jpeg'): string => {
  return FORMAT_TO_MIME[format] || defaultMime;
};

export const isSupportedFormat = (format: string): boolean => {
  return SUPPORTED_IMAGE_FORMATS.includes(format);
};

