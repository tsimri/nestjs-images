import { Test, TestingModule } from '@nestjs/testing';
import { PrismaImageRepository } from './prisma-image.repository';
import { PrismaService } from '../database/prisma.service';
import { Image } from '../../domain/entities/image.entity';
import { ImageStatus } from '../../domain/enums/image-status.enum';

const prismaImage = {
  id: '123',
  url: 'https://example.com/img.jpg',
  title: 'Test',
  width: 800,
  height: 600,
  status: 'completed',
  createdAt: new Date(),
  deletedAt: null,
};

describe('PrismaImageRepository', () => {
  let repo: PrismaImageRepository;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      image: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaImageRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repo = module.get(PrismaImageRepository);
  });

  it('maps prisma model to domain entity', () => {
    const image = (repo as any).toDomainEntity(prismaImage);

    expect(image).toBeInstanceOf(Image);
    expect(image.status).toBe(ImageStatus.COMPLETED);
  });

  it('handles status mapping and deletedAt', () => {
    const deleted = { ...prismaImage, status: 'failed', deletedAt: new Date() };
    const image = (repo as any).toDomainEntity(deleted);

    expect(image.status).toBe(ImageStatus.FAILED);
    expect(image.isDeleted).toBe(true);
  });

  it('findManyWithCount returns images and total', async () => {
    prisma.$transaction.mockResolvedValue([[prismaImage], 1]);

    const result = await repo.findManyWithCount({ page: 1, limit: 10 });

    expect(result.total).toBe(1);
    expect(result.images[0]).toBeInstanceOf(Image);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('findById returns null when not found', async () => {
    prisma.image.findFirst.mockResolvedValue(null);

    const result = await repo.findById('missing');

    expect(result).toBeNull();
  });

  it('softDelete sets deletedAt', async () => {
    const now = new Date();
    prisma.image.update.mockResolvedValue({ ...prismaImage, deletedAt: now });

    await repo.softDelete('123');

    expect(prisma.image.update).toHaveBeenCalledWith({
      where: { id: '123' },
      data: { deletedAt: expect.any(Date) },
    });
  });
});
