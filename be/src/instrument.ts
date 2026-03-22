import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'development',
  enabled: !!process.env.SENTRY_DSN,
  tracesSampleRate: 0.2,
  profilesSampleRate: 0.1,
  integrations: [nodeProfilingIntegration()],
});
