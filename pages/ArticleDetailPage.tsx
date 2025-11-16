import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import ArticleCard from '../components/ArticleCard';
import { useArticles } from '../contexts/ArticleContext';
import { generateImageFromPrompt } from '../services/geminiService';
import { ImageIcon } from '../components/icons';

const ArticleDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { articles, updateArticleImage } = useArticles();
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState('');
    
    const article = useMemo(() => articles.find(a => a.id === Number(id)), [id, articles]);
    
    const recentArticles = useMemo(() => articles
        .filter(a => a.id !== Number(id))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3), [articles, id]);

    const handleGenerateImage = async () => {
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
    };

    if (!article) {
        return (
            <div className="text-center py-20 animate-fade-in container mx-auto px-6">
                <div className="glass-card p-12">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">আর্টিকেল খুঁজে পাওয়া যায়নি!</h1>
                    <p className="text-slate-700 dark:text-slate-200 mt-4">এই আর্টিকেলটি সরানো হতে পারে অথবা লিঙ্কটি ভুল।</p>
                    <Link to="/blog" className="mt-8 inline-block bg-orange-500 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-orange-600 transition-colors">
                        ব্লগে ফিরে যান
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
                        <span>লিখেছেন: <strong>{article.author}</strong></span>
                        <span className="mx-2">&bull;</span>
                        <span>{new Date(article.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        <span className="mx-2">&bull;</span>
                        <span>{article.readTime} মিনিট পড়া</span>
                    </div>
                </div>

                {/* Article Image or Generator */}
                <div className="w-full h-auto max-h-[500px] rounded-2xl shadow-lg mb-8 overflow-hidden">
                    {article.imageUrl ? (
                        <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full min-h-[400px] h-full bg-slate-200 dark:bg-slate-700 flex flex-col items-center justify-center p-8 text-center">
                            <ImageIcon className="w-24 h-24 text-slate-400 dark:text-slate-500 mb-4" />
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">একটি ফিচার ফটো তৈরি করুন</h3>
                            <p className="text-slate-600 dark:text-slate-300 mt-2 mb-4">এই আর্টিকেলের জন্য একটি অনন্য AI-জেনারেটেড ছবি তৈরি করতে বোতামটি ক্লিক করুন।</p>
                            <button
                                onClick={handleGenerateImage}
                                disabled={isGenerating}
                                className="bg-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-orange-300 disabled:cursor-wait"
                            >
                                {isGenerating ? 'জেনারেট হচ্ছে...' : 'AI দিয়ে তৈরি করুন'}
                            </button>
                            {isGenerating && <div className="mt-4 w-full bg-slate-300 dark:bg-slate-600 h-1 rounded-full overflow-hidden"><div className="bg-orange-500 h-1 animate-pulse w-full"></div></div>}
                            {generationError && <p className="text-red-500 mt-4">{generationError}</p>}
                        </div>
                    )}
                </div>
                
                {/* Article Body */}
                <article className="prose prose-lg lg:prose-xl max-w-none text-slate-800 dark:text-slate-200">
                   {paragraphs.map((p, index) => (
                       <p key={index} className="mb-4 text-lg leading-relaxed">{p}</p>
                   ))}
                </article>

                {/* Other Posts */}
                {recentArticles.length > 0 && (
                    <div className="mt-16 pt-10 border-t border-slate-300/50 dark:border-slate-600/50">
                        <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-8">আরও আর্টিকেল পড়ুন</h2>
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