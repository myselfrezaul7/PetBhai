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
    <div className={`glass-card group overflow-hidden flex flex-col transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl h-full ${isFeatured ? 'col-span-2' : ''}`}>
      <Link to={`/blog/${article.id}`} className="flex flex-col h-full">
        <div className={`relative overflow-hidden bg-slate-200 dark:bg-slate-700 ${isFeatured ? 'h-48 sm:h-72 md:h-80' : 'h-32 sm:h-56'}`}>
          {article.imageUrl ? (
              <img 
                src={article.imageUrl} 
                alt={article.title} 
                className="w-full h-full object-cover transform transition-transform duration-700 ease-out group-hover:scale-105" 
                loading="lazy"
                decoding="async"
              />
          ) : (
              <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 md:w-16 md:h-16 text-slate-400 dark:text-slate-500" />
              </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
          
          {isFeatured && (
             <span className="absolute top-3 left-3 md:top-4 md:left-4 bg-orange-500 text-white text-[10px] md:text-xs font-bold px-2 py-1 md:px-3 md:py-1 rounded-full shadow-lg backdrop-blur-sm">
                Latest Post
             </span>
          )}
        </div>
        <div className="p-3 sm:p-6 flex flex-col flex-grow relative">
          <div className="mb-1 sm:mb-2 text-[9px] sm:text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
              {article.readTime} min read
          </div>
          <h3 className={`font-bold text-slate-800 dark:text-white leading-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors break-words line-clamp-2 ${isFeatured ? 'text-lg sm:text-2xl mb-2 sm:mb-3' : 'text-xs sm:text-lg mb-1 sm:mb-2'}`}>
            {article.title}
          </h3>
          {/* Hide description on mobile for standard cards to prevent overlap in 2-col layout */}
          <p className={`text-slate-600 dark:text-slate-300 flex-grow text-xs md:text-sm leading-relaxed line-clamp-3 ${!isFeatured ? 'hidden sm:block' : 'block'}`}>
            {article.content.split('\n')[0]}
          </p>
          <div className="mt-2 sm:mt-6 pt-2 sm:pt-4 border-t border-slate-200 dark:border-slate-700/50 flex items-center justify-between text-[9px] sm:text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium truncate mr-2">{article.author}</span>
              <span className="whitespace-nowrap">{new Date(article.date).toLocaleDateString()}</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default React.memo(ArticleCard);