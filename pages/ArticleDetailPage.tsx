import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useArticles } from '../contexts/ArticleContext';
import { ImageIcon, PawIcon } from '../components/icons';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import BlogCommunityCTA from '../components/BlogCommunityCTA';
import ReadingProgressBar from '../components/ReadingProgressBar';
import { useArticleEngagement } from '../hooks/useArticleEngagement';
import { useAuth } from '../contexts/AuthContext';

const ArticleDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { articles, loading, error } = useArticles();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);
  const [commentText, setCommentText] = React.useState('');

  const article = useMemo(
    () => articles.find((a) => a.slug === slug || a.id.toString() === slug),
    [slug, articles]
  );

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
  } = useArticleEngagement(article?.id || '');

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: article?.title || 'PetBhai Blog',
      text: article?.excerpt || 'Check out this article on PetBhai!',
      url: url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setToastMsg('Link copied to clipboard!');
        setTimeout(() => setToastMsg(null), 3000);
      } catch (err) {
        console.error('Failed to copy!', err);
      }
    }
  };

  const handleToggleLike = async () => {
    try {
      await toggleLike();
    } catch (err: any) {
      if (err.message === 'AUTH_REQUIRED') {
        setToastMsg('Please sign in to like this article.');
        setTimeout(() => setToastMsg(null), 3000);
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await addComment(commentText);
      setCommentText('');
      setToastMsg('Comment added successfully!');
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err: any) {
      if (err.message === 'AUTH_REQUIRED') {
        setToastMsg('Please sign in to comment.');
        setTimeout(() => setToastMsg(null), 3000);
      }
    }
  };

  const recentArticles = useMemo(
    () =>
      articles
        .filter((a) => (article ? a.id !== article.id : true))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3),
    [articles, article]
  );

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
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        const text = trimmedLine.substring(2, trimmedLine.length - 2);
        const id = text
          .toLowerCase()
          .replace(/[^\w]+/g, '-')
          .replace(/(^-|-$)/g, '');
        extracted.push({ text, id });
      }
    });
    return extracted;
  }, [article?.content]);

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
              className="text-zinc-500 hover:text-orange-500 font-medium inline-flex items-center transition-colors px-2 py-1"
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
                {viewCount} {t('blog_readers') || 'readers'}
              </span>
            </div>

            {/* Engagement Bar */}
            <div className="mt-4 pt-4 flex items-center gap-6 text-zinc-600 dark:text-zinc-300">
              <button
                onClick={handleToggleLike}
                className="flex items-center gap-2 hover:text-red-500 transition-colors group"
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

              <div className="flex items-center gap-2">
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
              </div>

              <div
                className="flex items-center gap-2"
                title={`${viewCount} ${t('blog_readers') || 'readers'}`}
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <span className="font-semibold">{viewCount}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t('blog_readers') || 'readers'}
                </span>
              </div>
            </div>
          </header>

          {/* Article Image or Generator */}
          <figure className="glass-card-ios w-full h-auto max-h-[500px] rounded-2xl shadow-lg mb-8 overflow-hidden bg-slate-200/60 dark:bg-zinc-900/80 border border-amber-900/10 dark:border-amber-100/10 backdrop-blur-xl">
            {article.imageUrl ? (
              <img
                src={article.imageUrl}
                alt={article.title}
                width={800}
                height={500}
                className="w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
                sizes="(max-width: 768px) 100vw, 800px"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/blog-images/blog-placeholder.png';
                }}
              />
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
            <details className="lg:hidden glass-card-ios mb-8 border border-amber-900/10 dark:border-amber-100/10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl group overflow-hidden">
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
                  <ul className="space-y-3">
                    {headings.map((heading, i) => (
                      <li key={i}>
                        <a
                          href={`#${heading.id}`}
                          className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors line-clamp-2 block py-1"
                        >
                          {heading.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </details>
          )}

          {/* Article Body */}
          <section className="glass-card-ios p-4 md:p-8 bg-white/95 dark:bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-amber-900/10 dark:border-amber-100/10 mb-8">
            <MarkdownRenderer content={article.content} />
            <BlogCommunityCTA />
          </section>

          {/* Comment Section */}
          <section className="glass-card-ios p-4 md:p-8 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-amber-900/10 dark:border-amber-100/10">
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
              Comments ({commentCount || 0})
            </h2>

            {currentUser ? (
              <form onSubmit={handleAddComment} className="mb-8">
                <div className="relative">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/50 rounded-xl p-4 pr-12 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none min-h-[100px]"
                    maxLength={1000}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-zinc-400">
                    {commentText.length}/1000
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2 px-6 rounded-full transition-colors flex items-center gap-2"
                  >
                    Post Comment
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
              <div className="mb-8 bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-6 text-center border border-slate-200 dark:border-zinc-700/50">
                <p className="text-zinc-600 dark:text-zinc-300 mb-4">
                  Please sign in to join the conversation.
                </p>
                <Link
                  to="/login"
                  className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-full transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}

            <div className="space-y-6">
              {loadingComments ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
                      {(comment.userName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-slate-200 dark:border-zinc-700/50">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {comment.userName}
                          </h4>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap text-sm md:text-base">
                          {comment.text}
                        </p>
                      </div>
                      {currentUser?.id?.toString() === comment.userId && (
                        <div className="mt-2 ml-2">
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">
                  No comments yet. Be the first to share your thoughts!
                </p>
              )}
            </div>
          </section>
        </article>

        {/* Sidebar */}
        <aside
          className="lg:col-span-1 mt-8 lg:mt-0 space-y-8"
          aria-labelledby="recent-articles-heading"
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
                <ul className="space-y-3">
                  {headings.map((heading, i) => (
                    <li key={i}>
                      <a
                        href={`#${heading.id}`}
                        className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors line-clamp-2"
                      >
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          )}

          <div
            className={`${headings.length > 0 ? '' : 'lg:sticky lg:top-24'} glass-card-ios border border-amber-900/10 dark:border-amber-100/10 bg-white/95 dark:bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-xl p-4 md:p-5`}
          >
            <h2
              id="recent-articles-heading"
              className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4 md:mb-6 pb-3 border-b-2 border-orange-500/50"
            >
              {t('recent_articles')}
            </h2>
            <nav className="space-y-4 md:space-y-6" aria-label="Recent articles">
              {recentArticles.map((a) => (
                <Link
                  to={`/blog/${a.slug || a.id}`}
                  key={a.id}
                  className="block group glass-card-ios p-3 hover:bg-white/95 dark:bg-zinc-900/95 dark:hover:bg-slate-800/70 transition-colors touch-manipulation"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-zinc-900/95">
                      <img
                        src={a.imageUrl || '/blog-images/blog-placeholder.png'}
                        alt={`Thumbnail for ${a.title}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/blog-images/blog-placeholder.png';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-orange-600 transition-colors line-clamp-2 text-sm md:text-base">
                        {a.title}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-300 mt-1">
                        <time dateTime={a.date}>
                          {new Date(a.date).toLocaleDateString('en-GB', {
                            month: 'long',
                            day: 'numeric',
                          })}
                        </time>
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </nav>
          </div>
        </aside>
      </div>

      {/* Floating Share Button and Toasts */}
      <div className="fixed bottom-[120px] md:bottom-[120px] right-4 md:right-8 z-40 flex flex-col items-end pointer-events-none">
        {toastMsg && (
          <div className="mb-4 bg-zinc-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg pointer-events-auto transform transition-all animate-fade-in-up">
            {toastMsg}
          </div>
        )}
        <button
          onClick={handleShare}
          className="pointer-events-auto w-14 h-14 bg-gradient-to-tr from-orange-500 to-amber-400 text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 touch-manipulation hover:scale-105 active:scale-95 transition-all outline-none"
          aria-label="Share article"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </button>
      </div>
    </main>
  );
};

export default ArticleDetailPage;
