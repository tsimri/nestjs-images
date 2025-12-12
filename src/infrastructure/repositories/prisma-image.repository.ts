import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Image } from '../../domain/entities/image.entity';
import { ImageStatus } from '../../domain/enums/image-status.enum';
import {
  ImageRepository,
  FindImagesParams,
  FindImagesResult,
  CreateImageData,
  UpdateImageData,
} from '../../application/interfaces/image.repository';

@Injectable()
export class PrismaImageRepository implements ImageRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomainEntity(prismaImage: any): Image {
    return new Image({
      id: prismaImage.id,
      url: prismaImage.url,
      title: prismaImage.title,
      width: prismaImage.width,
      height: prismaImage.height,
      status: prismaImage.status as ImageStatus,  // ✅ Cast string to enum
      createdAt: prismaImage.createdAt,
      deletedAt: prismaImage.deletedAt,
    });
  }

  async findManyWithCount(params: FindImagesParams): Promise<FindImagesResult> {
    const { title, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (title) {
      where.title = {
        contains: title,
        mode: 'insensitive', // Case-insensitive search
      };
    }

    const [prismaImages, total] = await this.prisma.$transaction([
      this.prisma.image.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.image.count({ where }),
    ]);

    const images = prismaImages.map(prismaImage => this.toDomainEntity(prismaImage));

    return { images, total };
  }

  async findById(id: string): Promise<Image | null> {
    const prismaImage = await this.prisma.image.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!prismaImage) return null;

    return this.toDomainEntity(prismaImage);
  }

  async create(data: CreateImageData): Promise<Image> {
    const prismaImage = await this.prisma.image.create({
      data: {
        url: data.url,
        title: data.title,
        width: data.width,
        height: data.height,
        status: data.status,
      },
    });

    return this.toDomainEntity(prismaImage);
  }

  async update(id: string, data: UpdateImageData): Promise<Image> {
    const prismaImage = await this.prisma.image.update({
      where: { id },
      data: {
        ...(data.url !== undefined && { url: data.url }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.width !== undefined && { width: data.width }),
        ...(data.height !== undefined && { height: data.height }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });

    return this.toDomainEntity(prismaImage);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.image.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

