import React from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../types';
import { ImageIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';
import { getResponsiveImageSizes, handleBlogImageError } from '../lib/imageUtils';

interface ArticleCardProps {
  article: Article;
  isFeatured?: boolean;
  index?: number;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, isFeatured = false, index = 0 }) => {
  const { t } = useLanguage();
  const [isLoaded, setIsLoaded] = React.useState(false);

  return (
    <div
      className={`glass-card-ios group overflow-hidden flex flex-col transform transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-2xl h-full border border-white/30 dark:border-white/10 animate-fade-in-up ${isFeatured ? 'col-span-2' : ''}`}
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
    >
      <Link to={`/blog/${article.slug || article.id}`} className="flex flex-col h-full">
        <div
          className={`relative overflow-hidden bg-slate-200 dark:bg-slate-700 w-full ${isFeatured ? 'h-56 sm:h-72 md:h-80 aspect-video sm:aspect-auto' : 'h-40 sm:h-56 aspect-[4/3] sm:aspect-auto'}`}
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
                handleBlogImageError(event);
                setIsLoaded(true);
              }}
            />
          ) : (
            <img  
              src="/blog-images/blog-placeholder.png"
              alt={article.title}
              className="w-full h-full object-cover transform transition-all duration-700 ease-out group-hover:scale-110"
              
              
              sizes={isFeatured ? '(max-width: 768px) 100vw, 66vw' : getResponsiveImageSizes('card')}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent opacity-70 group-hover:opacity-85 transition-opacity duration-500"></div>
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 text-2xl sm:text-3xl filter drop-shadow-md">
            {article.title.includes('কুকুর') || article.title.toLowerCase().includes('dog') ? '🐕' : article.title.includes('বিড়াল') || article.title.includes('বিড়াল') || article.title.toLowerCase().includes('cat') ? '🐱' : '🐾'}
          </div>

          <div className="absolute right-3 bottom-3 md:right-4 md:bottom-4 px-2.5 py-1 rounded-full bg-white/20 text-white text-xs md:text-sm border border-white/30 backdrop-blur-md">
            {article.readTime} {t('blog_min_read')}
          </div>

          {isFeatured && (
            <span className="absolute top-3 left-3 md:top-4 md:left-4 glass-card-ios bg-amber-500/90 dark:bg-amber-600/90 text-white text-xs md:text-sm font-bold px-2 py-1 md:px-3 md:py-1 rounded-full shadow-lg backdrop-blur-md border border-white/20">
              {t('blog_latest_post')}
            </span>
          )}
        </div>
        <div className="p-3 sm:p-6 flex flex-col flex-grow relative bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl">
          <div className="mb-2 sm:mb-3 text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">
            PetBhai Journal
          </div>
          <h3
            className={`font-bold text-zinc-900 dark:text-zinc-50 leading-tight group-hover:text-amber-600 dark:text-amber-500 dark:group-hover:text-orange-400 transition-colors duration-300 break-words line-clamp-2 ${isFeatured ? 'text-lg sm:text-2xl mb-2 sm:mb-3' : 'text-sm sm:text-lg mb-1 sm:mb-2'}`}
          >
            {article.title}
          </h3>
          {/* Hide description on mobile for standard cards to prevent overlap in 2-col layout */}
          <p
            className={`text-zinc-500 dark:text-zinc-200 flex-grow text-sm leading-relaxed line-clamp-3 ${!isFeatured ? 'hidden sm:block' : 'block'}`}
          >
            {article.content ? article.content.split('\n').filter(l => l.trim()).slice(0, 2).join(' ').replace(/[#*`_[\]()]/g, '').trim().substring(0, 120) + '...' : ''}
          </p>
          <div className="mt-2 sm:mt-6 pt-2 sm:pt-4 border-t border-white/40 dark:border-slate-700/60 flex items-center justify-between text-xs sm:text-sm text-zinc-500 dark:text-zinc-200">
            <span className="font-medium truncate mr-2 px-2 py-1 rounded-full bg-amber-50/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-50">
              {article.author}
            </span>
            <span className="whitespace-nowrap px-2 py-1 rounded-full bg-amber-50/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-50">
              {new Date(article.date).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default React.memo(ArticleCard);
