'use client';

import { notFound } from 'next/navigation';
import { DayPage } from '@/components/day-form/day-page';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(date: string): boolean {
  if (!ISO_DATE_REGEX.test(date)) return false;
  const parsed = new Date(date + 'T00:00:00');
  return !isNaN(parsed.getTime());
}

export default function DayRoute({ params }: { params: { date: string } }) {
  const { date } = params;

  if (!isValidDate(date)) {
    notFound();
  }

  return <DayPage date={date} />;
}
