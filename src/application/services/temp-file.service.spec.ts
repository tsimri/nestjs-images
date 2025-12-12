import { Test, TestingModule } from '@nestjs/testing';
import { TempFileService } from './temp-file.service';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn(),
  },
}));

jest.mock('os', () => ({
  tmpdir: jest.fn(),
}));

describe('TempFileService', () => {
  let service: TempFileService;
  const mockTmpDir = '/mock/tmp';
  const expectedTempDir = join(mockTmpDir, 'fm-uploads');

  beforeEach(async () => {
    (tmpdir as jest.Mock).mockReturnValue(mockTmpDir);
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [TempFileService],
    }).compile();

    service = module.get<TempFileService>(TempFileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('creates temp directory (recursive) on init', async () => {
      await service.onModuleInit();

      expect(fs.mkdir).toHaveBeenCalledWith(expectedTempDir, { recursive: true });
    });

    it('propagates mkdir errors', async () => {
      const error = new Error('Permission denied');
      (fs.mkdir as jest.Mock).mockRejectedValue(error);

      await expect(service.onModuleInit()).rejects.toThrow('Permission denied');
    });
  });

  describe('saveTempFile', () => {
    beforeEach(async () => {
      await service.onModuleInit();
      jest.clearAllMocks();
    });

    it('saves file with correct path and content', async () => {
      const id = '123';
      const buffer = Buffer.from('test-image-data');
      const format = 'jpeg';

      const result = await service.saveTempFile(id, buffer, format);

      const expectedPath = join(expectedTempDir, '123.jpeg');
      expect(result).toBe(expectedPath);
      expect(fs.writeFile).toHaveBeenCalledWith(expectedPath, buffer);
    });
  });

  describe('removeTempFile', () => {
    beforeEach(async () => {
      await service.onModuleInit();
      jest.clearAllMocks();
    });

    it('removes temp file', async () => {
      const filePath = '/tmp/fm-uploads/123.jpeg';

      await service.removeTempFile(filePath);

      expect(fs.unlink).toHaveBeenCalledWith(filePath);
    });

    it('swallows removal errors', async () => {
      const error = new Error('File not found');
      (fs.unlink as jest.Mock).mockRejectedValue(error);

      await expect(service.removeTempFile('/path/to/file.jpg')).resolves.toBeUndefined();

      expect(fs.unlink).toHaveBeenCalled();
    });
  });

  describe('getTempDir', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('returns temp directory path', () => {
      const result = service.getTempDir();

      expect(result).toBe(expectedTempDir);
    });
  });
});
