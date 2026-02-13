'use client';

import { useOnboarding, STEP_SIDEBAR_HIGHLIGHT } from '@lifespan/hooks';
import { Sidebar } from './sidebar';
import type { NavItemKey } from './sidebar';
import { MobileDrawer } from './mobile-drawer';
import { OnboardingOverlay } from '@/components/onboarding/onboarding-overlay';
import { useSidebarStore } from '@/stores/sidebar-store';

/**
 * Dashboard shell orchestrates the sidebar, onboarding overlay, and main content.
 * The onboarding flow drives sidebar highlighting for navigation steps.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const onboarding = useOnboarding();
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);

  const highlightedItem = onboarding.shouldShow
    ? (STEP_SIDEBAR_HIGHLIGHT[onboarding.step] as NavItemKey | undefined) ?? null
    : null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar highlightedItem={highlightedItem} />
      </div>

      {/* Mobile drawer overlay */}
      <MobileDrawer highlightedItem={highlightedItem} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top header */}
        <header className="flex md:hidden h-14 shrink-0 items-center justify-between border-b border-edge bg-surface-card px-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-content-secondary hover:bg-surface-secondary"
            aria-label="Open navigation"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-accent">TimeFlux</h1>
          <div className="w-10" />
        </header>

        {/* Scrollable main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>

      {/* Onboarding overlay — shown for non-DayForm steps only */}
      {onboarding.shouldShow && onboarding.step !== 'first-memory' && (
        <OnboardingOverlay
          step={onboarding.step}
          onNext={onboarding.next}
          onSkip={onboarding.skip}
          onTryIt={() => {
            onboarding.next();
          }}
        />
      )}
    </div>
  );
}
