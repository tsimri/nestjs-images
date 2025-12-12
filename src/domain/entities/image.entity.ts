import { ImageStatus } from '../enums/image-status.enum';

export interface ImageData {
  id: string;
  url: string;
  title: string | null;
  width: number;
  height: number;
  status: ImageStatus;
  createdAt: Date;
  deletedAt: Date | null;
}

export class Image implements ImageData {
  id: string;
  url: string;
  title: string | null;
  width: number;
  height: number;
  status: ImageStatus;
  createdAt: Date;
  deletedAt: Date | null;

  constructor(partial: Partial<Image>) {
    Object.assign(this, partial);
  }

  get isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  softDelete(): void {
    this.deletedAt = new Date();
  }

  restore(): void {
    this.deletedAt = null;
  }
}

