import { z } from 'zod';

const baseSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

const productionSchema = baseSchema.extend({
  FRONTEND_URL: z.string().url(),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  PADDLE_WEBHOOK_SECRET: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_SUPPORT_CHAT_ID: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  PADDLE_API_KEY: z.string().optional(),
  PADDLE_ENVIRONMENT: z
    .enum(['sandbox', 'production'])
    .default('production'),
});

export function validateEnv(): void {
  const schema =
    process.env.NODE_ENV === 'production' ? productionSchema : baseSchema;
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${formatted}`);
  }
}
