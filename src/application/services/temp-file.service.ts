import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

@Injectable()
export class TempFileService implements OnModuleInit {
  private readonly logger = new Logger(TempFileService.name);
  private readonly tempDir: string;

  constructor() {
    this.tempDir = join(tmpdir(), 'fm-uploads');
  }

  async onModuleInit() {
    await this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      this.logger.log(`Temp directory ensured: ${this.tempDir}`);
    } catch (err) {
      this.logger.error(`Failed to create temp directory`, err);
      throw err;
    }
  }

  async saveTempFile(
    id: string,
    buffer: Buffer,
    format: string,
  ): Promise<string> {
    const localFilePath = join(this.tempDir, `${id}.${format}`);
    await fs.writeFile(localFilePath, buffer);
    return localFilePath;
  }

  async removeTempFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      this.logger.log(`Successfully removed temp file: ${filePath}`);
    } catch (err) {
      this.logger.warn(`Failed to remove temp file ${filePath}: ${err.message}`);
    }
  }

  getTempDir(): string {
    return this.tempDir;
  }
}
