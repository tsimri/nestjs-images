import { Test, TestingModule } from '@nestjs/testing';
import { ImageProcessorService } from './image-processor.service';
import { IStorageService } from '../../application/interfaces/storage.interface';
import { ImageRepository } from '../../application/interfaces/image.repository';
import { ProcessImageJob } from '../../application/interfaces/process-image-job.interface';
import { ImageStatus } from '../../domain/enums/image-status.enum';
import { Job } from 'bull';
import { promises as fs } from 'fs';
import * as sharp from 'sharp';

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    unlink: jest.fn(),
  },
}));

jest.mock('sharp');

const baseJob: ProcessImageJob = {
  imageId: '123',
  localFilePath: '/tmp/123.jpeg',
  originalWidth: 1920,
  originalHeight: 1080,
  targetWidth: 800,
  targetHeight: 600,
  format: 'jpeg',
  mimetype: 'image/jpeg',
};

const makeJob = (data: Partial<ProcessImageJob> = {}): Job<ProcessImageJob> =>
  ({
    id: '123',
    data: { ...baseJob, ...data },
  } as Job<ProcessImageJob>);

const mockSharp = (info: { width: number; height: number; format: string }) => {
  const instance = {
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue({
      data: Buffer.from('processed'),
      info,
    }),
  };
  (sharp as any).mockReturnValue(instance);
  return instance;
};

describe('ImageProcessorService', () => {
  let service: ImageProcessorService;
  let storage: jest.Mocked<IStorageService>;
  let repo: jest.Mocked<ImageRepository>;

  beforeEach(async () => {
    storage = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
      getFileUrl: jest.fn(),
    } as any;

    repo = {
      findManyWithCount: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    } as any;

    (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('input'));
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);
    storage.uploadFile.mockResolvedValue({
      url: 'https://storage/images/123.jpg',
      key: 'images/123.jpg',
      bucket: 'bucket',
    });
    repo.update.mockResolvedValue({} as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageProcessorService,
        { provide: 'IStorageService', useValue: storage },
        { provide: ImageRepository, useValue: repo },
      ],
    }).compile();

    service = module.get(ImageProcessorService);
    jest.clearAllMocks();
  });

  it('processes image and uploads result', async () => {
    mockSharp({ width: 800, height: 600, format: 'jpeg' });
    (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('input'));
    storage.uploadFile.mockResolvedValue({
      url: 'url',
      key: 'images/123.jpg',
      bucket: 'bucket',
    });

    await service.handleImageProcessing(makeJob());

    expect(fs.readFile).toHaveBeenCalledWith('/tmp/123.jpeg');
    expect(storage.uploadFile).toHaveBeenCalledWith(expect.any(Buffer), 'images/123.jpg', 'image/jpeg');
    expect(repo.update).toHaveBeenCalledWith('123', {
      url: 'url',
      width: 800,
      height: 600,
      status: ImageStatus.COMPLETED,
    });
    expect(fs.unlink).toHaveBeenCalledWith('/tmp/123.jpeg');
  });

  it('applies resize when target dimensions provided', async () => {
    const sharpMock = mockSharp({ width: 800, height: 600, format: 'jpeg' });

    await service.handleImageProcessing(makeJob({ targetWidth: 800, targetHeight: 600 }));

    expect(sharpMock.resize).toHaveBeenCalledWith(800, 600, { fit: 'inside', withoutEnlargement: false });
  });

  it('skips resize when no target dimensions', async () => {
    const sharpMock = mockSharp({ width: 1920, height: 1080, format: 'jpeg' });

    await service.handleImageProcessing(makeJob({ targetWidth: undefined, targetHeight: undefined }));

    expect(sharpMock.resize).not.toHaveBeenCalled();
  });

  it.each([
    ['jpeg', 'image/jpeg', 'jpg', 'jpeg'],
    ['png', 'image/png', 'png', 'png'],
    ['webp', 'image/webp', 'webp', 'webp'],
    ['gif', 'image/gif', 'png', 'png'], // converted to png
  ])('handles format %s', async (format, mimetype, expectedExt, sharpMethod) => {
    const sharpMock = mockSharp({ width: 800, height: 600, format: sharpMethod });

    await service.handleImageProcessing(makeJob({ format, mimetype }));

    if (format === 'png' || format === 'gif') {
      expect(sharpMock.png).toHaveBeenCalled();
    } else if (format === 'webp') {
      expect(sharpMock.webp).toHaveBeenCalled();
    } else {
      expect(sharpMock.jpeg).toHaveBeenCalled();
    }

    expect(storage.uploadFile).toHaveBeenCalledWith(expect.any(Buffer), `images/123.${expectedExt}`, expect.any(String));
  });

  it('marks image failed when readFile rejects', async () => {
    (fs.readFile as jest.Mock).mockRejectedValue(new Error('fs error'));

    await expect(service.handleImageProcessing(makeJob())).rejects.toThrow('fs error');
    expect(repo.update).toHaveBeenCalledWith('123', { status: ImageStatus.FAILED });
    expect(fs.unlink).toHaveBeenCalledWith('/tmp/123.jpeg');
  });

  it('marks image failed when processing fails', async () => {
    const sharpInstance = {
      resize: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
      png: jest.fn().mockReturnThis(),
      webp: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockRejectedValue(new Error('sharp fail')),
    };
    (sharp as any).mockReturnValue(sharpInstance);

    await expect(service.handleImageProcessing(makeJob())).rejects.toThrow('sharp fail');
    expect(repo.update).toHaveBeenCalledWith('123', { status: ImageStatus.FAILED });
    expect(fs.unlink).toHaveBeenCalledWith('/tmp/123.jpeg');
  });
});
