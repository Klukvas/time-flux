import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface px-4 text-center">
      <h1 className="text-6xl font-bold text-accent">404</h1>
      <p className="mt-4 text-lg text-content-secondary">
        The page you are looking for does not exist.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-text transition-colors hover:bg-accent/90"
        >
          Go Home
        </Link>
        <Link
          href="/terms"
          className="rounded-lg border border-edge px-5 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:text-content"
        >
          Terms
        </Link>
        <Link
          href="/privacy"
          className="rounded-lg border border-edge px-5 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:text-content"
        >
          Privacy
        </Link>
      </div>
    </div>
  );
}
