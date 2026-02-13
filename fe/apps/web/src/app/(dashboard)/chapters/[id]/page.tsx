'use client';

import { ChapterDetails } from '@/components/chapters/chapter-details';

export default function ChapterDetailPage({ params }: { params: { id: string } }) {
  return <ChapterDetails groupId={params.id} />;
}
