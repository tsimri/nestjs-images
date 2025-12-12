import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageService, UploadFileResult } from '../../application/interfaces/storage.interface';

@Injectable()
export class S3StorageAdapter implements IStorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private publicEndpoint: string | undefined;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('AWS_ENDPOINT_URL');
    const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID') || 'test';
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || 'test';

    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME') || 'fm-bucket';
    this.publicEndpoint = this.configService.get<string>('AWS_PUBLIC_ENDPOINT_URL');

    this.s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // needed for LocalStack
    });
  }

  async uploadFile(
    file: Buffer,
    fileName: string,
    contentType?: string,
  ): Promise<UploadFileResult> {
    const key = `${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType || 'application/octet-stream',
    });

    await this.s3Client.send(command);

    return {
      key,
      url: await this.getFileUrl(key),
      bucket: this.bucketName,
    };
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async getFileUrl(key: string): Promise<string> {
    const endpoint = this.configService.get<string>('AWS_ENDPOINT_URL');

    if (endpoint && endpoint.includes('localstack')) {
      const publicUrl = this.publicEndpoint || endpoint.replace('localstack', 'localhost');
      return `${publicUrl}/${this.bucketName}/${key}`;
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  async getFileBuffer(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3Client.send(command);

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }
}

