import React, { useState, useRef, useEffect } from 'react';
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

interface EngagementBarProps {
  article: Article;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  isLiked: boolean;
  toggleLike: () => Promise<void>;
  shareArticle: (title: string, text: string) => Promise<unknown>;
  compact?: boolean;
}

const getEmoji = (title: string, category?: string): string => {
  const combined = `${title} ${category || ''}`.toLowerCase();
  if (combined.includes('dog') || combined.includes('কুকুর')) return '🐕';
  if (combined.includes('cat') || combined.includes('বিড়াল') || combined.includes('বিড়াল')) {
    return '🐱';
  }
  if (
    combined.includes('health') ||
    combined.includes('vaccine') ||
    combined.includes('টিকা') ||
    combined.includes('ভ্যাকসিন')
  ) {
    return '💉';
  }
  if (combined.includes('nutrition') || combined.includes('food') || combined.includes('খাবার')) {
    return '🥩';
  }
  if (combined.includes('training') || combined.includes('প্রশিক্ষণ')) return '🎓';
  if (combined.includes('safety') || combined.includes('নিরাপত্তা')) return '🛡️';
  return '🐾';
};

const getArticleExcerpt = (article: Article): string => {
  if (article.excerpt && article.excerpt.trim()) {
    return article.excerpt.trim();
  }
  if (!article.content) return '';
  const nonEmptyLines = article.content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const bodyLines = nonEmptyLines.filter((line) => !line.startsWith('#'));
  const sourceLines = bodyLines.length > 0 ? bodyLines : nonEmptyLines;
  return sourceLines
    .slice(0, 2)
    .join(' ')
    .replace(/[#*`_[\]()]/g, '')
    .trim();
};

const formatArticleDate = (dateStr?: string, language: string = 'en'): string => {
  if (!dateStr) return '';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(parsed);
  } catch {
    return dateStr;
  }
};

const EngagementBar: React.FC<EngagementBarProps> = ({
  article,
  likeCount,
  commentCount,
  viewCount,
  isLiked,
  toggleLike,
  shareArticle,
  compact = false,
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  const handleShareClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    shareArticle(article.title || '', article.excerpt || '')
      .then((result) => {
        if (result === 'clipboard') {
          setCopied(true);
          if (copiedTimerRef.current !== null) {
            window.clearTimeout(copiedTimerRef.current);
          }
          copiedTimerRef.current = window.setTimeout(() => setCopied(false), 1800);
        }
      })
      .catch(() => {});
  };

  return (
    <div
      className={`flex items-center ${compact ? 'gap-2.5 sm:gap-3' : 'gap-3 sm:gap-4'} mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-400`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleLike().catch(() => {});
        }}
        className={`inline-flex items-center gap-1.5 min-h-[34px] px-1.5 -ml-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer group/btn ${
          isLiked
            ? 'text-rose-600 dark:text-rose-400'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50/70 dark:hover:bg-zinc-800/70'
        }`}
        aria-label={isLiked ? 'Unlike article' : 'Like article'}
        aria-pressed={isLiked}
      >
        <svg
          className={`w-4 h-4 shrink-0 transition-transform ${
            isLiked
              ? 'text-rose-500 fill-current scale-110'
              : 'text-zinc-500 dark:text-zinc-400 group-hover/btn:text-amber-600 dark:group-hover/btn:text-amber-400 group-hover/btn:scale-110'
          }`}
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
        <span className="tabular-nums whitespace-nowrap">
          {likeCount > 0 ? likeCount.toLocaleString() : 'Like'}
        </span>
      </button>

      <div
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 tabular-nums"
        title="Comments"
      >
        <svg
          className="w-4 h-4 shrink-0 text-zinc-500 dark:text-zinc-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span>{(commentCount || 0).toLocaleString()}</span>
      </div>

      <div className="inline-flex items-center gap-1.5 ml-auto text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-300 tabular-nums min-w-0">
        <svg
          className="w-4 h-4 shrink-0 text-amber-500 dark:text-amber-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
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
        <span className="truncate">
          {viewCount.toLocaleString()} {t('blog_readers') || 'readers'}
        </span>
      </div>

      <button
        type="button"
        onClick={handleShareClick}
        className={`inline-flex items-center justify-center min-w-[34px] min-h-[34px] -mr-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
          copied
            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50/70 dark:hover:bg-zinc-800/70'
        }`}
        aria-label={copied ? 'Link copied' : 'Share article'}
        title={copied ? 'Link copied' : 'Share article'}
      >
        {copied ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6.632l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        )}
      </button>
    </div>
  );
};

const ImageShimmerSkeleton: React.FC = () => (
  <div className="absolute inset-0 z-0 bg-zinc-200/80 dark:bg-zinc-800 overflow-hidden">
    <div className="w-full h-full bg-gradient-to-r from-transparent via-white/30 dark:via-white/5 to-transparent bg-[length:200%_100%] animate-shimmer" />
  </div>
);

const ArticleCard: React.FC<ArticleCardProps> = ({ article, variant = 'default', index = 0 }) => {
  const { t, language } = useLanguage();
  const isBn = language === 'bn';
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const { likeCount, commentCount, viewCount, isLiked, toggleLike, shareArticle } =
    useArticleEngagement(article.id);

  const imageSrc = article.imageUrl || '/blog-images/blog-placeholder.png';

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [imageSrc]);

  const emoji = getEmoji(article.title, article.category);
  const excerpt = getArticleExcerpt(article);
  const formattedDate = formatArticleDate(article.date, language);
  const articleHref = `/blog/${article.slug || article.id}`;
  const readTimeLabel = `${article.readTime} ${t('blog_min_read') || 'min read'}`;

  // HERO VARIANT — Modern 2-Column Split Editorial Hero Card
  if (variant === 'hero') {
    return (
      <Link
        to={articleHref}
        className="grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-lg hover:shadow-xl transition-all duration-300 group animate-fade-in-up"
      >
        {/* Left/Top Unobstructed Media Column */}
        <div className="lg:col-span-5 relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[360px]">
          {!isLoaded && <ImageShimmerSkeleton />}
          <img
            ref={imgRef}
            src={imageSrc}
            alt={article.title}
            width={1024}
            height={1024}
            loading="eager"
            fetchPriority="high"
            sizes="(max-width: 1024px) 100vw, 42vw"
            className={`w-full h-full object-cover object-[center_42%] group-hover:scale-105 transition-transform duration-500 ease-out ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setIsLoaded(true)}
            onError={(e) => {
              handleBlogImageError(e);
              setIsLoaded(true);
            }}
          />

          {/* Top-Left Featured / Category Pill */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm">
              <span aria-hidden="true">★</span>
              <span>{isBn ? 'ফিচার্ড' : 'Featured'}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-100 backdrop-blur-md shadow-sm border border-black/5 dark:border-white/10">
              <span aria-hidden="true">{emoji}</span>
              <span>{article.category || 'General'}</span>
            </span>
          </div>
        </div>

        {/* Right/Bottom Editorial Column */}
        <div className="lg:col-span-7 p-6 md:p-8 lg:p-10 flex flex-col justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  aria-hidden="true"
                  className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xs shrink-0"
                >
                  🐾
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                  {article.author}
                </span>
                {formattedDate && (
                  <>
                    <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-600">
                      •
                    </span>
                    <time dateTime={article.date} className="shrink-0">
                      {formattedDate}
                    </time>
                  </>
                )}
              </div>
              <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-500/20">
                {readTimeLabel}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-tight tracking-tight mb-3 sm:mb-4">
              {article.title}
            </h2>

            {excerpt && (
              <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed line-clamp-3">
                {excerpt}
              </p>
            )}
          </div>

          <EngagementBar
            article={article}
            likeCount={likeCount}
            commentCount={commentCount}
            viewCount={viewCount}
            isLiked={isLiked}
            toggleLike={toggleLike}
            shareArticle={shareArticle}
          />
        </div>
      </Link>
    );
  }

  // LARGE VARIANT — Responsive Split Editorial Card (1:1 square thumbnail on sm+)
  if (variant === 'large') {
    return (
      <Link
        to={articleHref}
        className="flex flex-col sm:flex-row h-full rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group animate-fade-in-up"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        {/* Dedicated Left/Top Unobstructed Thumbnail */}
        <div className="sm:w-2/5 relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 aspect-[4/3] sm:aspect-square flex-shrink-0">
          {!isLoaded && <ImageShimmerSkeleton />}
          <img
            ref={imgRef}
            src={imageSrc}
            alt={article.title}
            width={1024}
            height={1024}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 40vw, 22vw"
            className={`w-full h-full object-cover object-[center_42%] group-hover:scale-105 transition-transform duration-500 ease-out ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setIsLoaded(true)}
            onError={(e) => {
              handleBlogImageError(e);
              setIsLoaded(true);
            }}
          />

          <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/95 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-100 backdrop-blur-md shadow-sm border border-black/5 dark:border-white/10">
            <span aria-hidden="true">{emoji}</span>
            <span>{article.category || 'General'}</span>
          </span>
        </div>

        {/* Right Editorial Content Body */}
        <div className="p-4 sm:p-5 flex flex-col flex-grow min-w-0">
          <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate">
                {article.author}
              </span>
              {formattedDate && (
                <>
                  <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-600">
                    •
                  </span>
                  <time dateTime={article.date} className="shrink-0">
                    {formattedDate}
                  </time>
                </>
              )}
            </div>
            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-500/20">
              {readTimeLabel}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug line-clamp-2 mb-2">
            {article.title}
          </h3>

          {excerpt && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2 mb-4">
              {excerpt}
            </p>
          )}

          <EngagementBar
            article={article}
            likeCount={likeCount}
            commentCount={commentCount}
            viewCount={viewCount}
            isLiked={isLiked}
            toggleLike={toggleLike}
            shareArticle={shareArticle}
            compact
          />
        </div>
      </Link>
    );
  }

  // DEFAULT VARIANT — Vertical Editorial Split Card
  return (
    <Link
      to={articleHref}
      className="flex flex-col h-full rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Top Unobstructed 4:3 Thumbnail Frame */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
        {!isLoaded && <ImageShimmerSkeleton />}
        <img
          ref={imgRef}
          src={imageSrc}
          alt={article.title}
          width={1024}
          height={1024}
          loading="lazy"
          decoding="async"
          sizes={getResponsiveImageSizes('card')}
          className={`w-full h-full object-cover object-[center_42%] group-hover:scale-105 transition-transform duration-500 ease-out ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={(e) => {
            handleBlogImageError(e);
            setIsLoaded(true);
          }}
        />

        {/* Single Compact Category Badge */}
        <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/95 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-100 backdrop-blur-md shadow-sm border border-black/5 dark:border-white/10">
          <span aria-hidden="true">{emoji}</span>
          <span>{article.category || 'General'}</span>
        </span>
      </div>

      {/* Clean Editorial Content Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow">
        <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate">
              {article.author}
            </span>
            {formattedDate && (
              <>
                <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-600">
                  •
                </span>
                <time dateTime={article.date} className="shrink-0">
                  {formattedDate}
                </time>
              </>
            )}
          </div>
          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-500/20">
            {readTimeLabel}
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug line-clamp-2 mb-2">
          {article.title}
        </h3>

        {excerpt && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2 mb-4">
            {excerpt}
          </p>
        )}

        <EngagementBar
          article={article}
          likeCount={likeCount}
          commentCount={commentCount}
          viewCount={viewCount}
          isLiked={isLiked}
          toggleLike={toggleLike}
          shareArticle={shareArticle}
        />
      </div>
    </Link>
  );
};

export default React.memo(ArticleCard);
