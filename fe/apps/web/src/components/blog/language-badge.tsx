import type { BlogLanguage } from '@/lib/blog/types';

const LANGUAGE_STYLES: Record<BlogLanguage, string> = {
  EN: 'bg-blue-500/10 text-blue-600',
  UK: 'bg-yellow-500/10 text-yellow-600',
  RU: 'bg-green-500/10 text-green-600',
};

interface LanguageBadgeProps {
  language: BlogLanguage;
}

export function LanguageBadge({ language }: LanguageBadgeProps) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${LANGUAGE_STYLES[language]}`}
    >
      {language}
    </span>
  );
}
