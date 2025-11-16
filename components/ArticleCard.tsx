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
    <div className={`glass-card overflow-hidden flex flex-col group ${isFeatured ? 'lg:col-span-2' : ''}`}>
      <Link to={`/blog/${article.id}`} className="flex flex-col h-full">
        <div className={`relative bg-slate-200 dark:bg-slate-700 ${isFeatured ? 'h-72' : 'h-56'}`}>
          {article.imageUrl ? (
              <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
              <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-slate-400 dark:text-slate-500" />
              </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300"></div>
          {isFeatured && (
             <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                Latest Post
             </span>
          )}
        </div>
        <div className="p-4 sm:p-6 flex flex-col flex-grow">
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{article.title}</h3>
          <p className="text-slate-700 dark:text-slate-300 mt-2 flex-grow text-sm sm:text-base line-clamp-3">{article.content.split('\n')[0]}</p>
          <div className="text-sm text-slate-600 dark:text-slate-400 mt-4">
              লিখেছেন: {article.author} &bull; {article.readTime} মিনিট পড়া
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-black/5 dark:bg-black/10 mt-auto text-center font-bold text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
            Read More
        </div>
      </Link>
    </div>
  );
};

export default React.memo(ArticleCard);