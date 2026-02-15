'use client';

import { useTranslation } from '@lifespan/hooks';

const CARDS = [
  {
    key: 'work',
    gradient: 'from-blue-500/20 to-indigo-500/10',
    glow: 'hover:shadow-blue-500/10',
    barColor: '#3B82F6',
    dots: ['#22C55E', '#84CC16', '#FACC15', '#F97316', '#EF4444', '#FACC15', '#84CC16'],
  },
  {
    key: 'relationships',
    gradient: 'from-pink-500/20 to-rose-500/10',
    glow: 'hover:shadow-pink-500/10',
    barColor: '#EC4899',
    dots: ['#EC4899', '#22C55E', '#22C55E', '#84CC16', '#22C55E', '#FACC15', '#22C55E'],
  },
  {
    key: 'health',
    gradient: 'from-emerald-500/20 to-teal-500/10',
    glow: 'hover:shadow-emerald-500/10',
    barColor: '#10B981',
    dots: ['#FACC15', '#84CC16', '#22C55E', '#22C55E', '#22C55E', '#84CC16', '#22C55E'],
  },
  {
    key: 'travel',
    gradient: 'from-cyan-500/20 to-sky-500/10',
    glow: 'hover:shadow-cyan-500/10',
    barColor: '#0EA5E9',
    dots: ['#22C55E', '#22C55E', '#84CC16', '#22C55E', '#22C55E', '#22C55E', '#84CC16'],
  },
];

export function ChaptersVibeSection() {
  const { t } = useTranslation();

  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-content sm:text-4xl">
          {t('landing.vibe.title')}
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {CARDS.map((card) => (
            <div
              key={card.key}
              className={`group relative overflow-hidden rounded-2xl border border-edge/50 bg-gradient-to-br ${card.gradient} p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${card.glow}`}
            >
              {/* Title + subtitle */}
              <h3 className="text-lg font-bold text-content">
                {t(`landing.vibe.${card.key}`)}
              </h3>
              <p className="mt-1 text-sm text-content-secondary">
                {t(`landing.vibe.${card.key}_sub`)}
              </p>

              {/* Mini timeline */}
              <div className="mt-5">
                <div className="mb-2 h-2 overflow-hidden rounded-full bg-surface/50">
                  <div
                    className="h-full rounded-full transition-all duration-500 group-hover:w-[90%]"
                    style={{
                      width: '70%',
                      backgroundColor: card.barColor,
                      opacity: 0.6,
                    }}
                  />
                </div>
                <div className="flex items-center gap-1">
                  {card.dots.map((color, i) => (
                    <div
                      key={i}
                      className="h-3 w-3 rounded-full transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: color, opacity: 0.7 }}
                    />
                  ))}
                </div>
              </div>

              {/* Soft glow on hover */}
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30"
                style={{ backgroundColor: card.barColor }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
