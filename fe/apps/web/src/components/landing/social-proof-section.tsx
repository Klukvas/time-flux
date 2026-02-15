'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@lifespan/hooks';

const STATS: { key: string; value: number; suffix?: string }[] = [
  { key: 'days_recorded', value: 12482 },
  { key: 'active_users', value: 3421 },
  { key: 'return_weekly', value: 98, suffix: '%' },
];

const AVATARS = [
  { initials: 'AK', bg: '#3B82F6' },
  { initials: 'MR', bg: '#EC4899' },
  { initials: 'VT', bg: '#8B5CF6' },
  { initials: 'OL', bg: '#10B981' },
  { initials: 'DS', bg: '#F59E0B' },
  { initials: 'NP', bg: '#0EA5E9' },
  { initials: 'KI', bg: '#EF4444' },
  { initials: 'JW', bg: '#14B8A6' },
];

function useCountUp(target: number, duration = 2000) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { value, ref };
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function StatItem({ statKey, target, suffix }: { statKey: string; target: number; suffix?: string }) {
  const { t } = useTranslation();
  const { value, ref } = useCountUp(target);

  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl font-extrabold tracking-tight text-content sm:text-5xl">
        {formatNumber(value)}{suffix ?? ''}+
      </p>
      <p className="mt-2 text-sm font-medium text-content-secondary">
        {t(`landing.social.${statKey}`)}
      </p>
    </div>
  );
}

export function SocialProofSection() {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-5xl">
        {/* Floating avatars */}
        <div className="mb-10 flex items-center justify-center">
          <div className="flex -space-x-2">
            {AVATARS.map((av) => (
              <div
                key={av.initials}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface text-xs font-bold text-white"
                style={{ backgroundColor: av.bg }}
              >
                {av.initials}
              </div>
            ))}
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface bg-surface-secondary text-xs font-medium text-content-secondary">
              +2k
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {STATS.map((stat) => (
            <StatItem key={stat.key} statKey={stat.key} target={stat.value} suffix={stat.suffix} />
          ))}
        </div>
      </div>
    </section>
  );
}
