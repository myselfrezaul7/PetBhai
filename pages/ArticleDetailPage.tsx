import React, { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useArticles } from '../contexts/ArticleContext';
import { generateImageFromPrompt } from '../services/geminiService';
import { ImageIcon, PawIcon } from '../components/icons';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useLanguage } from '../contexts/LanguageContext';

const ArticleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { articles, updateArticleImage, loading, error } = useArticles();
  const { t } = useLanguage();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');

  const article = useMemo(() => articles.find((a) => a.id === Number(id)), [id, articles]);

  const recentArticles = useMemo(
    () =>
      articles
        .filter((a) => a.id !== Number(id))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3),
    [articles, id]
  );

  const handleGenerateImage = useCallback(async () => {
    if (!article) return;
    setIsGenerating(true);
    setGenerationError('');
    try {
      const prompt = `একটি প্রাণবন্ত, বাস্তবসম্মত ছবি যা "${article.title}" শিরোনামের একটি ব্লগ পোস্টের জন্য উপযুক্ত। ছবিটি একটি পশু কল্যাণ সংস্থার ব্লগের জন্য মানানসই হতে হবে।`;
      const imageUrl = await generateImageFromPrompt(prompt);
      updateArticleImage(article.id, imageUrl);
    } catch (error) {
      console.error(error);
      setGenerationError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsGenerating(false);
    }
  }, [article, updateArticleImage]);

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
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">{error}</p>
      </main>
    );
  }

  if (!article) {
    return (
      <main className="text-center py-16 sm:py-20 animate-fade-in container mx-auto px-4 md:px-6">
        <div className="glass-card p-6 sm:p-8 md:p-12">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
            {t('article_not_found')}
          </h1>
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 mt-4">
            {t('article_not_found_desc')}
          </p>
          <Link
            to="/blog"
            className="mt-8 inline-block bg-orange-500 text-white font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-full text-base sm:text-lg hover:bg-orange-600 transition-colors touch-manipulation active:scale-95"
          >
            {t('btn_back_blog')}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Main Article Content */}
        <article className="lg:col-span-2">
          {/* Article Header */}
          <header className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-slate-800 dark:text-white leading-tight">
              {article.title}
            </h1>
            <div className="mt-4 text-slate-600 dark:text-slate-300 border-y border-slate-300/50 dark:border-slate-600/50 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm md:text-base">
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
          <figure className="w-full h-auto max-h-[500px] rounded-2xl shadow-lg mb-8 overflow-hidden bg-slate-200 dark:bg-slate-700">
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
                  className="w-16 h-16 md:w-24 md:h-24 text-slate-400 dark:text-slate-500 mb-4"
                  aria-hidden="true"
                />
                <h3 className="text-lg md:text-xl font-bold text-slate-700 dark:text-slate-200">
                  {t('article_generate_image')}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2 mb-4">
                  {t('article_generate_image_desc')}
                </p>
                <button
                  onClick={handleGenerateImage}
                  disabled={isGenerating}
                  className="bg-orange-500 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-orange-300 disabled:cursor-wait text-sm md:text-base touch-manipulation active:scale-95"
                >
                  {isGenerating ? t('btn_generating') : t('btn_generate_ai')}
                </button>
                {isGenerating && (
                  <div
                    className="mt-4 w-full max-w-xs bg-slate-300 dark:bg-slate-600 h-1 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-label="Generating image"
                  >
                    <div className="bg-orange-500 h-1 animate-pulse w-full"></div>
                  </div>
                )}
                {generationError && (
                  <p className="text-red-500 mt-4 text-sm" role="alert">
                    {generationError}
                  </p>
                )}
              </div>
            )}
          </figure>

          {/* Article Body */}
          <section className="glass-card p-4 md:p-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <MarkdownRenderer content={article.content} />
          </section>
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-1 mt-8 lg:mt-0" aria-labelledby="recent-articles-heading">
          <div className="lg:sticky lg:top-24">
            <h2
              id="recent-articles-heading"
              className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white mb-4 md:mb-6 pb-3 border-b-2 border-orange-500/50"
            >
              {t('recent_articles')}
            </h2>
            <nav className="space-y-4 md:space-y-6" aria-label="Recent articles">
              {recentArticles.map((a) => (
                <Link
                  to={`/blog/${a.id}`}
                  key={a.id}
                  className="block group glass-card p-3 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors touch-manipulation"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700">
                      <img
                        src={a.imageUrl}
                        alt=""
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-orange-600 transition-colors line-clamp-2 text-sm md:text-base">
                        {a.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
