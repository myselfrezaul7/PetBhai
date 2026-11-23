import React, { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useArticles } from '../contexts/ArticleContext';
import { ImageIcon, PawIcon } from '../components/icons';
import MarkdownRenderer, { generateHeadingId } from '../components/MarkdownRenderer';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import BlogCommunityCTA from '../components/BlogCommunityCTA';
import ReadingProgressBar from '../components/ReadingProgressBar';
import { useArticleEngagement } from '../hooks/useArticleEngagement';
import { useAuth } from '../contexts/AuthContext';
import ShareModal from '../components/ShareModal';
import { getErrorMessage } from '../services/apiClient';
import { getBaselineReaders } from '../lib/articleUtils';
import { safeStorage } from '../lib/storage';
import type { Article } from '../types';

const GUEST_NAME_STORAGE_KEY = 'petbhai_guest_name';
const GUEST_ID_STORAGE_KEY = 'petbhai_guest_id';
const BLOG_PLACEHOLDER_IMAGE = '/blog-images/blog-placeholder.png';

const getExistingGuestId = (): string | null => {
  const existing = safeStorage.getItem(GUEST_ID_STORAGE_KEY)?.trim();
  return existing && existing.startsWith('guest_') ? existing : null;
};

const RelatedArticleCard: React.FC<{ article: Article }> = ({ article }) => {
  const { t } = useLanguage();
  const { viewCount } = useArticleEngagement(article.id);
  const displayViews = Math.max(viewCount || 0, article.views || 0, getBaselineReaders(article.id));

  return (
    <Link
      to={`/blog/${article.slug || article.id}`}
      className="block group rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm hover:shadow-md hover:border-amber-500/40 transition-all duration-300 touch-manipulation"
    >
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <img
          src={article.imageUrl || BLOG_PLACEHOLDER_IMAGE}
          alt={`Thumbnail for ${article.title}`}
          className="w-full h-full object-cover object-[center_42%] transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = BLOG_PLACEHOLDER_IMAGE;
          }}
        />
        {article.category && (
          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/95 dark:bg-zinc-900/90 text-amber-700 dark:text-amber-400 border border-amber-500/20 shadow-xs">
            {article.category}
          </span>
        )}
      </div>

      <div className="p-3.5 space-y-2">
        <h3 className="font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-orange-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 text-sm md:text-base leading-snug">
          {article.title}
        </h3>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
          <time dateTime={article.date}>
            {new Date(article.date).toLocaleDateString('en-GB', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </time>

          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
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
            {displayViews.toLocaleString()} {t('blog_readers') || 'readers'}
          </span>
        </div>
      </div>
    </Link>
  );
};

const ArticleDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { articles, loading, error } = useArticles();
  const { t, language } = useLanguage();
  const isBn = language === 'bn';
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [guestName, setGuestName] = useState<string>(
    () => safeStorage.getItem(GUEST_NAME_STORAGE_KEY) || ''
  );
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const tocDetailsRef = useRef<HTMLDetailsElement>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMsg(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg(null);
      toastTimerRef.current = null;
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [slug]);

  const article = useMemo(
    () => articles.find((a) => a.slug === slug || a.id.toString() === slug),
    [slug, articles]
  );

  const [heroImageSrc, setHeroImageSrc] = useState<string>(article?.imageUrl || '');

  useEffect(() => {
    setHeroImageSrc(article?.imageUrl || '');
  }, [article?.imageUrl]);

  const {
    likeCount,
    commentCount,
    viewCount,
    isLiked,
    comments,
    loadingComments,
    toggleLike,
    addComment,
    deleteComment,
  } = useArticleEngagement(article?.id || '', { trackView: true });

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleToggleLike = async () => {
    try {
      await toggleLike();
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'AUTH_REQUIRED') {
        showToast(
          isBn
            ? 'আর্টিকেলে লাইক দিতে অনুগ্রহ করে সাইন ইন করুন।'
            : 'Please sign in to like this article.'
        );
      } else {
        showToast(getErrorMessage(err, 'Could not update like. Please try again.'));
      }
    }
  };

  const handleGuestNameChange = (value: string) => {
    setGuestName(value);
    safeStorage.setItem(GUEST_NAME_STORAGE_KEY, value);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = commentText.trim();
    if (!trimmedText || isSubmittingComment) return;

    const trimmedGuestName = guestName.trim();
    if (!currentUser && !trimmedGuestName) {
      showToast(
        isBn
          ? 'প্রশ্ন বা মন্তব্য পোস্ট করতে অনুগ্রহ করে আপনার নাম লিখুন।'
          : 'Please enter your name before posting your question or comment.'
      );
      return;
    }

    if (!currentUser) {
      safeStorage.setItem(GUEST_NAME_STORAGE_KEY, trimmedGuestName);
    }

    setIsSubmittingComment(true);
    try {
      if (currentUser) {
        await addComment(trimmedText);
      } else {
        await addComment(trimmedText, trimmedGuestName);
      }
      setCommentText('');
      showToast(
        isBn
          ? 'আপনার প্রশ্ন/মন্তব্য সফলভাবে প্রকাশিত হয়েছে!'
          : 'Your question/comment has been posted!'
      );
    } catch (err: unknown) {
      showToast(getErrorMessage(err, 'Could not post your question. Please try again.'));
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      showToast(isBn ? 'মন্তব্য মুছে ফেলা হয়েছে।' : 'Comment deleted.');
    } catch (err: unknown) {
      showToast(getErrorMessage(err, 'Could not delete your comment. Please try again.'));
    }
  };

  const relatedArticles = useMemo(() => {
    if (!article) {
      return articles.slice(0, 3);
    }

    const otherArticles = articles.filter(
      (a) => a.id !== article.id && (!article.slug || a.slug !== article.slug)
    );

    const sameCategory = article.category
      ? otherArticles
          .filter(
            (a) =>
              a.category &&
              a.category.trim().toLowerCase() === article.category?.trim().toLowerCase()
          )
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      : [];

    const selected = sameCategory.slice(0, 3);

    if (selected.length < 3) {
      const selectedIds = new Set(selected.map((a) => a.id));
      const remainingRecent = otherArticles
        .filter((a) => !selectedIds.has(a.id))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3 - selected.length);

      return [...selected, ...remainingRecent];
    }

    return selected;
  }, [articles, article]);

  const metaDescription = useMemo(() => {
    if (!article) return '';
    if (!article.content || typeof article.content !== 'string') return article.excerpt || '';
    // Strip markdown formatting using regex for basic clean up
    let cleanText = article.content.replace(/[#*`_\[\]()]/g, '');
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    // Get up to ~160 characters, ideally cutting at the last full word
    const truncated = cleanText.length > 155 ? cleanText.substring(0, 155) + '...' : cleanText;
    return truncated;
  }, [article]);

  const headings = useMemo(() => {
    if (!article?.content || typeof article.content !== 'string') return [];

    const lines = article.content.split('\n');
    const extracted: { text: string; id: string }[] = [];

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('### ')) {
        const text = trimmedLine.replace(/^###\s+/, '').trim();
        const id = generateHeadingId(text);
        if (text) extracted.push({ text, id });
      } else if (trimmedLine.startsWith('## ')) {
        const text = trimmedLine.replace(/^##\s+/, '').trim();
        const id = generateHeadingId(text);
        if (text) extracted.push({ text, id });
      } else if (
        trimmedLine.startsWith('**') &&
        trimmedLine.endsWith('**') &&
        trimmedLine.length > 4
      ) {
        const text = trimmedLine.substring(2, trimmedLine.length - 2).trim();
        const id = generateHeadingId(text);
        if (text) extracted.push({ text, id });
      }
    });
    return extracted;
  }, [article?.content]);

  useEffect(() => {
    if (headings.length === 0) {
      setActiveHeadingId('');
      return;
    }

    setActiveHeadingId(headings[0].id);

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;
      let currentActiveId = headings[0].id;

      for (const heading of headings) {
        const el = document.getElementById(heading.id);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY;
          if (top <= scrollPosition) {
            currentActiveId = heading.id;
          } else {
            break;
          }
        }
      }

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50) {
        currentActiveId = headings[headings.length - 1].id;
      }

      setActiveHeadingId((prev) => (prev !== currentActiveId ? currentActiveId : prev));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  if (loading) {
    return (
      <div
        className="flex justify-center items-center h-96"
        role="status"
        aria-label="Loading article"
      >
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
        <PawIcon className="absolute w-8 h-8 text-orange-500 animate-pulse" aria-hidden="true" />
        <span className="sr-only">Loading article...</span>
      </div>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-red-600 mb-4">Error Loading Article</h2>
        <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-300">{error}</p>
      </main>
    );
  }

  if (!article) {
    return (
      <main className="text-center py-16 sm:py-20 container mx-auto px-4 md:px-6">
        <div className="glass-card-ios p-6 sm:p-8 md:p-12">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {t('article_not_found')}
          </h1>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-300 mt-4">
            {t('article_not_found_desc')}
          </p>
          <button
            onClick={() => {
              if (window.history.length > 2) navigate(-1);
              else navigate('/blog');
            }}
            className="mt-8 inline-block bg-amber-500 dark:bg-amber-600 text-white font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-full text-base sm:text-lg hover:bg-amber-600 dark:hover:bg-amber-700 transition-colors touch-manipulation active:scale-95"
          >
            {t('btn_back_blog')}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 md:px-6 py-8 md:py-12">
      <SEO
        title={article.title}
        description={metaDescription}
        image={article.imageUrl || `https://www.petbhai.com/blog-images/blog-placeholder.png`}
        type="article"
        author={article.author}
        publishedTime={article.date}
        section="Blog"
      />
      <ReadingProgressBar />
      {/* Social Sharing Meta Tags Override (Double check via Helmet if SEO component misses these) */}
      {/* Note: The SEO component above handles this, but ensuring article-specific image logic is robust */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Main Article Content */}
        <article className="lg:col-span-2">
          <div className="mb-4 -ml-2">
            <button
              onClick={() => {
                if (window.history.length > 2) navigate(-1);
                else navigate('/blog');
              }}
              className="text-zinc-700 dark:text-zinc-300 hover:text-orange-500 font-medium inline-flex items-center transition-colors px-2 py-1"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {t('btn_back_blog') || 'Back to Blog'}
            </button>
          </div>
          {/* Article Header */}
          <header className="mb-6 md:mb-8 glass-card-ios border border-amber-900/10 dark:border-amber-100/10 bg-white/95 dark:bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-xl p-4 md:p-8">
            <span className="inline-flex items-center rounded-full bg-white/95 dark:bg-zinc-900/95 dark:bg-zinc-800/80 border border-amber-900/10 dark:border-amber-100/10 px-3 py-1 text-xs sm:text-sm font-semibold text-amber-600 dark:text-amber-500 mb-3">
              PetBhai Insights
            </span>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 leading-tight">
              {article.title}
            </h1>
            <div className="mt-4 text-zinc-500 dark:text-zinc-300 border-y border-slate-300/50 dark:border-amber-100/10 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm md:text-base">
              <span className="whitespace-nowrap">
                {t('article_written_by')} <strong>{article.author}</strong>
              </span>
              <span className="text-slate-400" aria-hidden="true">
                •
              </span>
              <time dateTime={article.date} className="whitespace-nowrap">
                {new Date(article.date).toLocaleDateString('en-GB', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              <span className="text-slate-400" aria-hidden="true">
                •
              </span>
              <span className="whitespace-nowrap">
                {article.readTime} {t('blog_min_read')}
              </span>
              <span className="text-slate-400" aria-hidden="true">
                •
              </span>
              <span className="whitespace-nowrap flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
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
                {Math.max(
                  viewCount || 0,
                  article.views || 0,
                  getBaselineReaders(article.id)
                ).toLocaleString()}{' '}
                {t('blog_readers') || 'readers'}
              </span>
            </div>

            {/* Engagement Bar + Share + Font Size Switcher */}
            <div className="mt-4 pt-4 flex flex-wrap items-center justify-between gap-4 text-zinc-600 dark:text-zinc-300">
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={handleToggleLike}
                  className="min-h-[40px] flex items-center gap-2 hover:text-red-500 transition-colors group"
                  aria-label={isLiked ? 'Unlike article' : 'Like article'}
                >
                  <svg
                    className={`w-6 h-6 transition-transform ${isLiked ? 'text-red-500 fill-current scale-110' : 'text-zinc-400 group-hover:scale-110'}`}
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
                  <span className="font-semibold">{likeCount || 0}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById('article-comments')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }
                  className="min-h-[40px] flex items-center gap-2 hover:text-orange-500 transition-colors"
                  aria-label="Scroll to comments"
                >
                  <svg
                    className="w-6 h-6 text-zinc-400"
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
                  <span className="font-semibold">{commentCount || 0}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="min-h-[40px] flex items-center gap-1.5 hover:text-orange-500 transition-colors"
                  aria-label="Share article"
                >
                  <svg
                    className="w-5 h-5 text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  <span className="text-sm font-semibold">Share</span>
                </button>
              </div>

              {/* Font Size Switcher (A- / A / A+) */}
              <div
                className="inline-flex items-center rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-100/80 dark:bg-zinc-800/80 p-1"
                role="group"
                aria-label="Reading text size"
              >
                {(
                  [
                    { key: 'sm', label: 'A-', title: 'Standard text size (16px)' },
                    { key: 'md', label: 'A', title: 'Comfortable text size (18px)' },
                    { key: 'lg', label: 'A+', title: 'Large text size (20px)' },
                  ] as const
                ).map((sizeOpt) => (
                  <button
                    key={sizeOpt.key}
                    type="button"
                    onClick={() => setFontSize(sizeOpt.key)}
                    title={sizeOpt.title}
                    aria-pressed={fontSize === sizeOpt.key}
                    className={`min-h-[34px] min-w-[36px] rounded-lg px-2.5 text-xs font-bold transition-all ${
                      fontSize === sizeOpt.key
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    {sizeOpt.label}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {/* Subject-Preserving Article Feature Image Showcase */}
          <figure className="relative glass-card-ios w-full rounded-2xl shadow-lg mb-8 overflow-hidden bg-slate-100/80 dark:bg-zinc-900/90 border border-amber-900/10 dark:border-amber-100/10 backdrop-blur-xl">
            {heroImageSrc ? (
              <div className="relative w-full min-h-[260px] sm:min-h-[340px] flex items-center justify-center p-3 sm:p-5 overflow-hidden">
                <img
                  src={heroImageSrc}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover opacity-25 blur-2xl scale-110 pointer-events-none select-none"
                  loading="eager"
                />
                <img
                  src={heroImageSrc}
                  alt={article.title}
                  width={1024}
                  height={1024}
                  className="relative z-10 max-h-[480px] w-auto max-w-full mx-auto object-contain rounded-xl shadow-md"
                  loading="eager"
                  sizes="(max-width: 768px) 100vw, 800px"
                  onError={() => {
                    if (heroImageSrc !== BLOG_PLACEHOLDER_IMAGE) {
                      setHeroImageSrc(BLOG_PLACEHOLDER_IMAGE);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="w-full min-h-[300px] h-full flex flex-col items-center justify-center p-6 text-center">
                <ImageIcon
                  className="w-16 h-16 md:w-24 md:h-24 text-zinc-500 dark:text-zinc-300 mb-4"
                  aria-hidden="true"
                />
                <h3 className="text-lg md:text-xl font-bold text-zinc-500 dark:text-zinc-300">
                  Feature photo coming soon
                </h3>
                <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-300 mt-2">
                  This article does not have a feature photo yet.
                </p>
              </div>
            )}
          </figure>

          {/* Mobile Table of Contents Accordion */}
          {headings.length > 0 && (
            <details
              ref={tocDetailsRef}
              className="lg:hidden glass-card-ios mb-8 border border-amber-900/10 dark:border-amber-100/10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl group overflow-hidden"
            >
              <summary className="p-4 md:p-5 text-lg font-bold text-zinc-900 dark:text-zinc-50 cursor-pointer flex justify-between items-center outline-none list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📑</span> বিষয়বস্তু
                </div>
                <svg
                  className="w-5 h-5 text-zinc-500 transition-transform group-open:-rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div className="p-4 md:p-5 pt-0 mt-[-8px] border-t border-amber-900/5 dark:border-amber-100/5">
                <nav aria-label="Mobile table of contents">
                  <ul className="space-y-2">
                    {headings.map((heading, i) => {
                      const isActive = activeHeadingId === heading.id;
                      return (
                        <li key={i}>
                          <a
                            href={`#${heading.id}`}
                            onClick={() => {
                              setActiveHeadingId(heading.id);
                              if (tocDetailsRef.current) {
                                tocDetailsRef.current.open = false;
                              }
                            }}
                            className={`text-sm transition-all py-2 px-3 rounded-lg flex items-start gap-2 ${
                              isActive
                                ? 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border-l-4 border-amber-500 shadow-sm'
                                : 'text-zinc-600 dark:text-zinc-300 hover:text-orange-500 dark:hover:text-orange-400 font-medium'
                            }`}
                          >
                            {isActive && (
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 flex-shrink-0" />
                            )}
                            <span className="line-clamp-2 break-words">{heading.text}</span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
            </details>
          )}

          {/* Article Body */}
          <section className="glass-card-ios p-4 md:p-8 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-amber-900/10 dark:border-amber-100/10 mb-8">
            <MarkdownRenderer content={article.content} fontSize={fontSize} />
            <BlogCommunityCTA />
          </section>

          {/* Questions & Comments Section */}
          <section
            id="article-comments"
            className="glass-card-ios p-4 md:p-8 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-amber-900/10 dark:border-amber-100/10 scroll-mt-24"
          >
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6 flex items-center gap-2">
              <svg
                className="w-6 h-6 text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                />
              </svg>
              {t('questions_and_comments') &&
              t('questions_and_comments') !== 'questions_and_comments'
                ? t('questions_and_comments')
                : isBn
                  ? 'প্রশ্ন ও মন্তব্য'
                  : 'Questions & Comments'}{' '}
              ({commentCount || 0})
            </h2>

            {currentUser ? (
              <form onSubmit={handleAddComment} className="mb-8">
                <div className="relative">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={
                      isBn
                        ? 'এই গাইড সম্পর্কে আপনার প্রশ্ন বা অভিজ্ঞতা লিখুন...'
                        : 'Ask a question about this guide or share your thoughts...'
                    }
                    className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/50 rounded-xl p-4 pr-14 text-base sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none min-h-[104px]"
                    maxLength={1000}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-zinc-400">
                    {commentText.length}/1000
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={!commentText.trim() || isSubmittingComment}
                    className="min-h-[44px] bg-orange-600 hover:bg-orange-700 disabled:bg-slate-200 disabled:text-zinc-400 disabled:cursor-not-allowed dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 text-white font-semibold py-2 px-6 rounded-full transition-colors flex items-center gap-2 text-sm"
                  >
                    {isSubmittingComment
                      ? isBn
                        ? 'পোস্ট হচ্ছে...'
                        : 'Posting...'
                      : isBn
                        ? 'প্রশ্ন / মন্তব্য পোস্ট করুন'
                        : 'Post Question / Comment'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={handleAddComment}
                className="mb-8 rounded-2xl bg-amber-50/60 dark:bg-zinc-800/60 border border-amber-200/70 dark:border-zinc-700/70 p-4 sm:p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {isBn ? 'প্রশ্ন করুন বা মন্তব্য লিখুন' : 'Ask a Question or Leave a Comment'}
                  </h3>
                  <Link
                    to="/login"
                    className="text-xs font-semibold text-orange-600 dark:text-amber-400 hover:underline"
                  >
                    {isBn ? 'অথবা সাইন ইন করুন' : 'Or sign in'}
                  </Link>
                </div>

                <div>
                  <label
                    htmlFor="article-guest-name"
                    className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
                  >
                    {isBn ? 'আপনার নাম *' : 'Your Name *'}
                  </label>
                  <input
                    id="article-guest-name"
                    type="text"
                    required
                    maxLength={80}
                    value={guestName}
                    onChange={(e) => handleGuestNameChange(e.target.value)}
                    placeholder={
                      isBn ? 'যেমন: সামিরা / টমির অভিভাবক' : "e.g., Samira / Milo's parent"
                    }
                    className="w-full min-h-[44px] bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-base sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>

                <div className="relative">
                  <label
                    htmlFor="article-guest-comment"
                    className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
                  >
                    {isBn ? 'আপনার প্রশ্ন বা মন্তব্য *' : 'Your Question or Comment *'}
                  </label>
                  <textarea
                    id="article-guest-comment"
                    required
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={
                      isBn
                        ? 'আপনার পোষা প্রাণী বা এই লেখাটি নিয়ে কোনো প্রশ্ন থাকলে এখানে লিখুন...'
                        : 'Ask a question about your pet or leave a comment on this guide...'
                    }
                    className="w-full bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-700 rounded-xl p-4 pr-14 text-base sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none min-h-[104px]"
                    maxLength={1000}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-zinc-400">
                    {commentText.length}/1000
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {isBn
                      ? 'কোনো অ্যাকাউন্ট ছাড়াই সরাসরি প্রশ্ন বা মন্তব্য করতে পারবেন।'
                      : 'No account needed — post your question or comment right away.'}
                  </p>
                  <button
                    type="submit"
                    disabled={!commentText.trim() || !guestName.trim() || isSubmittingComment}
                    className="min-h-[44px] bg-orange-600 hover:bg-orange-700 disabled:bg-slate-200 disabled:text-zinc-400 disabled:cursor-not-allowed dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 text-white font-semibold py-2 px-6 rounded-full transition-colors flex items-center gap-2 text-sm"
                  >
                    {isSubmittingComment
                      ? isBn
                        ? 'পোস্ট হচ্ছে...'
                        : 'Posting...'
                      : isBn
                        ? 'প্রশ্ন / মন্তব্য পোস্ট করুন'
                        : 'Post Question / Comment'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-6">
              {loadingComments ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment) => {
                  const activeGuestId = !currentUser ? getExistingGuestId() : null;
                  const isModerator = Boolean(
                    currentUser?.role &&
                    ['super_admin', 'store_manager', 'moderator'].includes(currentUser.role)
                  );
                  const canDelete =
                    isModerator ||
                    (Boolean(currentUser) && currentUser?.id?.toString() === comment.userId) ||
                    (!currentUser &&
                      Boolean(activeGuestId) &&
                      comment.userId?.startsWith('guest_') &&
                      comment.userId === activeGuestId);

                  return (
                    <div key={comment.id} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
                        {(comment.userName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-slate-200 dark:border-zinc-700/50">
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {comment.userName}
                              </h4>
                              {(comment.isGuest || comment.userId?.startsWith('guest')) && (
                                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                  {isBn ? 'ভিজিটর' : 'Visitor'}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap text-sm md:text-base">
                            {comment.text}
                          </p>
                        </div>
                        {canDelete && (
                          <div className="mt-2 ml-2">
                            <button
                              type="button"
                              onClick={() => void handleDeleteComment(comment.id)}
                              className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                            >
                              {isBn ? 'মুছে ফেলুন' : 'Delete'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">
                  {isBn
                    ? 'এখনো কোনো প্রশ্ন বা মন্তব্য নেই। প্রথম প্রশ্নটি আপনি করুন!'
                    : 'No questions or comments yet. Be the first to ask or share your thoughts!'}
                </p>
              )}
            </div>
          </section>
        </article>

        {/* Sidebar */}
        <aside
          className="lg:col-span-1 mt-8 lg:mt-0 space-y-8"
          aria-labelledby="related-articles-heading"
        >
          {headings.length > 0 && (
            <div className="lg:sticky lg:top-24 hidden lg:block glass-card-ios border border-amber-900/10 dark:border-amber-100/10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-4 md:p-5 mb-8">
              <h2
                id="toc-heading"
                className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4 md:mb-6 pb-3 border-b-2 border-orange-500/50"
              >
                Table of Contents
              </h2>
              <nav aria-label="Table of contents">
                <ul className="space-y-2">
                  {headings.map((heading, i) => {
                    const isActive = activeHeadingId === heading.id;
                    return (
                      <li key={i}>
                        <a
                          href={`#${heading.id}`}
                          onClick={() => setActiveHeadingId(heading.id)}
                          className={`text-sm transition-all line-clamp-2 py-1.5 px-3 rounded-lg flex items-center gap-2 ${
                            isActive
                              ? 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border-l-4 border-amber-500 shadow-sm'
                              : 'text-zinc-600 dark:text-zinc-300 hover:text-orange-500 dark:hover:text-orange-400 font-medium'
                          }`}
                        >
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 flex-shrink-0" />
                          )}
                          <span className="truncate">{heading.text}</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          )}

          <div
            className={`${headings.length > 0 ? '' : 'lg:sticky lg:top-24'} glass-card-ios border border-amber-900/10 dark:border-amber-100/10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-4 md:p-5`}
          >
            <h2
              id="related-articles-heading"
              className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4 md:mb-6 pb-3 border-b-2 border-orange-500/50"
            >
              {t('related_articles') && t('related_articles') !== 'related_articles'
                ? t('related_articles')
                : 'Related Articles'}
            </h2>
            <nav className="space-y-4 md:space-y-5" aria-label="Related articles">
              {relatedArticles.map((a) => (
                <RelatedArticleCard key={a.id} article={a} />
              ))}
            </nav>
          </div>
        </aside>
      </div>

      {/* Toasts */}
      {toastMsg && (
        <div className="fixed bottom-[calc(5.75rem+var(--safe-bottom))] right-4 md:right-8 z-40 flex flex-col items-end pointer-events-none">
          <div className="bg-zinc-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg pointer-events-auto transform transition-all animate-fade-in-up">
            {toastMsg}
          </div>
        </div>
      )}

      {article && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          metadata={{
            title: article.title,
            description: article.excerpt || article.content.slice(0, 160),
            path: `/blog/${article.slug || article.id}`,
            imageUrl: article.imageUrl,
            category: article.category,
            type: 'article',
          }}
        />
      )}
    </main>
  );
};

export default ArticleDetailPage;
