import { useCallback, useEffect, useRef } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import {
  useTranslation,
  useSubscription,
  useCancelSubscription,
} from '@lifespan/hooks';
import { TIER_LIMITS } from '@lifespan/constants';
import type { SubscriptionTier } from '@lifespan/api';
import { useAuthStore } from '@/stores/auth-store';
import { borderRadius, fontSize, spacing } from '@/lib/theme';
import { useTheme } from '@lifespan/hooks';

const PAYMENTS_ENABLED = process.env.EXPO_PUBLIC_PAYMENTS_ENABLED === 'true';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: '#dcfce7', text: '#166534' },
  PAST_DUE: { bg: '#fef9c3', text: '#854d0e' },
  CANCELED: { bg: '#fee2e2', text: '#991b1b' },
  PAUSED: { bg: '#f3f4f6', text: '#374151' },
};

interface SubscriptionSectionProps {
  paddleCheckoutUrl?: string;
}

export function SubscriptionSection({
  paddleCheckoutUrl,
}: SubscriptionSectionProps) {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const user = useAuthStore((s) => s.user);
  const { data: subscription, refetch } = useSubscription();
  const cancelMutation = useCancelSubscription();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const tier = (subscription?.tier ?? 'FREE') as SubscriptionTier;
  const status = subscription?.status ?? 'ACTIVE';
  const limits = TIER_LIMITS[tier];

  const planNames: Record<SubscriptionTier, string> = {
    FREE: t('subscription.free_plan'),
    PRO: t('subscription.pro_plan'),
    PREMIUM: t('subscription.premium_plan'),
  };

  const statusLabels: Record<string, string> = {
    ACTIVE: t('subscription.status_active'),
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

  const handleUpgrade = useCallback(async () => {
    if (!paddleCheckoutUrl || !user) return;
    const url = `${paddleCheckoutUrl}?customer_email=${encodeURIComponent(user.email)}&custom_data[userId]=${user.id}`;
    await WebBrowser.openBrowserAsync(url);
    startPolling();
    refetch();
  }, [paddleCheckoutUrl, user, startPolling, refetch]);

  const handleCancel = useCallback(() => {
    Alert.alert(t('subscription.cancel'), t('subscription.cancel_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        style: 'destructive',
        onPress: () => cancelMutation.mutate(),
      },
    ]);
  }, [t, cancelMutation]);

  const formattedDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
    : null;

  const canceledDate = subscription?.canceledAt
    ? new Date(subscription.canceledAt).toLocaleDateString()
    : null;

  const statusColor = STATUS_COLORS[status] ?? STATUS_COLORS.ACTIVE;

  return (
    <View style={[styles.card, { backgroundColor: tokens.colors.bgCard }]}>
      <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>
        {t('subscription.title')}
      </Text>

      {/* Plan name + status badge */}
      <View style={styles.planRow}>
        <Text style={[styles.planName, { color: tokens.colors.text }]}>
          {planNames[tier]}
        </Text>
        <View style={[styles.badge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.badgeText, { color: statusColor.text }]}>
            {statusLabels[status] ?? status}
          </Text>
        </View>
      </View>

      {/* Renewal date */}
      {formattedDate && status === 'ACTIVE' && !subscription?.canceledAt && (
        <Text style={[styles.renewText, { color: tokens.colors.textTertiary }]}>
          {t('subscription.renews_on', { date: formattedDate })}
        </Text>
      )}

      {/* Cancellation banner */}
      {canceledDate && status !== 'CANCELED' && (
        <View style={styles.cancelBanner}>
          <Text style={styles.cancelBannerText}>
            {t('subscription.canceled_banner', { date: canceledDate })}
          </Text>
        </View>
      )}

      {/* Coming soon banner (when payments disabled) */}
      {!PAYMENTS_ENABLED && (
        <View style={styles.comingSoonBanner}>
          <Text style={styles.comingSoonText}>
            {t('subscription.payments_coming_soon')}
          </Text>
        </View>
      )}

      {/* Limits overview */}
      <View style={styles.limitsContainer}>
        <Text
          style={[styles.limitText, { color: tokens.colors.textSecondary }]}
        >
          {limits.media === -1
            ? t('subscription.media_unlimited')
            : t('subscription.media_limit', { count: limits.media })}
        </Text>
        <Text
          style={[styles.limitText, { color: tokens.colors.textSecondary }]}
        >
          {limits.chapters === -1
            ? t('subscription.chapters_unlimited')
            : t('subscription.chapters_limit', { count: limits.chapters })}
        </Text>
        <Text
          style={[styles.limitText, { color: tokens.colors.textSecondary }]}
        >
          {limits.analytics
            ? t('subscription.analytics_included')
            : t('subscription.analytics_locked')}
        </Text>
      </View>

      {/* Actions */}
      {PAYMENTS_ENABLED && tier !== 'PREMIUM' && paddleCheckoutUrl && (
        <Pressable onPress={handleUpgrade} style={styles.upgradeBtn}>
          <View style={styles.gradientBg}>
            <View style={styles.gradientLeft} />
            <View style={styles.gradientRight} />
          </View>
          <View style={styles.upgradeBtnInner}>
            <Text style={styles.upgradeBtnText}>
              {t('subscription.upgrade')}
            </Text>
            <Text style={styles.upgradeBtnArrow}>{'\u2192'}</Text>
          </View>
        </Pressable>
      )}

      {PAYMENTS_ENABLED && tier !== 'FREE' && !subscription?.canceledAt && (
        <Pressable
          onPress={handleCancel}
          disabled={cancelMutation.isPending}
          style={[
            styles.cancelBtn,
            cancelMutation.isPending && { opacity: 0.5 },
          ]}
        >
          <Text style={styles.cancelBtnText}>{t('subscription.cancel')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planName: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  renewText: {
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  comingSoonBanner: {
    marginTop: spacing.sm,
    backgroundColor: '#eff6ff',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: spacing.sm,
  },
  comingSoonText: {
    fontSize: fontSize.sm,
    color: '#1e40af',
  },
  cancelBanner: {
    marginTop: spacing.sm,
    backgroundColor: '#fef9c3',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  cancelBannerText: {
    fontSize: fontSize.sm,
    color: '#854d0e',
  },
  limitsContainer: {
    marginTop: spacing.md,
    gap: 4,
  },
  limitText: {
    fontSize: fontSize.sm,
  },
  upgradeBtn: {
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  gradientLeft: {
    flex: 1,
    backgroundColor: '#7c3aed',
  },
  gradientRight: {
    flex: 1,
    backgroundColor: '#6366f1',
  },
  upgradeBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
  },
  upgradeBtnText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  upgradeBtnArrow: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  cancelBtn: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#dc2626',
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
});
