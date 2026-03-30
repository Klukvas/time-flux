import Link from 'next/link';

export function BlogCTA() {
  return (
    <div className="my-12 rounded-xl border border-accent/20 bg-accent/5 p-6 text-center sm:p-8">
      <h3 className="mb-2 text-lg font-bold text-content">
        Start tracking your life today
      </h3>
      <p className="mb-4 text-sm text-content-secondary">
        Join thousands of people who use TimeFlux to understand their moods,
        organize life chapters, and build a visual timeline of their journey.
      </p>
      <Link
        href="/"
        className="inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-text hover:bg-accent-hover transition-colors"
      >
        Get Started Free
      </Link>
    </div>
  );
}
