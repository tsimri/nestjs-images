import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from './infrastructure/config/config.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { ImagesModule } from './presentation/modules/images.module';
import { HealthController } from './presentation/controllers/health.controller';
import { RedisHealthIndicator } from './infrastructure/health/redis.health';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      dest: './uploads',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds in milliseconds
        limit: 100, // Default limit for endpoints without specific throttle
      },
    ]),
    BullModule.forRootAsync({
      imports: [NestConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    // Import Bull queue for Redis health check
    BullModule.registerQueue({
      name: 'image-processing',
    }),
    DatabaseModule,
    TerminusModule,
    StorageModule,
    ImagesModule,
  ],
  controllers: [HealthController],
  providers: [RedisHealthIndicator],
})
export class AppModule {}

