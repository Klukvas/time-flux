import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

interface BlogLayoutProps {
  children: React.ReactNode;
}

export function BlogLayout({ children }: BlogLayoutProps) {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-50 border-b border-edge/50 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Logo variant="horizontal" />
            </Link>
            <span className="text-content-tertiary">/</span>
            <Link
              href="/blog"
              className="text-sm font-medium text-content-secondary hover:text-content"
            >
              Blog
            </Link>
          </div>

          <Link
            href="/"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-text hover:bg-accent-hover transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">{children}</main>

      <footer className="border-t border-edge px-4 py-8 text-center text-xs text-content-tertiary">
        TimeFlux &copy; {new Date().getFullYear()}
        {' · '}
        <Link href="/blog" className="underline hover:text-content-secondary">
          Blog
        </Link>
        {' · '}
        <Link href="/terms" className="underline hover:text-content-secondary">
          Terms of Service
        </Link>
        {' · '}
        <Link
          href="/privacy"
          className="underline hover:text-content-secondary"
        >
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}
