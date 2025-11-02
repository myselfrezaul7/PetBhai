import React from 'react';
import { MOCK_ARTICLES } from '../constants';
import ArticleCard from '../components/ArticleCard';

const BlogPage: React.FC = () => {
    // Sort all articles by date, newest first
    const sortedArticles = [...MOCK_ARTICLES].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Take the first 5 as featured/popular
    const popularArticles = sortedArticles.slice(0, 5);
    const otherArticles = sortedArticles.slice(5);


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
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8 text-center border-b-2 border-orange-500/50 pb-4 max-w-md mx-auto">Recent Posts</h2>
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
                        {popularArticles.map(article => (
                            <ArticleCard key={article.id} article={article} />
                        ))}
                    </div>
                </div>
            )}


            {/* All Articles Section */}
            {otherArticles.length > 0 && (
                 <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8 text-center border-b-2 border-orange-500/50 pb-4 max-w-md mx-auto">Older Articles</h2>
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
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