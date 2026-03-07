import React from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../types';
import { ImageIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';
import { getResponsiveImageSizes, handleImageError } from '../lib/imageUtils';

interface ArticleCardProps {
  article: Article;
  isFeatured?: boolean;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, isFeatured = false }) => {
  const { t } = useLanguage();
  const [isLoaded, setIsLoaded] = React.useState(false);

  return (
    <div
      className={`glass-card-ios group overflow-hidden flex flex-col transform transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-2xl h-full border border-white/30 dark:border-white/10 ${isFeatured ? 'col-span-2' : ''}`}
    >
      <Link to={`/blog/${article.id}`} className="flex flex-col h-full">
        <div
          className={`relative overflow-hidden bg-slate-200 dark:bg-slate-700 ${isFeatured ? 'h-48 sm:h-72 md:h-80' : 'h-32 sm:h-56'}`}
        >
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={article.title}
              className={`w-full h-full object-cover transform transition-all duration-700 ease-out group-hover:scale-110 ${isLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'}`}
              loading="lazy"
              decoding="async"
              sizes={isFeatured ? '(max-width: 768px) 100vw, 66vw' : getResponsiveImageSizes('card')}
              onLoad={() => setIsLoaded(true)}
              onError={(event) => {
                handleImageError(event);
                setIsLoaded(true);
              }}
            />
          ) : (
            <img
              src="/blog-images/blog-placeholder.png"
              alt={article.title}
              className="w-full h-full object-cover transform transition-all duration-700 ease-out group-hover:scale-110"
              loading="lazy"
              decoding="async"
              sizes={isFeatured ? '(max-width: 768px) 100vw, 66vw' : getResponsiveImageSizes('card')}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent opacity-70 group-hover:opacity-85 transition-opacity duration-500"></div>

          <div className="absolute right-3 bottom-3 md:right-4 md:bottom-4 px-2.5 py-1 rounded-full bg-white/20 text-white text-[10px] md:text-xs border border-white/30 backdrop-blur-md">
            {article.readTime} {t('blog_min_read')}
          </div>

          {isFeatured && (
            <span className="absolute top-3 left-3 md:top-4 md:left-4 glass-card-ios bg-orange-500/85 text-white text-[10px] md:text-xs font-bold px-2 py-1 md:px-3 md:py-1 rounded-full shadow-lg backdrop-blur-md border border-white/20">
              {t('blog_latest_post')}
            </span>
          )}
        </div>
        <div className="p-3 sm:p-6 flex flex-col flex-grow relative bg-white/35 dark:bg-slate-900/25 backdrop-blur-lg">
          <div className="mb-2 sm:mb-3 text-[9px] sm:text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
            PetBhai Journal
          </div>
          <h3
            className={`font-bold text-slate-800 dark:text-white leading-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300 break-words line-clamp-2 ${isFeatured ? 'text-lg sm:text-2xl mb-2 sm:mb-3' : 'text-xs sm:text-lg mb-1 sm:mb-2'}`}
          >
            {article.title}
          </h3>
          {/* Hide description on mobile for standard cards to prevent overlap in 2-col layout */}
          <p
            className={`text-slate-600 dark:text-slate-300 flex-grow text-xs md:text-sm leading-relaxed line-clamp-3 ${!isFeatured ? 'hidden sm:block' : 'block'}`}
          >
            {article.content.split('\n')[0]}
          </p>
          <div className="mt-2 sm:mt-6 pt-2 sm:pt-4 border-t border-white/40 dark:border-slate-700/60 flex items-center justify-between text-[9px] sm:text-sm text-slate-500 dark:text-slate-400">
            <span className="font-medium truncate mr-2 px-2 py-1 rounded-full bg-white/45 dark:bg-slate-800/55">
              {article.author}
            </span>
            <span className="whitespace-nowrap px-2 py-1 rounded-full bg-white/45 dark:bg-slate-800/55">
              {new Date(article.date).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default React.memo(ArticleCard);
