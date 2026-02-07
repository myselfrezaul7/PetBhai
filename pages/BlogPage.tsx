import React, { useMemo } from 'react';
import ArticleCard from '../components/ArticleCard';
import { ArticleGridSkeleton } from '../components/Skeletons';
import { useArticles } from '../contexts/ArticleContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PawIcon } from '../components/icons';

import BlogHero from '../components/BlogHero';

const BlogPage: React.FC = () => {
  const { articles, loading, error } = useArticles();
  const { t } = useLanguage();

  // Memoize sorted articles to prevent unnecessary recalculations
  const sortedArticles = useMemo(() => {
    return [...articles].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [articles]);

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 9;

  // Calculate pagination
  // Get current articles (Featured article is always separate if on first page, or maybe just part of the flow?
  // Let's keep the design: Featured + Grid.
  // If we have a featured article (index 0), then pagination applies to the REST.

  const latestArticle = sortedArticles[0];
  const allOtherArticles = sortedArticles.slice(1);

  const totalOtherPages = Math.ceil(allOtherArticles.length / itemsPerPage);
  const currentArticles = allOtherArticles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ... inside component ...

  if (loading) {
    return (
      <main className="container mx-auto px-3 md:px-6 py-8 md:py-16 animate-fade-in">
        <BlogHero />
        <div className="space-y-8">
          {/* Simulate Featured Article Loading */}
          <div className="mb-12 h-80 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
          {/* Grid Loading */}
          <ArticleGridSkeleton count={itemsPerPage} />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-16 text-center" role="alert">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Blog</h2>
        <p className="text-slate-600 dark:text-slate-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors touch-manipulation active:scale-95"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-3 md:px-6 py-8 md:py-16 animate-fade-in">
      <BlogHero />

      {/* Articles Section */}
      {sortedArticles.length > 0 ? (
        <section aria-label="Blog articles">
          <div className="space-y-8">
            {/* Featured Latest Article - Only on first page */}
            {currentPage === 1 && latestArticle && (
              <div className="mb-12">
                <ArticleCard article={latestArticle} isFeatured={true} />
              </div>
            )}

            {/* Other Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
              {currentArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalOtherPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="glass-card-ios px-4 py-3 flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === 1
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                        : 'bg-white text-slate-700 hover:bg-orange-50 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700'
                    }`}
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalOtherPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show first, last, current, and pages around current
                      return (
                        page === 1 || page === totalOtherPages || Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, index, array) => {
                      // Add ellipses
                      const showEllipsisStart = index > 0 && page - array[index - 1] > 1;

                      return (
                        <React.Fragment key={page}>
                          {showEllipsisStart && <span className="text-slate-400">...</span>}
                          <button
                            onClick={() => handlePageChange(page)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                              currentPage === page
                                ? 'bg-orange-500 text-white shadow-md transform scale-105'
                                : 'bg-white text-slate-700 hover:bg-orange-50 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalOtherPages}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === totalOtherPages
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                        : 'bg-white text-slate-700 hover:bg-orange-50 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-slate-600 dark:text-slate-400">No articles found.</p>
        </div>
      )}
    </main>
  );
};

export default BlogPage;
