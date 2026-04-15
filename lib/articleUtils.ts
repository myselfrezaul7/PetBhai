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
  if (!article) return article;
  
  // Calculate read time
  const readTime = calculateReadTimeMinutes(article.content || '');
  
  // Generate excerpt if missing
  let excerpt = article.excerpt;
  if (!excerpt && article.content) {
    let cleanText = article.content.replace(/[#*`_\[\]()]/g, '');
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    excerpt = cleanText.length > 155 ? cleanText.substring(0, 155) + '...' : cleanText;
  }
  
  // Automatically generate a slug if missing
  const slug = article.slug || article.title
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF \-]/g, '')
    .trim()
    .replace(/\s+/g, '-') + '-' + article.id;

  return {
    ...article,
    author: 'PetBhai Team',
    readTime,
    excerpt,
    slug,
    category: article.category || 'General Pet Care',
    updatedAt: article.updatedAt || article.date,
    tags: article.tags || []
  };
}
