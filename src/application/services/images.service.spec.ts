import { Test, TestingModule } from '@nestjs/testing';
import { ImagesService } from './images.service';
import { ImageRepository } from '../interfaces/image.repository';
import { TempFileService } from './temp-file.service';
import { ImageQueueService } from './image-queue.service';
import { GetImagesQueryDto } from '../dto/get-images-query.dto';
import { UploadImageDto } from '../dto/upload-image.dto';
import { ImageMetadata } from '../interfaces/image-metadata.interface';
import { UploadedFile } from '../interfaces/uploaded-file.interface';
import { Image } from '../../domain/entities/image.entity';
import { ImageStatus } from '../../domain/enums/image-status.enum';
import { ImageNotFoundError, ImageDeletedError, InvalidImageDimensionsError } from '../../domain/errors';
import { ImageUploadFailedError } from '../errors';

describe('ImagesService', () => {
  let service: ImagesService;
  let repo: jest.Mocked<ImageRepository>;
  let temp: jest.Mocked<TempFileService>;
  let queue: jest.Mocked<ImageQueueService>;

  const makeImage = (overrides: Partial<Image> = {}) =>
    new Image({
      id: '123',
      url: 'url',
      title: 'title',
      width: 800,
      height: 600,
      status: ImageStatus.COMPLETED,
      createdAt: new Date(),
      deletedAt: null,
      ...overrides,
    });

  const file: UploadedFile = {
    fieldName: 'file',
    originalName: 'test.jpg',
    encoding: '7bit',
    mimeType: 'image/jpeg',
    size: 1024,
    buffer: Buffer.from('data'),
  };

  const metadata: ImageMetadata = { width: 1920, height: 1080, format: 'jpeg' };
  const dto: UploadImageDto = { title: 'Test', width: 800, height: 600 };

  beforeEach(async () => {
    repo = {
      findManyWithCount: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    } as any;

    temp = {
      saveTempFile: jest.fn(),
      removeTempFile: jest.fn(),
      ensureTempDir: jest.fn(),
      getTempDir: jest.fn(),
    } as any;

    queue = {
      enqueueProcessing: jest.fn(),
      getQueueStats: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImagesService,
        { provide: ImageRepository, useValue: repo },
        { provide: TempFileService, useValue: temp },
        { provide: ImageQueueService, useValue: queue },
      ],
    }).compile();

    service = module.get(ImagesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('findAll returns paginated data', async () => {
    repo.findManyWithCount.mockResolvedValue({ images: [makeImage()], total: 1 });

    const query: GetImagesQueryDto = { page: 1, limit: 10 };
    const result = await service.findAll(query);

    expect(result.total).toBe(1);
    expect(result.data[0].id).toBe('123');
    expect(repo.findManyWithCount).toHaveBeenCalledWith({ title: undefined, page: 1, limit: 10 });
  });

  it('findOne throws when not found', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.findOne('x')).rejects.toBeInstanceOf(ImageNotFoundError);
  });

  it('findOne returns image', async () => {
    repo.findById.mockResolvedValue(makeImage({ id: '42' }));

    const result = await service.findOne('42');

    expect(result.id).toBe('42');
  });

  it('uploadImage happy path enqueues processing', async () => {
    const created = makeImage({ id: 'new', status: ImageStatus.PROCESSING });
    repo.create.mockResolvedValue(created);
    temp.saveTempFile.mockResolvedValue('/tmp/new.jpeg');
    queue.enqueueProcessing.mockResolvedValue();

    const result = await service.uploadImage(file, dto, metadata);

    expect(result.id).toBe('new');
    expect(temp.saveTempFile).toHaveBeenCalledWith('new', file.buffer, 'jpeg');
    expect(queue.enqueueProcessing).toHaveBeenCalledWith(
      expect.objectContaining({
        imageId: 'new',
        localFilePath: '/tmp/new.jpeg',
        originalWidth: 1920,
        originalHeight: 1080,
        targetWidth: 800,
        targetHeight: 600,
        format: 'jpeg',
        mimetype: 'image/jpeg',
      }),
    );
  });

  it('uploadImage cleans up and marks failed on error', async () => {
    const created = makeImage({ id: 'fail', status: ImageStatus.PROCESSING });
    repo.create.mockResolvedValue(created);
    temp.saveTempFile.mockResolvedValue('/tmp/fail.jpeg');
    queue.enqueueProcessing.mockRejectedValue(new Error('queue fail'));

    await expect(service.uploadImage(file, dto, metadata)).rejects.toBeInstanceOf(ImageUploadFailedError);
    expect(temp.removeTempFile).toHaveBeenCalledWith('/tmp/fail.jpeg');
    expect(repo.update).toHaveBeenCalledWith('fail', { status: ImageStatus.FAILED });
  });

  it('uploadImage wraps invalid dimensions as upload failure', async () => {
    const badMeta: ImageMetadata = { width: undefined as any, height: 100, format: 'jpeg' };

    await expect(service.uploadImage(file, dto, badMeta)).rejects.toBeInstanceOf(ImageUploadFailedError);
    expect(repo.create).not.toHaveBeenCalled();
  });
});
