'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-bold text-content">Something went wrong</h2>
      <p className="mt-2 text-content-secondary">
        An unexpected error occurred. Please try again.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-text transition-colors hover:bg-accent/90"
        >
          Try Again
        </button>
        <button
          onClick={() => router.push('/timeline')}
          className="rounded-lg border border-edge px-5 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:text-content"
        >
          Back to Timeline
        </button>
      </div>
    </div>
  );
}
