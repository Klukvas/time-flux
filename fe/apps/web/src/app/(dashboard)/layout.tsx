'use client';

import { AuthGuard } from '@/lib/auth-guard';
import { OnboardingProvider } from '@/lib/onboarding-provider';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <OnboardingProvider>
        <DashboardShell>{children}</DashboardShell>
      </OnboardingProvider>
    </AuthGuard>
  );
}
