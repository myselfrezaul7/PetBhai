import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useArticles } from '../contexts/ArticleContext';
import { ImageIcon, PawIcon } from '../components/icons';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import BlogCommunityCTA from '../components/BlogCommunityCTA';
import ReadingProgressBar from '../components/ReadingProgressBar';

const ArticleDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { articles, loading, error } = useArticles();
  const { t } = useLanguage();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [shareToast, setShareToast] = React.useState<string | null>(null);

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
        setShareToast('Link copied to clipboard!');
        setTimeout(() => setShareToast(null), 3000);
      } catch (err) {
        console.error('Failed to copy!', err);
      }
    }
  };

  const article = useMemo(() => articles.find((a) => a.slug === slug || a.id.toString() === slug), [slug, articles]);

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
    // Strip markdown formatting using regex for basic clean up
    let cleanText = article.content.replace(/[#*`_\[\]()]/g, '');
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    // Get up to ~160 characters, ideally cutting at the last full word
    const truncated = cleanText.length > 155 ? cleanText.substring(0, 155) + '...' : cleanText;
    return truncated;
  }, [article]);

  const headings = useMemo(() => {
    if (!article?.content) return [];
    
    const lines = article.content.split('\n');
    const extracted: { text: string, id: string }[] = [];
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        const text = trimmedLine.substring(2, trimmedLine.length - 2);
        const id = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/(^-|-$)/g, '');
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
          <button onClick={() => { if(window.history.length > 2) navigate(-1); else navigate('/blog'); }} className="mt-8 inline-block bg-amber-500/10 dark:bg-amber-500/10 text-white font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-full text-base sm:text-lg hover:bg-amber-500/10 dark:bg-amber-500/10 transition-colors touch-manipulation active:scale-95">
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
            <button onClick={() => { if(window.history.length > 2) navigate(-1); else navigate('/blog'); }} className="text-zinc-500 hover:text-orange-500 font-medium inline-flex items-center transition-colors px-2 py-1">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
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
            </div>
          </header>

          {/* Article Image or Generator */}
          <figure className="glass-card-ios w-full h-auto max-h-[500px] rounded-2xl shadow-lg mb-8 overflow-hidden bg-slate-200/60 dark:bg-zinc-900/95/60 border border-amber-900/10 dark:border-amber-100/10 backdrop-blur-xl">
            {article.imageUrl ? (
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
                loading="lazy"
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
          <section className="glass-card-ios p-4 md:p-8 bg-white/95 dark:bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-amber-900/10 dark:border-amber-100/10">
            <MarkdownRenderer content={article.content} />
            <BlogCommunityCTA />
          </section>
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-1 mt-8 lg:mt-0 space-y-8" aria-labelledby="recent-articles-heading">
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

          <div className={`${headings.length > 0 ? '' : 'lg:sticky lg:top-24'} glass-card-ios border border-amber-900/10 dark:border-amber-100/10 bg-white/95 dark:bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-xl p-4 md:p-5`}>
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

      {/* Floating Share Button */}
      <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40 flex flex-col items-end pointer-events-none">
        {shareToast && (
          <div className="mb-4 bg-zinc-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg pointer-events-auto transform transition-all animate-fade-in-up">
            {shareToast}
          </div>
        )}
        <button
          onClick={handleShare}
          className="pointer-events-auto w-14 h-14 bg-gradient-to-tr from-orange-500 to-amber-400 text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 touch-manipulation hover:scale-105 active:scale-95 transition-all outline-none"
          aria-label="Share article"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
      </div>
    </main>
  );
};

export default ArticleDetailPage;
