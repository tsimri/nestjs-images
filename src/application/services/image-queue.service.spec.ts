import { Test, TestingModule } from '@nestjs/testing';
import { ImageQueueService } from './image-queue.service';
import { getQueueToken } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { ProcessImageJob } from '../interfaces/process-image-job.interface';

describe('ImageQueueService', () => {
  let service: ImageQueueService;
  let mockQueue: jest.Mocked<Queue>;

  const mockJob: ProcessImageJob = {
    imageId: '123',
    localFilePath: '/tmp/123.jpeg',
    originalWidth: 1920,
    originalHeight: 1080,
    targetWidth: 800,
    targetHeight: 600,
    format: 'jpeg',
    mimetype: 'image/jpeg',
  };

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn(),
      getWaitingCount: jest.fn(),
      getActiveCount: jest.fn(),
      getCompletedCount: jest.fn(),
      getFailedCount: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageQueueService,
        {
          provide: getQueueToken('image-processing'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<ImageQueueService>(ImageQueueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('enqueueProcessing', () => {
    it('enqueues process-image job with correct payload and options', async () => {
      mockQueue.add.mockResolvedValue({} as Job);

      await service.enqueueProcessing(mockJob);

      expect(mockQueue.add).toHaveBeenCalledWith('process-image', mockJob, {
        jobId: '123',
        attempts: 3,
        backoff: 5000,
        removeOnComplete: true,
        removeOnFail: false,
      });
    });

    it('propagates errors from queue.add', async () => {
      const error = new Error('Queue is full');
      mockQueue.add.mockRejectedValue(error);

      await expect(service.enqueueProcessing(mockJob)).rejects.toThrow('Queue is full');
    });
  });

  describe('getQueueStats', () => {
    it('returns queue statistics', async () => {
      mockQueue.getWaitingCount.mockResolvedValue(5);
      mockQueue.getActiveCount.mockResolvedValue(2);
      mockQueue.getCompletedCount.mockResolvedValue(100);
      mockQueue.getFailedCount.mockResolvedValue(3);

      const stats = await service.getQueueStats();

      expect(stats).toEqual({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
      });
      expect(mockQueue.getWaitingCount).toHaveBeenCalled();
      expect(mockQueue.getActiveCount).toHaveBeenCalled();
      expect(mockQueue.getCompletedCount).toHaveBeenCalled();
      expect(mockQueue.getFailedCount).toHaveBeenCalled();
    });

    it('propagates errors from queue count methods', async () => {
      const error = new Error('Queue connection lost');
      mockQueue.getWaitingCount.mockRejectedValue(error);

      await expect(service.getQueueStats()).rejects.toThrow('Queue connection lost');
    });
  });
});
