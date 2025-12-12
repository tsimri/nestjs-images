import { Module } from '@nestjs/common';
import { S3StorageAdapter } from '../adapters/s3-storage.adapter';

@Module({
  providers: [
    {
      provide: 'IStorageService',
      useClass: S3StorageAdapter,
    },
  ],
  exports: ['IStorageService'],
})
export class StorageModule {}

