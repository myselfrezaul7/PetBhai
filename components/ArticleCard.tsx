import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { getResponsiveImageSizes, handleBlogImageError } from '../lib/imageUtils';
import { useArticleEngagement } from '../hooks/useArticleEngagement';

interface ArticleCardProps {
  article: Article;
  variant?: 'hero' | 'large' | 'default';
  index?: number;
}

const EngagementBar = ({ article }: { article: Article }) => {
  const { t } = useLanguage();
  const { likeCount, commentCount, viewCount, isLiked, toggleLike, shareArticle } =
    useArticleEngagement(article.id);

  return (
    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/20 text-white/90">
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleLike().catch(() => {});
        }}
        className="flex items-center gap-1.5 hover:text-amber-400 transition-colors group/btn"
      >
        <svg
          className={`w-5 h-5 transition-transform ${isLiked ? 'text-red-500 fill-current scale-110' : 'text-white/80 group-hover/btn:scale-110'}`}
          fill={isLiked ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={isLiked ? 0 : 2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <span className="text-sm font-medium">{likeCount || 'Like'}</span>
      </button>

      <div className="flex items-center gap-1.5 text-white/80">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span className="text-sm font-medium">{commentCount || 0}</span>
      </div>

      <div className="flex items-center gap-1.5 text-white/80 ml-auto">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        <span className="text-sm font-medium">
          {viewCount} {t('blog_readers') || 'readers'}
        </span>
      </div>

      <button
        onClick={(e) => {
          e.preventDefault();
          shareArticle(article.title || '', article.excerpt || '').catch(() => {});
        }}
        className="flex items-center gap-1.5 text-white/80 hover:text-white ml-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6.632l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      </button>
    </div>
  );
};

const ReadingProgress = ({ minutes }: { minutes: number }) => {
  let colorClass = 'bg-emerald-400';
  let width = '30%';
  if (minutes > 3 && minutes <= 7) {
    colorClass = 'bg-amber-400';
    width = '60%';
  } else if (minutes > 7) {
    colorClass = 'bg-orange-500';
    width = '90%';
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
      <div className={`h-full ${colorClass} rounded-r-full`} style={{ width }} />
    </div>
  );
};

const ArticleCard: React.FC<ArticleCardProps> = ({ article, variant = 'default', index = 0 }) => {
  const { t } = useLanguage();
  const [isLoaded, setIsLoaded] = useState(false);
  const { viewCount } = useArticleEngagement(article.id);

  const getEmoji = (title: string) => {
    const tLower = title.toLowerCase();
    if (tLower.includes('dog') || tLower.includes('কুকুর')) return '🐕';
    if (tLower.includes('cat') || tLower.includes('বিড়াল') || tLower.includes('বিড়াল'))
      return '🐱';
    if (tLower.includes('health') || tLower.includes('vaccine') || tLower.includes('টিটিকা'))
      return '💉';
    return '🐾';
  };

  const emoji = getEmoji(article.title);

  // HERO VARIANT
  if (variant === 'hero') {
    return (
      <Link
        to={`/blog/${article.slug || article.id}`}
        className="block relative w-full h-[320px] md:h-[420px] rounded-3xl overflow-hidden group shadow-xl mb-8 animate-fade-in-up"
      >
        <img
          src={article.imageUrl || '/blog-images/blog-placeholder.png'}
          alt={article.title}
          width={600}
          height={338}
          loading="eager"
          fetchPriority="high"
          sizes="(max-width: 768px) 100vw, 66vw"
          className={`absolute inset-0 w-full h-full object-cover transform transition-transform duration-300 ease-spring group-hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0 blur-sm'}`}
          onLoad={() => setIsLoaded(true)}
          onError={handleBlogImageError}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

        <div className="absolute top-4 left-4 flex gap-2">
          <span className="glass-card-ios bg-amber-500/90 text-white text-sm font-bold px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg flex items-center gap-1.5">
            <span className="text-lg leading-none">{emoji}</span> {article.category || 'General'}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8 z-10">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 leading-tight drop-shadow-md group-hover:text-amber-300 transition-colors">
            {article.title}
          </h2>
          <p className="text-white/80 text-sm md:text-base line-clamp-2 md:line-clamp-3 mb-4 max-w-3xl drop-shadow">
            {article.content
              ? article.content
                  .split('\n')
                  .filter((l) => l.trim())
                  .slice(0, 2)
                  .join(' ')
                  .replace(/[#*`_[\]()]/g, '')
                  .trim()
              : ''}
          </p>
          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-white/90 font-medium">
            <span className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                👤
              </div>
              {article.author}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/50" />
            <span>
              {article.readTime} {t('blog_min_read')}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/50" />
            <span className="flex items-center gap-1.5 text-amber-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              {viewCount} {t('blog_readers') || 'readers'}
            </span>
          </div>
          <div className="mt-2" onClick={(e) => e.preventDefault()}>
            <EngagementBar article={article} />
          </div>
        </div>
        <ReadingProgress minutes={article.readTime || 5} />
      </Link>
    );
  }

  // LARGE VARIANT
  if (variant === 'large') {
    return (
      <Link
        to={`/blog/${article.slug || article.id}`}
        className="block relative w-full h-[280px] rounded-2xl overflow-hidden group shadow-lg animate-fade-in-up"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <img
          src={article.imageUrl || '/blog-images/blog-placeholder.png'}
          alt={article.title}
          width={600}
          height={400}
          loading="lazy"
          decoding="async"
          sizes={getResponsiveImageSizes('card')}
          className={`absolute inset-0 w-full h-full object-cover transform transition-transform duration-300 ease-spring group-hover:scale-110 ${isLoaded ? 'opacity-100' : 'opacity-0 blur-sm'}`}
          onLoad={() => setIsLoaded(true)}
          onError={handleBlogImageError}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

        <div className="absolute top-3 left-3">
          <span className="glass-card-ios bg-black/40 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1 border border-white/10">
            {emoji} {article.category}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <h3 className="text-lg md:text-xl font-bold text-white mb-2 leading-tight drop-shadow-md group-hover:text-amber-300 transition-colors line-clamp-3">
            {article.title}
          </h3>
          <div className="flex items-center gap-2 sm:gap-3 text-xs text-white/80 font-medium">
            <span>{article.author}</span>
            <span className="w-1 h-1 rounded-full bg-white/50" />
            <span>{article.readTime} min read</span>
            <span className="w-1 h-1 rounded-full bg-white/50" />
            <span className="flex items-center gap-1 text-amber-300">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              {viewCount}
            </span>
          </div>
          <div className="mt-2" onClick={(e) => e.preventDefault()}>
            <EngagementBar article={article} />
          </div>
        </div>
        <ReadingProgress minutes={article.readTime || 5} />
      </Link>
    );
  }

  // DEFAULT VARIANT
  return (
    <Link
      to={`/blog/${article.slug || article.id}`}
      className="block relative w-full h-[220px] md:h-[260px] rounded-2xl overflow-hidden group shadow-md animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <img
        src={article.imageUrl || '/blog-images/blog-placeholder.png'}
        alt={article.title}
        width={600}
        height={400}
        loading="lazy"
        decoding="async"
        sizes={getResponsiveImageSizes('card')}
        className={`absolute inset-0 w-full h-full object-cover transform transition-transform duration-300 ease-spring group-hover:scale-110 ${isLoaded ? 'opacity-100' : 'opacity-0 blur-sm'}`}
        onLoad={() => setIsLoaded(true)}
        onError={handleBlogImageError}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity"></div>

      {/* Default visible bottom section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10 transition-transform duration-300 group-hover:-translate-y-full">
        <h3 className="text-base md:text-lg font-bold text-white mb-1 leading-tight drop-shadow-md line-clamp-2">
          {article.title}
        </h3>
        <div className="text-xs text-white/80 flex items-center gap-2">
          <span>
            {emoji} {article.category}
          </span>
          <span>•</span>
          <span>{article.readTime} min</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-amber-300">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            {viewCount}
          </span>
        </div>
      </div>

      {/* Hover reveal glass panel */}
      <div className="absolute top-0 left-0 w-full h-full glass-card-ios bg-zinc-900/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end z-20">
        <h3 className="text-base md:text-lg font-bold text-amber-400 mb-2 leading-tight line-clamp-2">
          {article.title}
        </h3>
        <p className="text-zinc-200 text-sm line-clamp-3 mb-3">
          {article.content
            ? article.content
                .split('\n')
                .filter((l) => l.trim())
                .slice(0, 1)
                .join(' ')
                .replace(/[#*`_[\]()]/g, '')
                .trim()
            : ''}
        </p>
        <div className="mt-auto" onClick={(e) => e.preventDefault()}>
          <EngagementBar article={article} />
        </div>
      </div>

      <ReadingProgress minutes={article.readTime || 5} />
    </Link>
  );
};

export default React.memo(ArticleCard);
