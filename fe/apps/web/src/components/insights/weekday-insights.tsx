'use client';

import type { WeekdayInsights } from '@lifespan/api';
import { useTranslation } from '@lifespan/hooks';

const WEEKDAY_KEYS = [
  'insights.weekday_monday',
  'insights.weekday_tuesday',
  'insights.weekday_wednesday',
  'insights.weekday_thursday',
  'insights.weekday_friday',
  'insights.weekday_saturday',
  'insights.weekday_sunday',
] as const;

function useWeekdayName(weekday: number) {
  const { t } = useTranslation();
  return t(WEEKDAY_KEYS[weekday] ?? WEEKDAY_KEYS[0]);
}

function InsightCard({
  icon,
  title,
  description,
  detail,
  variant = 'default',
}: {
  icon: string;
  title: string;
  description: string;
  detail?: string;
  variant?: 'default' | 'warning';
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        variant === 'warning'
          ? 'border-warning/30 bg-warning/5'
          : 'border-edge bg-surface-card'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-content">{title}</p>
          <p className="mt-0.5 text-sm text-content-secondary">{description}</p>
          {detail && (
            <p className="mt-1 text-xs text-content-tertiary">{detail}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function WeekdayInsightsSection({
  insights,
}: {
  insights: WeekdayInsights;
}) {
  const { t } = useTranslation();

  const dayName = (weekday: number) =>
    t(WEEKDAY_KEYS[weekday] ?? WEEKDAY_KEYS[0]);

  const hasAnyInsight =
    insights.bestMoodDay ||
    insights.worstMoodDay ||
    insights.mostActiveDay ||
    insights.leastActiveDay ||
    insights.mostUnstableDay ||
    insights.recoveryIndex ||
    insights.burnoutPattern?.detected;

  if (!hasAnyInsight) return null;

  return (
    <div className="rounded-lg border border-edge bg-surface-card p-6">
      <h2 className="mb-4 text-sm font-medium text-content-secondary">
        {t('insights.weekday_patterns')}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {insights.burnoutPattern?.detected && (
          <div className="sm:col-span-2">
            <InsightCard
              icon="🔥"
              title={t('insights.burnout_detected')}
              description={t('insights.burnout_description')}
              variant="warning"
            />
          </div>
        )}

        {insights.bestMoodDay && (
          <InsightCard
            icon="😊"
            title={t('insights.best_mood_day')}
            description={t('insights.best_mood_day_description', {
              day: dayName(insights.bestMoodDay.weekday),
            })}
            detail={`${t('insights.score_label', { score: insights.bestMoodDay.averageScore.toFixed(1) })} · ${t('insights.sample_size', { count: insights.bestMoodDay.sampleSize })}`}
          />
        )}

        {insights.worstMoodDay && (
          <InsightCard
            icon="😔"
            title={t('insights.worst_mood_day')}
            description={t('insights.worst_mood_day_description', {
              day: dayName(insights.worstMoodDay.weekday),
            })}
            detail={`${t('insights.score_label', { score: insights.worstMoodDay.averageScore.toFixed(1) })} · ${t('insights.sample_size', { count: insights.worstMoodDay.sampleSize })}`}
          />
        )}

        {insights.mostActiveDay && (
          <InsightCard
            icon="⚡"
            title={t('insights.most_active_day')}
            description={t('insights.most_active_day_description', {
              day: dayName(insights.mostActiveDay.weekday),
            })}
            detail={t('insights.sample_size', {
              count: insights.mostActiveDay.sampleSize,
            })}
          />
        )}

        {insights.leastActiveDay && (
          <InsightCard
            icon="😴"
            title={t('insights.least_active_day')}
            description={t('insights.least_active_day_description', {
              day: dayName(insights.leastActiveDay.weekday),
            })}
            detail={t('insights.sample_size', {
              count: insights.leastActiveDay.sampleSize,
            })}
          />
        )}

        {insights.mostUnstableDay && (
          <InsightCard
            icon="🎢"
            title={t('insights.most_unstable_day')}
            description={t('insights.most_unstable_day_description', {
              day: dayName(insights.mostUnstableDay.weekday),
            })}
            detail={t('insights.sample_size', {
              count: insights.mostUnstableDay.sampleSize,
            })}
          />
        )}

        {insights.recoveryIndex && (
          <InsightCard
            icon="💪"
            title={t('insights.recovery_day')}
            description={t('insights.recovery_day_description', {
              day: dayName(insights.recoveryIndex.weekday),
            })}
            detail={t('insights.recovery_rate', {
              rate: Math.round(insights.recoveryIndex.recoveryRate * 100),
            })}
          />
        )}
      </div>
    </div>
  );
}
