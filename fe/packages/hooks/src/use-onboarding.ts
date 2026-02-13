import { useCallback, useMemo, useState } from 'react';
import { useOnboardingStorage } from './onboarding-context';
import { useTimeline } from './use-timeline';
import { useEventGroups } from './use-event-groups';

export type OnboardingStep =
  | 'welcome'
  | 'highlight-timeline'
  | 'highlight-chapters'
  | 'highlight-categories'
  | 'highlight-moods'
  | 'day'
  | 'first-memory';

const STEPS: OnboardingStep[] = [
  'welcome',
  'highlight-timeline',
  'highlight-chapters',
  'highlight-categories',
  'highlight-moods',
  'day',
  'first-memory',
];

/** Map onboarding steps to sidebar item keys for highlighting. */
export const STEP_SIDEBAR_HIGHLIGHT: Partial<Record<OnboardingStep, string>> = {
  'highlight-timeline': 'timeline',
  'highlight-chapters': 'chapters',
  'highlight-categories': 'categories',
  'highlight-moods': 'day-states',
};

export function useOnboarding() {
  const storage = useOnboardingStorage();
  const { data: timeline } = useTimeline();
  const { data: eventGroups } = useEventGroups();

  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [dismissed, setDismissed] = useState(false);

  const hasData = useMemo(() => {
    const hasDayWithState = timeline?.days?.some((d) => d.dayState !== null) ?? false;
    const hasChapters = (eventGroups?.length ?? 0) > 0;
    return hasDayWithState || hasChapters;
  }, [timeline, eventGroups]);

  const shouldShow = !dismissed && !storage.isCompleted && !hasData;

  const next = useCallback(() => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) {
      setStep(STEPS[idx + 1]);
    }
  }, [step]);

  const skip = useCallback(() => {
    storage.markCompleted();
    setDismissed(true);
  }, [storage]);

  const complete = useCallback(() => {
    storage.markCompleted();
    setDismissed(true);
  }, [storage]);

  return { shouldShow, step, next, skip, complete };
}
