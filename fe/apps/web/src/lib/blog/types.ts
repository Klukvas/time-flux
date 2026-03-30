export type BlogLanguage = 'EN' | 'UK' | 'RU';

export interface BlogFrontmatter {
  title: string;
  description: string;
  date: string;
  tags: string[];
  language: BlogLanguage;
  author?: string;
  image?: string;
}

export interface BlogPost {
  slug: string;
  frontmatter: BlogFrontmatter;
  readingTime: string;
  wordCount: number;
}

export interface BlogPostWithContent extends BlogPost {
  content: string;
}
