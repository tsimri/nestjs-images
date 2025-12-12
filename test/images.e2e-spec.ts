import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MulterModule } from '@nestjs/platform-express';
import * as request from 'supertest';
import { ImagesController } from '../src/presentation/controllers/v1/images.controller';
import { ImagesService } from '../src/application/services/images.service';
import { ImageValidationInterceptor } from '../src/presentation/interceptors/file-validation.interceptor';
import { ImageFileValidator } from '../src/application/validators';
import { DomainExceptionFilter } from '../src/presentation/filters/domain-exception.filter';
import { ApplicationExceptionFilter } from '../src/presentation/filters/application-exception.filter';
import { ImageStatus } from '../src/domain/enums/image-status.enum';
import { ImageNotFoundError } from '../src/domain/errors/image-not-found.error';

describe('ImagesController (e2e)', () => {
  let app: INestApplication;
  const imagesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    uploadImage: jest.fn(),
  };
  const validator = {
    validate: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [MulterModule.register({})],
      controllers: [ImagesController],
      providers: [
        ImageValidationInterceptor,
        { provide: ImagesService, useValue: imagesService },
        { provide: ImageFileValidator, useValue: validator },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    app.useGlobalFilters(new DomainExceptionFilter(), new ApplicationExceptionFilter());
    app.enableVersioning({ type: VersioningType.URI });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /v1/images returns paginated list', async () => {
    imagesService.findAll.mockResolvedValue({
      data: [{ id: '1', title: 't', width: 800, height: 600, status: ImageStatus.COMPLETED, url: 'u' }],
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });

    await request(app.getHttpServer())
      .get('/v1/images')
      .expect(200)
      .expect(res => {
        expect(res.body.data).toHaveLength(1);
        expect(res.body.total).toBe(1);
      });
  });

  it('GET /v1/images/:id returns image details', async () => {
    imagesService.findOne.mockResolvedValue({
      id: '1',
      title: 'One',
      width: 800,
      height: 600,
      status: ImageStatus.COMPLETED,
      url: 'u',
      createdAt: new Date().toISOString(),
      deletedAt: null,
    });

    await request(app.getHttpServer())
      .get('/v1/images/1')
      .expect(200)
      .expect(res => {
        expect(res.body.id).toBe('1');
        expect(res.body.status).toBe(ImageStatus.COMPLETED);
      });
  });

  it('GET /v1/images/:id maps domain not-found to 404', async () => {
    imagesService.findOne.mockRejectedValue(new ImageNotFoundError('missing'));

    await request(app.getHttpServer())
      .get('/v1/images/missing')
      .expect(404)
      .expect(res => {
        expect(res.body.error).toBe('ImageNotFoundError');
      });
  });

  it('POST /v1/images uploads and enqueues processing', async () => {
    validator.validate.mockResolvedValue({
      isValid: true,
      data: { metadata: { width: 100, height: 100, format: 'jpeg' }, mimeType: 'image/jpeg' },
    });
    imagesService.uploadImage.mockResolvedValue({
      id: 'new',
      title: 'Test',
      width: 100,
      height: 100,
      status: ImageStatus.PROCESSING,
      url: '',
      createdAt: new Date().toISOString(),
      deletedAt: null,
    });

    await request(app.getHttpServer())
      .post('/v1/images')
      .field('title', 'Test')
      .attach('file', Buffer.from('file-data'), 'test.jpg')
      .expect(201)
      .expect(res => {
        expect(res.body.id).toBe('new');
        expect(imagesService.uploadImage).toHaveBeenCalled();
      });
  });

  it('POST /v1/images returns 400 on validation error', async () => {
    validator.validate.mockResolvedValue({
      isValid: false,
      error: 'Invalid file',
    });

    await request(app.getHttpServer())
      .post('/v1/images')
      .attach('file', Buffer.from('bad'), 'bad.jpg')
      .expect(400)
      .expect(res => {
        expect(res.body.error).toBe('FileValidationError');
      });
  });
});
