import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_ARTICLES } from '../constants';
import ArticleCard from '../components/ArticleCard';

const ArticleDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const article = MOCK_ARTICLES.find(a => a.id === Number(id));
    
    const recentArticles = MOCK_ARTICLES
        .filter(a => a.id !== Number(id))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);

    if (!article) {
        return (
            <div className="text-center py-20 animate-fade-in container mx-auto px-6">
                <div className="glass-card p-12">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Article not found!</h1>
                    <p className="text-slate-700 dark:text-slate-200 mt-4">This article might have been moved or the link is incorrect.</p>
                    <Link to="/blog" className="mt-8 inline-block bg-orange-500 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-orange-600 transition-colors">
                        Back to Blog
                    </Link>
                </div>
            </div>
        );
    }
    
    const paragraphs = article.content.split('\n').filter(p => p.trim() !== '');

    return (
        <div className="container mx-auto px-6 py-12 animate-fade-in">
            <div className="max-w-4xl mx-auto">
                {/* Article Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-white">{article.title}</h1>
                    <div className="mt-4 text-slate-600 dark:text-slate-300">
                        <span>By <strong>{article.author}</strong></span>
                        <span className="mx-2">&bull;</span>
                        <span>{new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        <span className="mx-2">&bull;</span>
                        <span>{article.readTime} min read</span>
                    </div>
                </div>

                {/* Article Image */}
                <img src={article.imageUrl} alt={article.title} className="w-full h-auto max-h-[500px] object-cover rounded-2xl shadow-lg mb-8" />
                
                {/* Article Body */}
                <article className="prose prose-lg lg:prose-xl max-w-none text-slate-800 dark:text-slate-200">
                   {paragraphs.map((p, index) => (
                       <p key={index} className="mb-4 text-lg leading-relaxed">{p}</p>
                   ))}
                </article>

                {/* Other Posts */}
                {recentArticles.length > 0 && (
                    <div className="mt-16 pt-10 border-t border-slate-300/50 dark:border-slate-600/50">
                        <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-8">Read More Articles</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {recentArticles.map(a => <ArticleCard key={a.id} article={a} />)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArticleDetailPage;
