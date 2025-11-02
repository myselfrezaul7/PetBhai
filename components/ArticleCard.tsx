import React from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../types';

interface ArticleCardProps {
  article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  return (
    <Link to={`/blog/${article.id}`} className="glass-card overflow-hidden flex flex-col group">
      <div className="relative">
        <img src={article.imageUrl} alt={article.title} className="w-full h-56 object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300"></div>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{article.title}</h3>
        <p className="text-slate-700 dark:text-slate-300 mt-2 flex-grow text-base line-clamp-3">{article.content}</p>
        <div className="text-sm text-slate-600 dark:text-slate-400 mt-4 pt-4 border-t border-white/20 dark:border-slate-700/50">
            By {article.author} &bull; {article.readTime} min read
        </div>
      </div>
    </Link>
  );
};

export default React.memo(ArticleCard);