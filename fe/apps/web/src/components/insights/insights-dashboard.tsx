'use client';

import { useMoodOverview, useTranslation } from '@lifespan/hooks';
import { MoodTrendChart } from './mood-trend-chart';
import { WeekdayInsightsSection } from './weekday-insights';

export function InsightsDashboard() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useMoodOverview();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-16 text-center text-sm text-danger">
        {t('common.error')}
      </div>
    );
  }

  if (data.totalDaysWithMood === 0) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-content">{t('insights.title')}</h1>
        <div className="rounded-lg border border-edge bg-surface-card p-8 text-center">
          <p className="text-sm text-content-secondary">{t('insights.no_data')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-content">{t('insights.title')}</h1>

      <div className="space-y-6">
        {/* Average Mood */}
        <div className="rounded-lg border border-edge bg-surface-card p-6">
          <p className="text-sm font-medium text-content-secondary">
            {t('insights.average_mood')}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-content">
              {data.averageMoodScore.toFixed(1)}
            </span>
            <span className="text-sm text-content-tertiary">
              {t('insights.out_of')}
            </span>
          </div>
          <p className="mt-1 text-xs text-content-tertiary">
            {t('insights.average_mood_description')}
          </p>
        </div>

        {/* Mood Distribution */}
        {data.moodDistribution.length > 0 && (
          <div className="rounded-lg border border-edge bg-surface-card p-6">
            <h2 className="mb-4 text-sm font-medium text-content-secondary">
              {t('insights.mood_distribution')}
            </h2>
            <div className="space-y-3">
              {data.moodDistribution.map((item) => (
                <div key={item.moodId} className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="w-24 truncate text-sm text-content">
                    {item.moodName}
                  </span>
                  <div className="flex-1 h-2.5 rounded-full bg-surface-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                  <span className="w-20 text-right text-xs text-content-tertiary">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Best / Worst Category */}
        {(data.bestCategory || data.worstCategory) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {data.bestCategory && (
              <div className="rounded-lg border border-edge bg-surface-card p-6">
                <p className="text-sm font-medium text-success">
                  {t('insights.best_category')}
                </p>
                <p className="mt-2 text-lg font-semibold text-content">
                  {data.bestCategory.name}
                </p>
                <p className="mt-1 text-sm text-content-tertiary">
                  {data.bestCategory.averageMoodScore.toFixed(1)} {t('insights.out_of')}
                </p>
              </div>
            )}
            {data.worstCategory && (
              <div className="rounded-lg border border-edge bg-surface-card p-6">
                <p className="text-sm font-medium text-danger">
                  {t('insights.worst_category')}
                </p>
                <p className="mt-2 text-lg font-semibold text-content">
                  {data.worstCategory.name}
                </p>
                <p className="mt-1 text-sm text-content-tertiary">
                  {data.worstCategory.averageMoodScore.toFixed(1)} {t('insights.out_of')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 30-Day Trend */}
        {data.trendLast30Days.length > 1 && (
          <div className="rounded-lg border border-edge bg-surface-card p-6">
            <h2 className="mb-4 text-sm font-medium text-content-secondary">
              {t('insights.trend_last_30_days')}
            </h2>
            <MoodTrendChart data={data.trendLast30Days} />
          </div>
        )}

        {/* Weekday Insights */}
        {data.weekdayInsights && (
          <WeekdayInsightsSection insights={data.weekdayInsights} />
        )}
      </div>
    </div>
  );
}
