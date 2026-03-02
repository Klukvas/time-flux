import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerStorage } from '@nestjs/throttler';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../../src/app.module';
import { GlobalExceptionFilter } from '../../src/common/filters/global-exception.filter';
import { buildSwaggerConfig } from '../../src/common/swagger/swagger.config';
import { S3Service } from '../../src/s3/s3.service';
import { mockS3Service } from './test-s3.mock';
import { setOpenApiDocument } from './openapi-validator';

/** Storage that always reports zero hits — throttler never triggers. */
const noopStorage: ThrottlerStorage = {
  increment: async () => ({
    totalHits: 0,
    timeToExpire: 0,
    isBlocked: false,
    timeToBlockExpire: 0,
  }),
  get: async () => [
    { totalHits: 0, timeToExpire: 0, isBlocked: false, timeToBlockExpire: 0 },
  ],
} as any;

export async function createTestApp(): Promise<INestApplication> {
  const builder: TestingModuleBuilder = Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(S3Service)
    .useValue(mockS3Service())
    .overrideProvider(ThrottlerStorage)
    .useValue(noopStorage);

  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication({ rawBody: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.init();

  // Generate OpenAPI document for contract validation
  const swaggerConfig = buildSwaggerConfig();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  setOpenApiDocument(document);

  return app;
}
