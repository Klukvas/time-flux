'use client';

import { useTranslation } from '@lifespan/hooks';

interface HeroSectionProps {
  onStart: () => void;
}

export function HeroSection({ onStart }: HeroSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
      {/* Animated gradient background */}
      <div className="landing-gradient absolute inset-0 opacity-[0.07]" />
      <div className="absolute inset-0 bg-surface/60" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left — Copy */}
        <div className="text-center lg:text-left">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-content sm:text-5xl lg:text-6xl">
            {t('landing.hero.headline')}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-content-secondary sm:text-xl">
            {t('landing.hero.subtext')}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <button
              onClick={onStart}
              className="rounded-xl bg-accent px-6 py-3 text-base font-semibold text-accent-text shadow-lg shadow-accent/25 transition-all hover:bg-accent-hover hover:shadow-xl hover:shadow-accent/30"
            >
              {t('landing.hero.cta_start')}
            </button>
            <button className="rounded-xl border border-edge px-6 py-3 text-base font-semibold text-content transition-colors hover:bg-surface-secondary">
              {t('landing.hero.cta_demo')}
            </button>
          </div>
        </div>

        {/* Right — Mock timeline */}
        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-md">
            <TimelineMock badge={t('landing.hero.badge_pattern')} />
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineMock({ badge }: { badge: string }) {
  const chapters = [
    { label: 'Work', color: '#3B82F6', width: '85%' },
    { label: 'Relationship', color: '#EC4899', width: '60%' },
    { label: 'Travel', color: '#0EA5E9', width: '40%' },
  ];

  const moodDots = [
    '#22C55E', '#84CC16', '#22C55E', '#FACC15', '#F97316',
    '#EF4444', '#FACC15', '#84CC16', '#22C55E', '#22C55E',
    '#84CC16', '#FACC15', '#22C55E', '#84CC16',
  ];

  return (
    <div className="landing-float rounded-2xl border border-edge bg-surface-card p-5 shadow-2xl shadow-black/5 sm:p-6">
      {/* Chapter bars */}
      <div className="space-y-2.5">
        {chapters.map((ch) => (
          <div key={ch.label} className="flex items-center gap-3">
            <span className="w-24 text-right text-xs font-medium text-content-secondary">{ch.label}</span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-edge-light">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: ch.width, backgroundColor: ch.color, opacity: 0.7 }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Mood dots */}
      <div className="mt-5 flex items-center gap-1.5">
        {moodDots.map((color, i) => (
          <div
            key={i}
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: color, opacity: 0.8 }}
          />
        ))}
      </div>

      {/* Day labels */}
      <div className="mt-1 flex items-center gap-1.5">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S', 'M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i} className="w-4 text-center text-[10px] text-content-tertiary">
            {d}
          </span>
        ))}
      </div>

      {/* Badge */}
      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-danger/10 px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-danger" />
        <span className="text-xs font-medium text-danger">{badge}</span>
      </div>
    </div>
  );
}
