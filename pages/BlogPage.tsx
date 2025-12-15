import React from 'react';
import ArticleCard from '../components/ArticleCard';
import { useArticles } from '../contexts/ArticleContext';
import { useLanguage } from '../contexts/LanguageContext';

const BlogPage: React.FC = () => {
  const { articles } = useArticles();
  const { t } = useLanguage();

  // Sort all articles by date, newest first
  const sortedArticles = [...articles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const latestArticle = sortedArticles[0];
  const otherArticles = sortedArticles.slice(1);

  return (
    <div className="container mx-auto px-3 md:px-6 py-12 md:py-16 animate-fade-in">
      <div className="text-center mb-10 md:mb-12 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold text-slate-800 dark:text-white">
          {t('blog_page_title')}
        </h1>
        <p className="text-base md:text-lg text-slate-700 dark:text-slate-200 mt-3 md:mt-4">
          {t('blog_page_subtitle')}
        </p>
      </div>

      {/* Articles Section */}
      {sortedArticles.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-8">
          {/* Featured Latest Article */}
          {latestArticle && <ArticleCard article={latestArticle} isFeatured={true} />}

          {/* Other Articles */}
          {otherArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogPage;
