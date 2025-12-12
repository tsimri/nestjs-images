import { NestFactory } from '@nestjs/core';
import { VersioningType, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './presentation/filters/domain-exception.filter';
import { ApplicationExceptionFilter } from './presentation/filters/application-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<string>('PORT') || '3000';

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, 
      whitelist: true, 
      forbidNonWhitelisted: false,
    }),
  );

  // Register global exception filters
  // Order matters — more specific filters should come first
  app.useGlobalFilters(
    new DomainExceptionFilter(),
    new ApplicationExceptionFilter(),
  );

  app.enableVersioning({
    type: VersioningType.URI,
  });
  
  const config = new DocumentBuilder()
    .setTitle('Image Management API')
    .setDescription('REST API for image upload, processing, and management with S3 storage. Rate limiting is enabled: 60 uploads/min, 90 list requests/min, 120 get-by-id/min.')
    .setVersion('1.0')
    .addTag('images', 'Image upload and retrieval endpoints')
    .addTag('health', 'Health check endpoints')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);
  
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation available at: http://localhost:${port}/swagger`);
}
bootstrap();

