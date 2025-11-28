import React from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../types';
import { ImageIcon } from './icons';

interface ArticleCardProps {
  article: Article;
  isFeatured?: boolean;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, isFeatured = false }) => {
  return (
    <div className={`glass-card group overflow-hidden flex flex-col transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl h-full ${isFeatured ? 'lg:col-span-2' : ''}`}>
      <Link to={`/blog/${article.id}`} className="flex flex-col h-full">
        <div className={`relative overflow-hidden bg-slate-200 dark:bg-slate-700 ${isFeatured ? 'h-64 sm:h-80' : 'h-56'}`}>
          {article.imageUrl ? (
              <img 
                src={article.imageUrl} 
                alt={article.title} 
                className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105" 
                loading="lazy" 
              />
          ) : (
              <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-slate-400 dark:text-slate-500" />
              </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
          
          {isFeatured && (
             <span className="absolute top-4 left-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                Latest Post
             </span>
          )}
        </div>
        <div className="p-6 flex flex-col flex-grow relative">
          <div className="mb-2 text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
              {article.readTime} min read
          </div>
          <h3 className={`font-bold text-slate-800 dark:text-white leading-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors ${isFeatured ? 'text-2xl mb-3' : 'text-lg mb-2'}`}>
            {article.title}
          </h3>
          <p className="text-slate-600 dark:text-slate-300 flex-grow text-sm leading-relaxed line-clamp-3">
            {article.content.split('\n')[0]}
          </p>
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700/50 flex items-center justify-between text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium">{article.author}</span>
              <span>{new Date(article.date).toLocaleDateString()}</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default React.memo(ArticleCard);