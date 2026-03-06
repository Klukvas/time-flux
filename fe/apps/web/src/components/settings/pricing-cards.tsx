'use client';

import { useTranslation } from '@timeflux/hooks';
import { TIER_LIMITS } from '@timeflux/constants';
import type { SubscriptionTier } from '@timeflux/api';

interface PricingCardsProps {
  currentTier: SubscriptionTier;
  onUpgrade: (tier: 'PRO' | 'PREMIUM') => void;
}

const PRICES: Record<SubscriptionTier, string> = {
  FREE: '',
  PRO: '$4.99',
  PREMIUM: '$9.99',
};

const TIERS: SubscriptionTier[] = ['FREE', 'PRO', 'PREMIUM'];

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-green-500"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-content-tertiary"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}

export function PricingCards({ currentTier, onUpgrade }: PricingCardsProps) {
  const { t } = useTranslation();

  const planNames: Record<SubscriptionTier, string> = {
    FREE: t('subscription.free_plan'),
    PRO: t('subscription.pro_plan'),
    PREMIUM: t('subscription.premium_plan'),
  };

  const planDescriptions: Record<SubscriptionTier, string> = {
    FREE: t('subscription.free_description'),
    PRO: t('subscription.pro_description'),
    PREMIUM: t('subscription.premium_description'),
  };

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {TIERS.map((tier) => {
        const limits = TIER_LIMITS[tier];
        const isCurrent = tier === currentTier;
        const isPopular = tier === 'PRO';

        return (
          <div
            key={tier}
            className={`relative flex flex-col rounded-2xl border-2 p-6 transition-shadow ${
              isPopular
                ? 'border-violet-500 shadow-lg shadow-violet-500/10'
                : isCurrent
                  ? 'border-accent'
                  : 'border-edge'
            }`}
          >
            {/* Popular badge */}
            {isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
                  {t('subscription.popular')}
                </span>
              </div>
            )}

            {/* Header */}
            <div className="mb-5">
              <h3 className="text-lg font-bold text-content">
                {planNames[tier]}
              </h3>
              <p className="mt-1 text-sm text-content-tertiary">
                {planDescriptions[tier]}
              </p>
            </div>

            {/* Price */}
            <div className="mb-6">
              {tier === 'FREE' ? (
                <span className="text-3xl font-bold text-content">
                  {t('subscription.free_price')}
                </span>
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-content">
                    {PRICES[tier]}
                  </span>
                  <span className="text-sm text-content-tertiary">
                    {t('subscription.per_month')}
                  </span>
                </div>
              )}
            </div>

            {/* Features */}
            <ul className="mb-6 flex-1 space-y-3 text-sm text-content-secondary">
              <FeatureRow included>
                {limits.media === -1
                  ? t('subscription.media_unlimited')
                  : t('subscription.media_limit', { count: limits.media })}
              </FeatureRow>
              <FeatureRow included>
                {limits.chapters === -1
                  ? t('subscription.chapters_unlimited')
                  : t('subscription.chapters_limit', {
                      count: limits.chapters,
                    })}
              </FeatureRow>
              <FeatureRow included>
                {limits.categories === -1
                  ? t('subscription.categories_unlimited')
                  : t('subscription.categories_limit', {
                      count: limits.categories,
                    })}
              </FeatureRow>
              <FeatureRow included>
                {limits.dayStates === -1
                  ? t('subscription.moods_unlimited')
                  : t('subscription.moods_limit', { count: limits.dayStates })}
              </FeatureRow>
              <FeatureRow included={!!limits.analytics}>
                {limits.analytics === true
                  ? t('subscription.analytics_included')
                  : limits.analytics === 'basic'
                    ? t('subscription.analytics_basic')
                    : t('subscription.analytics_locked')}
              </FeatureRow>
              <FeatureRow included={limits.memories}>
                {limits.memories
                  ? t('subscription.memories_included')
                  : t('subscription.memories_locked')}
              </FeatureRow>
            </ul>

            {/* CTA */}
            {isCurrent ? (
              <div className="rounded-xl bg-accent/10 py-2.5 text-center text-sm font-semibold text-accent">
                {t('subscription.current_plan')}
              </div>
            ) : tier !== 'FREE' ? (
              <button
                onClick={() => onUpgrade(tier as 'PRO' | 'PREMIUM')}
                className={`group relative w-full overflow-hidden rounded-xl py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl ${
                  isPopular ? 'hover:scale-[1.02]' : ''
                }`}
              >
                <span className="absolute inset-0 animate-gradient bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-600 bg-[length:200%_200%]" />
                <span className="relative flex items-center justify-center gap-2">
                  {t('subscription.upgrade')}
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </span>
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function FeatureRow({
  included,
  children,
}: {
  included: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2.5">
      {included ? <CheckIcon /> : <LockIcon />}
      <span className={included ? '' : 'text-content-tertiary'}>
        {children}
      </span>
    </li>
  );
}
