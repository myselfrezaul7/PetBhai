import React from 'react';
import ArticleCard from '../components/ArticleCard';
import { useArticles } from '../contexts/ArticleContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PawIcon } from '../components/icons';

const BlogPage: React.FC = () => {
  const { articles, loading, error } = useArticles();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
        <PawIcon className="absolute w-8 h-8 text-orange-500 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Blog</h2>
        <p className="text-slate-600 dark:text-slate-300">{error}</p>
      </div>
    );
  }

  // Sort all articles by date, newest first
  const sortedArticles = [...articles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const latestArticle = sortedArticles[0];
  const otherArticles = sortedArticles.slice(1);

  return (
    <div className="container mx-auto px-3 md:px-6 py-8 md:py-16 animate-fade-in">
      <div className="text-center mb-8 md:mb-12 max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 dark:text-white">
          {t('blog_page_title')}
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-slate-700 dark:text-slate-200 mt-2 md:mt-4 px-2">
          {t('blog_page_subtitle')}
        </p>
      </div>

      {/* Articles Section */}
      {sortedArticles.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-3 md:gap-8">
          {/* Featured Latest Article */}
          {latestArticle && <ArticleCard article={latestArticle} isFeatured={true} />}

          {/* Other Articles */}
          {otherArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-slate-600 dark:text-slate-400">No articles found.</p>
        </div>
      )}
    </div>
  );
};

export default BlogPage;
