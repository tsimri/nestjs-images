import { Image } from './image.entity';
import { ImageStatus } from '../enums/image-status.enum';

describe('Image Entity', () => {
  describe('constructor', () => {
    it('should create image with valid data', () => {
      const imageData = {
        id: '123',
        url: 'https://example.com/image.jpg',
        title: 'Test Image',
        width: 800,
        height: 600,
        status: ImageStatus.COMPLETED,
        createdAt: new Date(),
        deletedAt: null,
      };

      const image = new Image(imageData);

      expect(image.id).toBe('123');
      expect(image.url).toBe('https://example.com/image.jpg');
      expect(image.title).toBe('Test Image');
      expect(image.width).toBe(800);
      expect(image.height).toBe(600);
      expect(image.status).toBe(ImageStatus.COMPLETED);
      expect(image.createdAt).toEqual(imageData.createdAt);
      expect(image.deletedAt).toBeNull();
      expect(image.isDeleted).toBe(false);
    });


    it('should create image in PROCESSING status', () => {
      const image = new Image({
        id: '123',
        url: '',
        title: null,
        width: 800,
        height: 600,
        status: ImageStatus.PROCESSING,
        createdAt: new Date(),
        deletedAt: null,
      });

      expect(image.status).toBe(ImageStatus.PROCESSING);
    });
  });

  describe('isDeleted getter', () => {
    it('should return false when deletedAt is null', () => {
      const image = new Image({
        id: '123',
        url: 'https://example.com/image.jpg',
        title: null,
        width: 800,
        height: 600,
        status: ImageStatus.COMPLETED,
        createdAt: new Date(),
        deletedAt: null,
      });

      expect(image.isDeleted).toBe(false);
    });

    it('should return true when deletedAt is set', () => {
      const deletedAt = new Date();
      const image = new Image({
        id: '123',
        url: 'https://example.com/image.jpg',
        title: null,
        width: 800,
        height: 600,
        status: ImageStatus.COMPLETED,
        createdAt: new Date(),
        deletedAt,
      });

      expect(image.isDeleted).toBe(true);
    });
  });

  describe('softDelete', () => {
    it('should soft delete image', () => {
      const image = new Image({
        id: '123',
        url: 'https://example.com/image.jpg',
        title: null,
        width: 800,
        height: 600,
        status: ImageStatus.COMPLETED,
        createdAt: new Date(),
        deletedAt: null,
      });

      expect(image.isDeleted).toBe(false);

      image.softDelete();

      expect(image.isDeleted).toBe(true);
      expect(image.deletedAt).toBeInstanceOf(Date);
      expect(image.deletedAt!.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('image lifecycle', () => {
    it('should support full lifecycle: create -> delete -> restore', () => {
      const image = new Image({
        id: '123',
        url: 'https://example.com/image.jpg',
        title: 'Lifecycle Test',
        width: 800,
        height: 600,
        status: ImageStatus.COMPLETED,
        createdAt: new Date(),
        deletedAt: null,
      });

      // Initial state
      expect(image.isDeleted).toBe(false);

      // Delete
      image.softDelete();
      expect(image.isDeleted).toBe(true);

      // Restore
      image.restore();
      expect(image.isDeleted).toBe(false);
    });
  });
});
