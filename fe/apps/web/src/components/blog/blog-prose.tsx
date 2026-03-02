interface BlogProseProps {
  html: string;
}

export function BlogProse({ html }: BlogProseProps) {
  return (
    <article
      className="prose prose-blog mx-auto max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
