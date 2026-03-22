export async function register() {
  const Sentry = await import('@sentry/nextjs');
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.2,
  });
}
