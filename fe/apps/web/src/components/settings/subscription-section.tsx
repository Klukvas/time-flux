'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  useTranslation,
  useSubscription,
  useCancelSubscription,
} from '@timeflux/hooks';
import type { SubscriptionTier } from '@timeflux/api';
import { useAuthStore } from '@/stores/auth-store';
import { openCheckout, PADDLE_PRICES } from '@/lib/paddle';
import { Modal } from '@/components/ui/modal';
import { PricingCards } from './pricing-cards';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  TRIALING: 'bg-blue-100 text-blue-800',
  PAST_DUE: 'bg-yellow-100 text-yellow-800',
  CANCELED: 'bg-red-100 text-red-800',
  PAUSED: 'bg-gray-100 text-gray-800',
};

interface SuccessInfo {
  tier: 'PRO' | 'PREMIUM';
}

const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true';

export function SubscriptionSection() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data: subscription, refetch } = useSubscription();
  const cancelMutation = useCancelSubscription();
  const [showPlans, setShowPlans] = useState(false);
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const tier = subscription?.tier ?? 'FREE';
  const status = subscription?.status ?? 'ACTIVE';

  const planNames: Record<SubscriptionTier, string> = {
    FREE: t('subscription.free_plan'),
    PRO: t('subscription.pro_plan'),
    PREMIUM: t('subscription.premium_plan'),
  };

  const statusLabels: Record<string, string> = {
    ACTIVE: t('subscription.status_active'),
    TRIALING: t('subscription.status_trialing'),
    PAST_DUE: t('subscription.status_past_due'),
    CANCELED: t('subscription.status_canceled'),
    PAUSED: t('subscription.status_paused'),
  };

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    let elapsed = 0;
    pollRef.current = setInterval(() => {
      elapsed += 3000;
      refetch();
      if (elapsed >= 60000 && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, 3000);
  }, [refetch]);

  const handleUpgrade = useCallback(
    async (targetTier: 'PRO' | 'PREMIUM') => {
      if (!user) return;
      const priceId = PADDLE_PRICES[targetTier];
      if (!priceId) return;
      setShowPlans(false);
      const result = await openCheckout(priceId, user.email, user.id);
      if (result === 'completed') {
        setSuccessInfo({ tier: targetTier });
        refetch();
        startPolling();
      }
    },
    [user, refetch, startPolling],
  );

  const handleCancel = useCallback(() => {
    setShowCancelConfirm(true);
  }, []);

  const confirmCancel = useCallback(() => {
    setShowCancelConfirm(false);
    cancelMutation.mutate();
  }, [cancelMutation]);

  const formattedDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
    : null;

  const canceledDate = subscription?.canceledAt
    ? new Date(subscription.canceledAt).toLocaleDateString()
    : null;

  return (
    <div className="rounded-xl border border-edge bg-surface-card p-6">
      <h2 className="mb-4 text-lg font-semibold text-content">
        {t('subscription.title')}
      </h2>

      {/* Current plan info */}
      <div className="flex items-center gap-3">
        <span className="text-content">{planNames[tier]}</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? STATUS_COLORS.ACTIVE}`}
        >
          {statusLabels[status] ?? status}
        </span>
      </div>

      {/* Renewal date */}
      {formattedDate && status === 'ACTIVE' && !subscription?.canceledAt && (
        <p className="mt-1 text-sm text-content-tertiary">
          {t('subscription.renews_on', { date: formattedDate })}
        </p>
      )}

      {/* Cancellation banner */}
      {canceledDate && status !== 'CANCELED' && (
        <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-800">
          {t('subscription.canceled_banner', { date: canceledDate })}
        </div>
      )}

      {/* Coming soon banner (when payments disabled) */}
      {!PAYMENTS_ENABLED && (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
          {t('subscription.payments_coming_soon')}
        </div>
      )}

      {/* Actions */}
      {PAYMENTS_ENABLED && (
        <div className="mt-4 flex gap-3">
          {tier === 'FREE' ? (
            <button
              onClick={() => setShowPlans(true)}
              className="group relative overflow-hidden rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-shadow hover:shadow-xl"
            >
              <span className="absolute inset-0 animate-gradient bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-600 bg-[length:200%_200%]" />
              <span className="relative flex items-center gap-2">
                {t('subscription.compare_plans')}
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
          ) : (
            <button
              onClick={() => setShowPlans(true)}
              className="rounded-lg border border-edge px-4 py-2 text-sm font-medium text-content transition-colors hover:bg-surface-hover"
            >
              {t('subscription.compare_plans')}
            </button>
          )}

          {tier !== 'FREE' && !subscription?.canceledAt && (
            <button
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              {t('subscription.cancel')}
            </button>
          )}
        </div>
      )}

      {/* Pricing comparison modal */}
      {PAYMENTS_ENABLED && (
        <Modal
          open={showPlans}
          onClose={() => setShowPlans(false)}
          title={t('subscription.compare_plans')}
          size="xl"
        >
          <PricingCards currentTier={tier} onUpgrade={handleUpgrade} />
        </Modal>
      )}

      {/* Success modal */}
      {PAYMENTS_ENABLED && (
        <SuccessModal
          info={successInfo}
          planName={successInfo ? planNames[successInfo.tier] : ''}
          onClose={() => setSuccessInfo(null)}
        />
      )}

      {/* Cancel confirmation modal */}
      {PAYMENTS_ENABLED && (
        <Modal
          open={showCancelConfirm}
          onClose={() => setShowCancelConfirm(false)}
          title={t('subscription.cancel')}
        >
          <p className="mb-4 text-sm text-content-secondary">
            {t('subscription.cancel_confirm')}
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowCancelConfirm(false)}
              className="rounded-lg border border-edge px-4 py-2 text-sm font-medium text-content transition-colors hover:bg-surface-hover"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={confirmCancel}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              {t('common.confirm')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function SuccessModal({
  info,
  planName,
  onClose,
}: {
  info: SuccessInfo | null;
  planName: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  if (!info) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm animate-in fade-in zoom-in-95 rounded-2xl bg-surface-card p-8 text-center shadow-2xl">
        {/* Celebration icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-3xl shadow-lg shadow-violet-500/25">
          🎉
        </div>

        <h2 className="mb-2 text-xl font-bold text-content">
          {t('subscription.success_title', { plan: planName })}
        </h2>

        <p className="mb-6 text-sm text-content-secondary">
          {t('subscription.success_description')}
        </p>

        <button
          onClick={onClose}
          className="group relative w-full overflow-hidden rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition-shadow hover:shadow-xl"
        >
          <span className="absolute inset-0 animate-gradient bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-600 bg-[length:200%_200%]" />
          <span className="relative">{t('subscription.success_cta')}</span>
        </button>
      </div>
    </div>
  );
}
