import React from 'react';
import { MOCK_ARTICLES } from '../constants';
import ArticleCard from '../components/ArticleCard';

const BlogPage: React.FC = () => {
    // IDs of the new, important articles
    const popularArticleIds = [4, 5, 6, 7, 8];

    const popularArticles = MOCK_ARTICLES.filter(article => popularArticleIds.includes(article.id));
    const otherArticles = MOCK_ARTICLES.filter(article => !popularArticleIds.includes(article.id));


    return (
        <div className="container mx-auto px-6 py-16 animate-fade-in">
             <div className="text-center mb-12 max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white">PetBhai Blog</h1>
                <p className="text-lg text-slate-700 dark:text-slate-200 mt-4">
                    Your go-to resource for expert pet care tips, nutritional advice, training guides, and the latest product news.
                </p>
            </div>
            
            {/* Popular Topics Section */}
            {popularArticles.length > 0 && (
                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8 text-center border-b-2 border-orange-500/50 pb-4 max-w-md mx-auto">Popular Topics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
                        {popularArticles.map(article => (
                            <ArticleCard key={article.id} article={article} />
                        ))}
                    </div>
                </div>
            )}


            {/* All Articles Section */}
            {otherArticles.length > 0 && (
                 <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8 text-center border-b-2 border-orange-500/50 pb-4 max-w-md mx-auto">More Articles</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
                        {otherArticles.map(article => (
                            <ArticleCard key={article.id} article={article} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlogPage;