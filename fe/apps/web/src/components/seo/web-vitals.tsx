'use client';

import { useReportWebVitals } from 'next/web-vitals';
import * as Sentry from '@sentry/nextjs';

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    Sentry.setMeasurement(metric.name, metric.value, 'millisecond');
  });

  return null;
}
