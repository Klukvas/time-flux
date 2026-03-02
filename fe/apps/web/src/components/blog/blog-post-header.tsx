import type { BlogPostWithContent } from '@/lib/blog/types';
import { LanguageBadge } from './language-badge';

interface BlogPostHeaderProps {
  post: BlogPostWithContent;
}

export function BlogPostHeader({ post }: BlogPostHeaderProps) {
  const { frontmatter, readingTime } = post;

  return (
    <header className="mb-10">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <LanguageBadge language={frontmatter.language} />
        {frontmatter.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent"
          >
            {tag}
          </span>
        ))}
      </div>

      <h1 className="mb-4 text-3xl font-bold tracking-tight text-content sm:text-4xl">
        {frontmatter.title}
      </h1>

      <p className="mb-6 text-lg text-content-secondary">
        {frontmatter.description}
      </p>

      <div className="flex items-center gap-3 text-sm text-content-tertiary">
        {frontmatter.author && <span>{frontmatter.author}</span>}
        {frontmatter.author && <span>·</span>}
        <time dateTime={frontmatter.date}>
          {new Date(frontmatter.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
        <span>·</span>
        <span>{readingTime}</span>
      </div>
    </header>
  );
}
