import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ImagesService } from '../../application/services/images.service';
import { TempFileService } from '../../application/services/temp-file.service';
import { ImageQueueService } from '../../application/services/image-queue.service';
import { ImageFileValidator } from '../../application/validators';
import { ImagesController } from '../../presentation/controllers/v1/images.controller';
import { PrismaImageRepository } from '../../infrastructure/repositories/prisma-image.repository';
import { ImageRepository } from '../../application/interfaces/image.repository';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { ImageProcessorService } from '../../infrastructure/processors/image-processor.service';
import { ValidationConfigProvider } from '../../infrastructure/config/validation-config.provider';

@Module({
  imports: [
    DatabaseModule,
    StorageModule,
    BullModule.registerQueue({
      name: 'image-processing',
    }),
  ],
  controllers: [ImagesController],
  providers: [
    ValidationConfigProvider,
    ImagesService,
    TempFileService,
    ImageQueueService,
    ImageFileValidator,
    ImageProcessorService,
    {
      provide: ImageRepository,
      useClass: PrismaImageRepository,
    },
  ],
  exports: [ImagesService, TempFileService, ImageQueueService, ImageFileValidator],
})
export class ImagesModule {}

