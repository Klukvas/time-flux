'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface px-4 text-center">
      <h1 className="text-6xl font-bold text-accent">Oops</h1>
      <p className="mt-4 text-lg text-content-secondary">
        Something went wrong. Please try again.
      </p>
      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-text transition-colors hover:bg-accent/90"
        >
          Try Again
        </button>
        <a
          href="/"
          className="rounded-lg border border-edge px-5 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:text-content"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
