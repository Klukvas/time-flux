'use client';

import { useTranslation } from '@lifespan/hooks';
import type { OnboardingStep } from '@lifespan/hooks';
import { STEP_SIDEBAR_HIGHLIGHT } from '@lifespan/hooks';
import { Button } from '@/components/ui/button';

interface OnboardingOverlayProps {
  step: OnboardingStep;
  onNext: () => void;
  onSkip: () => void;
  onTryIt: () => void;
}

const ALL_STEPS: OnboardingStep[] = [
  'welcome',
  'highlight-timeline',
  'highlight-chapters',
  'highlight-categories',
  'highlight-moods',
  'day',
  'first-memory',
];

const GLOBE_ICON = (
  <svg className="h-10 w-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

const POINTER_ICON = (
  <svg className="h-10 w-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
  </svg>
);

const SMILEY_ICON = (
  <svg className="h-10 w-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
  </svg>
);

const CAMERA_ICON = (
  <svg className="h-10 w-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
  </svg>
);

const STEP_ICON: Record<OnboardingStep, React.ReactNode> = {
  welcome: GLOBE_ICON,
  'highlight-timeline': POINTER_ICON,
  'highlight-chapters': POINTER_ICON,
  'highlight-categories': POINTER_ICON,
  'highlight-moods': POINTER_ICON,
  day: SMILEY_ICON,
  'first-memory': CAMERA_ICON,
};

const STEP_MESSAGE_KEY: Record<OnboardingStep, string> = {
  welcome: 'onboarding.welcome',
  'highlight-timeline': 'onboarding.highlight_timeline',
  'highlight-chapters': 'onboarding.highlight_chapters',
  'highlight-categories': 'onboarding.highlight_categories',
  'highlight-moods': 'onboarding.highlight_moods',
  day: 'onboarding.day',
  'first-memory': 'onboarding.first_memory',
};

/** Steps that highlight the sidebar — the overlay card is positioned differently. */
function isHighlightStep(step: OnboardingStep): boolean {
  return step in STEP_SIDEBAR_HIGHLIGHT;
}

export function OnboardingOverlay({ step, onNext, onSkip, onTryIt }: OnboardingOverlayProps) {
  const { t } = useTranslation();

  const stepIndex = ALL_STEPS.indexOf(step);
  const highlighting = isHighlightStep(step);

  return (
    <div className={`fixed inset-0 z-40 flex pointer-events-none ${
      highlighting
        ? 'items-center justify-center md:justify-start md:pl-72'
        : 'items-end justify-center pb-8 sm:items-center sm:pb-0'
    }`}>
      {/* Subtle backdrop dim — lighter during highlight steps to keep sidebar visible */}
      <div
        className={`fixed inset-0 transition-opacity duration-500 pointer-events-auto ${
          highlighting ? 'bg-black/10' : 'bg-black/20'
        }`}
        onClick={onSkip}
      />

      {/* Floating card */}
      <div className="pointer-events-auto relative z-50 mx-4 w-full max-w-sm animate-fade-in">
        <div className="rounded-2xl bg-surface-card p-6 shadow-2xl border border-edge">
          {/* Step dots */}
          <div className="mb-4 flex justify-center gap-1.5">
            {ALL_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === stepIndex
                    ? 'w-6 bg-accent'
                    : i < stepIndex
                      ? 'w-1.5 bg-accent/40'
                      : 'w-1.5 bg-edge'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="mb-4 flex justify-center">
            <div className="rounded-2xl bg-accent/10 p-3">
              {STEP_ICON[step]}
            </div>
          </div>

          {/* Message */}
          <p className="mb-4 text-center text-sm leading-relaxed text-content">
            {t(STEP_MESSAGE_KEY[step])}
          </p>

          <div className="mb-2" />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={onSkip}
              className="text-sm text-content-tertiary hover:text-content-secondary transition-colors"
            >
              {t('onboarding.skip')}
            </button>

            {step === 'day' ? (
              <Button size="sm" onClick={onTryIt}>
                {t('onboarding.try_it')}
              </Button>
            ) : step === 'first-memory' ? null : (
              <Button size="sm" onClick={onNext}>
                {t('onboarding.next')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
