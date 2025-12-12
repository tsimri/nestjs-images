import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    @InjectQueue('image-processing') private readonly imageQueue: Queue,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    try {
      const client = await this.imageQueue.client;
      await client.ping();
      
      return this.healthIndicatorService.check(key).up();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.healthIndicatorService.check(key).down({ message: errorMessage });
    }
  }
}
