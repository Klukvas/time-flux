/**
 * OpenAPI spec generator entry point.
 *
 * Compiled by `nest build` (SWC) into dist/generate-openapi.entry.js.
 * Called by scripts/generate-openapi.ts wrapper.
 */
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { buildSwaggerConfig } from './common/swagger/swagger.config.js';
import { PrismaService } from './prisma/prisma.service.js';
import { S3Service } from './s3/s3.service.js';

// Minimal env vars so ConfigModule / validators don't throw
process.env.DATABASE_URL ??= 'postgresql://dummy:dummy@localhost:5432/dummy';
process.env.JWT_SECRET ??= 'openapi-gen-secret';

/** PrismaService stub — no real DB connection. */
const prismaStub = {
  $connect: async () => {},
  $disconnect: async () => {},
  $executeRawUnsafe: async () => {},
  onModuleInit: async () => {},
  onModuleDestroy: async () => {},
};

/** S3Service stub. */
const s3Stub = {
  getPresignedUploadUrl: async () => ({ uploadUrl: '', key: '' }),
  getPresignedReadUrl: async () => '',
};

/** ThrottlerStorage stub. */
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

async function generate() {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prismaStub)
    .overrideProvider(S3Service)
    .useValue(s3Stub)
    .overrideProvider(ThrottlerStorage)
    .useValue(noopStorage)
    .compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const config = buildSwaggerConfig();
  const document = SwaggerModule.createDocument(app, config);

  // __dirname is available because SWC compiles to CJS
  const outPath = resolve(__dirname, '..', 'openapi.json');
  writeFileSync(outPath, JSON.stringify(document, null, 2) + '\n');

  console.log(`OpenAPI spec written to ${outPath}`);

  await app.close();
}

generate();
