import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from '@lifespan/hooks';
import type { OnboardingStep } from '@lifespan/hooks';
import { colors, spacing, fontSize, borderRadius } from '@/lib/theme';

interface OnboardingOverlayProps {
  step: OnboardingStep;
  onNext: () => void;
  onSkip: () => void;
  onTryIt: () => void;
}

const STEPS: OnboardingStep[] = [
  'welcome',
  'highlight-timeline',
  'highlight-chapters',
  'highlight-categories',
  'highlight-moods',
  'day',
  'first-memory',
];

const STEP_MESSAGE_KEY: Record<OnboardingStep, string> = {
  welcome: 'onboarding.welcome',
  'highlight-timeline': 'onboarding.highlight_timeline',
  'highlight-chapters': 'onboarding.highlight_chapters',
  'highlight-categories': 'onboarding.highlight_categories',
  'highlight-moods': 'onboarding.highlight_moods',
  day: 'onboarding.day',
  'first-memory': 'onboarding.first_memory',
};

const STEP_EMOJI: Record<OnboardingStep, string> = {
  welcome: '\u{1F30D}',
  'highlight-timeline': '\u{1F5D3}',
  'highlight-chapters': '\u{1F5C2}',
  'highlight-categories': '\u{1F3F7}',
  'highlight-moods': '\u{1F60A}',
  day: '\u{1F60A}',
  'first-memory': '\u{1F4F7}',
};

const NAV_ITEMS = [
  'onboarding.navigation_timeline',
  'onboarding.navigation_chapters',
  'onboarding.navigation_categories',
  'onboarding.navigation_day_states',
  'onboarding.navigation_settings',
] as const;

export function OnboardingOverlay({ step, onNext, onSkip, onTryIt }: OnboardingOverlayProps) {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const stepIndex = STEPS.indexOf(step);

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step, fadeAnim, slideAnim]);

  return (
    <View style={styles.overlay}>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onSkip} />

      {/* Card */}
      <Animated.View
        style={[
          styles.card,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Step dots */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === stepIndex
                  ? styles.dotActive
                  : i < stepIndex
                    ? styles.dotPast
                    : styles.dotFuture,
              ]}
            />
          ))}
        </View>

        {/* Emoji icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.iconEmoji}>{STEP_EMOJI[step]}</Text>
        </View>

        {/* Message */}
        <Text style={styles.message}>{t(STEP_MESSAGE_KEY[step])}</Text>

        {/* Navigation list — only for the highlight-chapters step */}
        {step === 'highlight-chapters' && (
          <View style={styles.navList}>
            {NAV_ITEMS.map((key) => (
              <View key={key} style={styles.navItem}>
                <View style={styles.navDot} />
                <Text style={styles.navText}>{t(key)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable onPress={onSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
          </Pressable>

          {step === 'day' ? (
            <Pressable onPress={onTryIt} style={styles.primaryBtn}>
              <Text style={styles.primaryText}>{t('onboarding.try_it')}</Text>
            </Pressable>
          ) : step !== 'first-memory' ? (
            <Pressable onPress={onNext} style={styles.primaryBtn}>
              <Text style={styles.primaryText}>{t('onboarding.next')}</Text>
            </Pressable>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  card: {
    width: '85%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.lg,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.brand[500],
  },
  dotPast: {
    width: 6,
    backgroundColor: colors.brand[100],
  },
  dotFuture: {
    width: 6,
    backgroundColor: colors.gray[200],
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconEmoji: {
    fontSize: 40,
  },
  message: {
    fontSize: fontSize.sm,
    lineHeight: 22,
    color: colors.gray[700],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  navList: {
    marginBottom: spacing.lg,
    gap: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  navDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.brand[500],
    opacity: 0.6,
  },
  navText: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipText: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
  },
  primaryBtn: {
    backgroundColor: colors.brand[500],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  primaryText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.white,
  },
});
