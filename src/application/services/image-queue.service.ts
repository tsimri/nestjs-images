import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ProcessImageJob } from '../interfaces/process-image-job.interface';

@Injectable()
export class ImageQueueService {
  private readonly logger = new Logger(ImageQueueService.name);

  constructor(
    @InjectQueue('image-processing') private readonly imageQueue: Queue,
  ) {}

  async enqueueProcessing(job: ProcessImageJob): Promise<void> {
    await this.imageQueue.add(
      'process-image',
      job,
      {
        jobId: job.imageId,
        attempts: 3,
        backoff: 5000,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.log(`Enqueued image processing job: ${job.imageId}`);
  }

  async getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.imageQueue.getWaitingCount(),
      this.imageQueue.getActiveCount(),
      this.imageQueue.getCompletedCount(),
      this.imageQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }
}
