import { ImageFileValidator } from './image-file.validator';
import { UploadedFile } from '../interfaces/uploaded-file.interface';
import { ValidationConfig } from '../config';
import * as sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';

jest.mock('file-type');
jest.mock('sharp');

const makeFile = (overrides: Partial<UploadedFile> = {}): UploadedFile => ({
  fieldName: 'file',
  originalName: 'test.jpg',
  encoding: '7bit',
  mimeType: 'image/jpeg',
  size: 1024,
  buffer: Buffer.from('fake-image'),
  ...overrides,
});

const mockSharpMeta = (meta: any) =>
  (sharp as any).mockReturnValue({
    metadata: jest.fn().mockResolvedValue(meta),
  });

describe('ImageFileValidator', () => {
  let validator: ImageFileValidator;
  let mockConfig: ValidationConfig;

  beforeEach(() => {
    mockConfig = {
      maxFileSize: 5 * 1024 * 1024,
      maxDimension: 4096,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    };

    validator = new ImageFileValidator(mockConfig);
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('rejects missing file', async () => {
      await expect(validator.validate(undefined)).resolves.toMatchObject({
        isValid: false,
        error: 'File is required',
      });
    });

    it('rejects oversized file', async () => {
      const file = makeFile({ size: mockConfig.maxFileSize + 1 });

      const result = await validator.validate(file);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });

    it('rejects invalid MIME', async () => {
      const file = makeFile({ mimeType: 'application/pdf' });
      (fileTypeFromBuffer as jest.Mock).mockResolvedValue({ mime: 'application/pdf', ext: 'pdf' });

      const result = await validator.validate(file);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid file format');
    });

    it('rejects when MIME cannot be detected', async () => {
      (fileTypeFromBuffer as jest.Mock).mockResolvedValue(null);
      const result = await validator.validate(makeFile());

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid file format');
    });

    it('rejects when detection throws', async () => {
      (fileTypeFromBuffer as jest.Mock).mockRejectedValue(new Error('Detection failed'));
      const result = await validator.validate(makeFile());

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Failed to detect file type');
    });

    it('rejects when metadata cannot be read', async () => {
      (fileTypeFromBuffer as jest.Mock).mockResolvedValue({ mime: 'image/jpeg', ext: 'jpg' });
      (sharp as any).mockReturnValue({
        metadata: jest.fn().mockRejectedValue(new Error('Invalid image')),
      });

      const result = await validator.validate(makeFile());

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid image file');
    });

    it('rejects when dimensions exceed max', async () => {
      (fileTypeFromBuffer as jest.Mock).mockResolvedValue({ mime: 'image/jpeg', ext: 'jpg' });
      mockSharpMeta({ width: 5000, height: 5000, format: 'jpeg' });

      const result = await validator.validate(makeFile());

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('dimensions too large');
    });

    it('accepts valid file and returns metadata', async () => {
      (fileTypeFromBuffer as jest.Mock).mockResolvedValue({ mime: 'image/jpeg', ext: 'jpg' });
      mockSharpMeta({ width: 1920, height: 1080, format: 'jpeg' });

      const result = await validator.validate(makeFile());

      expect(result.isValid).toBe(true);
      expect(result.data?.mimeType).toBe('image/jpeg');
      expect(result.data?.metadata.width).toBe(1920);
      expect(result.data?.metadata.height).toBe(1080);
    });

    it('rejects invalid resize values', async () => {
      (fileTypeFromBuffer as jest.Mock).mockResolvedValue({ mime: 'image/jpeg', ext: 'jpg' });
      mockSharpMeta({ width: 1920, height: 1080, format: 'jpeg' });

      const result = await validator.validate(makeFile(), { width: -1, height: 0 });

      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/Invalid (width|height) value/);
    });

    it('accepts valid resize request', async () => {
      (fileTypeFromBuffer as jest.Mock).mockResolvedValue({ mime: 'image/jpeg', ext: 'jpg' });
      mockSharpMeta({ width: 1920, height: 1080, format: 'jpeg' });

      const result = await validator.validate(makeFile(), { width: 800, height: 600 });

      expect(result.isValid).toBe(true);
    });
  });
});
