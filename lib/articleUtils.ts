import type { Article } from '../types';

/**
 * Calculates read time in minutes for an article based on content length.
 * Assumes an average reading speed of 225 words per minute.
 */
export function calculateReadTimeMinutes(content: string): number {
  if (!content || typeof content !== 'string') {
    return 1;
  }

  // Remove simplest markdown formatting hints
  const cleanText = content
    .replace(/#+\s/g, '') // Headers
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // Italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/\{1,3}[^\\n]*\{1,3}/g, '') // Code blocks
    .replace(/>\s/g, '') // Blockquotes
    .replace(/[-*+]\s/g, '') // Lists
    .replace(/\n/g, ' '); // Newlines

  const words = cleanText.split(/\s+/).filter((word) => word.length > 0);
  const wordCount = words.length;

  const readingSpeedWPM = 225;
  return Math.max(1, Math.ceil(wordCount / readingSpeedWPM));
}

/**
 * Normalizes an article to ensure consistency across the application.
 * Highlights:
 * - Changes author to "PetBhai Team"
 * - Automatically calculates realistic read time based on the content
 */
export function normalizeArticle(article: Article): Article {
  return {
    ...article,
    author: 'PetBhai Team',
    readTime: calculateReadTimeMinutes(article.content),
  };
}
