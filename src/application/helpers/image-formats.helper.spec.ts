import {
  FORMAT_TO_MIME,
  SUPPORTED_IMAGE_FORMATS,
  getSupportedMimeTypes,
  getMimeType,
  isSupportedFormat,
} from './image-formats.helper';

describe('Image Formats Helper', () => {
  describe('FORMAT_TO_MIME', () => {
    it('maps common formats correctly', () => {
      expect(FORMAT_TO_MIME).toMatchObject({
        jpeg: 'image/jpeg',
        jpg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif',
        avif: 'image/avif',
      });
    });
  });

  describe('getSupportedMimeTypes', () => {
    it('returns unique mime types matching supported formats', () => {
      const mimeTypes = getSupportedMimeTypes();
      const uniqueMimeTypes = Array.from(new Set(mimeTypes));

      expect(mimeTypes.length).toBe(uniqueMimeTypes.length);
      expect(mimeTypes).toEqual(expect.arrayContaining(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']));
    });
  });

  describe('getMimeType', () => {
    it.each([
      ['jpeg', 'image/jpeg'],
      ['jpg', 'image/jpeg'],
      ['png', 'image/png'],
      ['webp', 'image/webp'],
      ['gif', 'image/gif'],
      ['avif', 'image/avif'],
    ])('returns mime for %s', (format, expected) => {
      expect(getMimeType(format)).toBe(expected);
    });

    it('falls back to default for unknown', () => {
      expect(getMimeType('unknown')).toBe('image/jpeg');
      expect(getMimeType('', 'image/png')).toBe('image/png');
    });
  });

  describe('isSupportedFormat', () => {
    it.each(['jpeg', 'jpg', 'png', 'webp', 'gif', 'avif'])(
      'returns true for %s',
      format => {
        expect(isSupportedFormat(format)).toBe(true);
      },
    );

    it.each(['bmp', 'tiff', 'svg', '', null as any, undefined as any, 'PNG'])(
      'returns false for %s',
      format => {
        expect(isSupportedFormat(format)).toBe(false);
      },
    );
  });
});
