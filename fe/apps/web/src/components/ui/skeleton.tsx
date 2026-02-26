'use client';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-secondary ${className}`}
    />
  );
}

/** Page title + subtitle placeholder. */
export function SkeletonTitle() {
  return (
    <div className="mb-6">
      <Skeleton className="h-8 w-40" />
    </div>
  );
}

/** Card shell with inner lines. */
export function SkeletonCard({
  lines = 3,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-edge bg-surface-card p-6 ${className}`}
    >
      <Skeleton className="mb-4 h-4 w-32" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => {
          const widths = ['w-full', 'w-4/5', 'w-3/5', 'w-2/5'];
          return (
            <Skeleton key={i} className={`h-3 ${widths[i % widths.length]}`} />
          );
        })}
      </div>
    </div>
  );
}

// ─── Page-level skeletons ────────────────────────────────────

export function InsightsSkeleton() {
  return (
    <div>
      <SkeletonTitle />
      <div className="space-y-6">
        {/* Average mood */}
        <div className="rounded-lg border border-edge bg-surface-card p-6">
          <Skeleton className="mb-3 h-4 w-28" />
          <Skeleton className="mb-2 h-10 w-16" />
          <Skeleton className="h-3 w-48" />
        </div>
        {/* Distribution */}
        <div className="rounded-lg border border-edge bg-surface-card p-6">
          <Skeleton className="mb-4 h-4 w-36" />
          <div className="space-y-3">
            {[80, 65, 50, 35, 20].map((w, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-2.5 flex-1" />
              </div>
            ))}
          </div>
        </div>
        {/* Categories */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
        {/* Trend */}
        <div className="rounded-lg border border-edge bg-surface-card p-6">
          <Skeleton className="mb-4 h-4 w-32" />
          <Skeleton className="h-[180px] w-full" />
        </div>
      </div>
    </div>
  );
}

export function CategoriesSkeleton() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-edge bg-surface-card p-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChaptersSkeleton() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-edge bg-surface-card p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-5 w-36" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="mt-3 h-3 w-48" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DayStatesSkeleton() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-edge bg-surface-card p-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div>
                <Skeleton className="mb-1 h-4 w-20" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div>
      <SkeletonTitle />
      <div className="space-y-6">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={2} />
      </div>
    </div>
  );
}

export function ChapterDetailsSkeleton() {
  return (
    <div>
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="mb-6 h-4 w-32" />
      <div className="space-y-6">
        <SkeletonCard lines={3} />
        <SkeletonCard lines={4} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-edge bg-surface-card p-4"
            >
              <Skeleton className="mb-2 h-3 w-16" />
              <Skeleton className="h-6 w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-48 rounded-lg" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <div className="flex gap-1">
              {Array.from({ length: 7 }).map((_, j) => (
                <Skeleton key={j} className="h-6 w-6 rounded-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
