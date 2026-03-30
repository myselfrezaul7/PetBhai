import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useArticles } from '../contexts/ArticleContext';
import { ImageIcon, PawIcon } from '../components/icons';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';

const ArticleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { articles, loading, error } = useArticles();
  const { t } = useLanguage();

  const article = useMemo(() => articles.find((a) => a.id === Number(id)), [id, articles]);

  const recentArticles = useMemo(
    () =>
      articles
        .filter((a) => a.id !== Number(id))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3),
    [articles, id]
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
        <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400">{error}</p>
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

  if (!article) {
    return (
      <main className="text-center py-16 sm:py-20 container mx-auto px-4 md:px-6">
        <div className="glass-card-ios p-6 sm:p-8 md:p-12">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {t('article_not_found')}
          </h1>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-4">
            {t('article_not_found_desc')}
          </p>
          <Link
            to="/blog"
            className="mt-8 inline-block bg-amber-500/10 dark:bg-amber-500/10 text-white font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-full text-base sm:text-lg hover:bg-amber-500/10 dark:bg-amber-500/10 transition-colors touch-manipulation active:scale-95"
          >
            {t('btn_back_blog')}
          </Link>
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
      {/* Social Sharing Meta Tags Override (Double check via Helmet if SEO component misses these) */}
      {/* Note: The SEO component above handles this, but ensuring article-specific image logic is robust */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Main Article Content */}
        <article className="lg:col-span-2">
          {/* Article Header */}
          <header className="mb-6 md:mb-8 glass-card-ios border border-amber-900/10 dark:border-amber-100/10 bg-white/95 dark:bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-xl p-4 md:p-8">
            <span className="inline-flex items-center rounded-full bg-white/95 dark:bg-zinc-900/95 dark:bg-zinc-800/80 border border-amber-900/10 dark:border-amber-100/10 px-3 py-1 text-xs sm:text-sm font-semibold text-amber-600 dark:text-amber-500 mb-3">
              PetBhai Insights
            </span>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 leading-tight">
              {article.title}
            </h1>
            <div className="mt-4 text-zinc-500 dark:text-zinc-400 border-y border-slate-300/50 dark:border-amber-100/10 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm md:text-base">
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
                  className="w-16 h-16 md:w-24 md:h-24 text-zinc-500 dark:text-zinc-400 mb-4"
                  aria-hidden="true"
                />
                <h3 className="text-lg md:text-xl font-bold text-zinc-500 dark:text-zinc-400">
                  Feature photo coming soon
                </h3>
                <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-2">
                  This article does not have a feature photo yet.
                </p>
              </div>
            )}
          </figure>

          {/* Article Body */}
          <section className="glass-card-ios p-4 md:p-8 bg-white/95 dark:bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-amber-900/10 dark:border-amber-100/10">
            <MarkdownRenderer content={article.content} />
          </section>
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-1 mt-8 lg:mt-0" aria-labelledby="recent-articles-heading">
          <div className="lg:sticky lg:top-24 glass-card-ios border border-amber-900/10 dark:border-amber-100/10 bg-white/95 dark:bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-xl p-4 md:p-5">
            <h2
              id="recent-articles-heading"
              className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4 md:mb-6 pb-3 border-b-2 border-orange-500/50"
            >
              {t('recent_articles')}
            </h2>
            <nav className="space-y-4 md:space-y-6" aria-label="Recent articles">
              {recentArticles.map((a) => (
                <Link
                  to={`/blog/${a.id}`}
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
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
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
    </main>
  );
};

export default ArticleDetailPage;
