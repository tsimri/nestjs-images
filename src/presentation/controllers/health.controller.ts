import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisHealthIndicator } from '../../infrastructure/health/redis.health';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private prismaHealth: PrismaHealthIndicator,
    private redisHealth: RedisHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Get()
  @SkipThrottle() // Health check should not be rate limited for monitoring tools
  @HealthCheck()
  @ApiOperation({
    summary: 'Health check',
    description:
      'Check the health status of the application, including memory usage, disk space, database connectivity, and Redis. Not rate limited.',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check passed - all systems operational',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'ok',
        },
        info: {
          type: 'object',
          example: {
            memory_heap: { status: 'up' },
            memory_rss: { status: 'up' },
            storage: { status: 'up' },
            database: { status: 'up' },
            redis: { status: 'up' },
          },
        },
        error: {
          type: 'object',
          example: {},
        },
        details: {
          type: 'object',
          example: {
            memory_heap: { status: 'up' },
            memory_rss: { status: 'up' },
            storage: { status: 'up' },
            database: { status: 'up' },
            redis: { status: 'up' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Health check failed - service unavailable',
  })
  check() {
    return this.health.check([
      // Memory check - application uses less than 300MB
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      // RSS memory check - application uses less than 300MB
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
      // Disk check - more than 10% free space available
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9, // 90% disk usage threshold
        }),
      // PostgreSQL database connection check via Prisma
      () => this.prismaHealth.pingCheck('database', this.prisma as any),
      // Redis connection check via Bull queue
      () => this.redisHealth.pingCheck('redis'),
    ]);
  }
}
