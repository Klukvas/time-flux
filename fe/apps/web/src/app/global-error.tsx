'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body
        style={{
          display: 'flex',
          minHeight: '100dvh',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#080C14',
          color: '#EFF2F7',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 48, fontWeight: 800, color: '#38BDF8' }}>
            Something went wrong
          </h1>
          <p style={{ marginTop: 16, color: '#8892A4' }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 32,
              padding: '10px 24px',
              borderRadius: 8,
              background: '#38BDF8',
              color: '#080C14',
              border: 'none',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
