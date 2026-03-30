'use client';

import dynamic from 'next/dynamic';
import { ChapterDetailsSkeleton } from '@/components/ui/skeleton';

const ChapterDetails = dynamic(
  () =>
    import('@/components/chapters/chapter-details').then(
      (mod) => mod.ChapterDetails,
    ),
  { loading: () => <ChapterDetailsSkeleton /> },
);

export default function ChapterDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <ChapterDetails groupId={params.id} />;
}
