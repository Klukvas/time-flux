'use client';

import { useTranslation, useSubscription } from '@lifespan/hooks';

interface UsageRowProps {
  label: string;
  used: number;
  limit: number;
  unlimitedText: string;
  ofText: string;
}

function UsageRow({ label, used, limit, unlimitedText, ofText }: UsageRowProps) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : limit > 0 ? (used / limit) * 100 : 0;

  const barColor =
    percentage > 90
      ? 'bg-red-500'
      : percentage > 70
        ? 'bg-yellow-500'
        : 'bg-green-500';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-content-secondary">
          {label}
        </span>
        <span className="text-sm text-content-tertiary">
          {isUnlimited ? unlimitedText : ofText}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function UsageSection() {
  const { t } = useTranslation();
  const { data: subscription } = useSubscription();

  if (!subscription) return null;

  const { limits, usage } = subscription;

  const rows = [
    { label: t('subscription.usage_media'), used: usage.media, limit: limits.media },
    { label: t('subscription.usage_chapters'), used: usage.chapters, limit: limits.chapters },
    { label: t('subscription.usage_categories'), used: usage.categories, limit: limits.categories },
    { label: t('subscription.usage_moods'), used: usage.dayStates, limit: limits.dayStates },
  ];

  return (
    <div className="rounded-xl border border-edge bg-surface-card p-6">
      <h2 className="mb-4 text-lg font-semibold text-content">
        {t('subscription.usage_title')}
      </h2>
      <div className="space-y-4">
        {rows.map((row) => (
          <UsageRow
            key={row.label}
            label={row.label}
            used={row.used}
            limit={row.limit}
            unlimitedText={t('subscription.usage_unlimited')}
            ofText={t('subscription.usage_of', {
              used: row.used,
              limit: row.limit,
            })}
          />
        ))}
      </div>
    </div>
  );
}
