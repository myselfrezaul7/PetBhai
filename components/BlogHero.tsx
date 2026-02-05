import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { PawIcon } from './icons';

const BlogHero: React.FC = () => {
    const { t } = useLanguage();

    return (
        <div className="relative w-full h-[250px] md:h-[350px] rounded-2xl md:rounded-3xl overflow-hidden shadow-lg mb-8 md:mb-12 group">
            {/* Background Image */}
            <div className="absolute inset-0">
                <img
                    src="/blog-hero.png"
                    alt="PetBhai Blog Hero - Deshi Animals"
                    className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-teal-900/80 to-emerald-900/60 mix-blend-multiply" />
            </div>

            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />

            {/* Content Container */}
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 z-10">
                <div className="max-w-3xl mx-auto">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm border border-white/10">
                            <BookIcon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight shadow-sm">
                        {t('blog_page_title') || 'PetBhai Blog'}
                    </h1>

                    <p className="text-white/90 text-sm md:text-lg font-medium max-w-2xl mx-auto leading-relaxed text-shadow-sm">
                        {t('blog_page_subtitle') || 'Expert advice for your furry friends. Health, nutrition, and training tips for Bangladeshi pet owners.'}
                    </p>

                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        {['Health', 'Nutrition', 'Training', 'Lifestyle'].map((tag) => (
                            <span key={tag} className="px-3 py-1 bg-white/10 text-white text-xs md:text-sm rounded-full border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-colors cursor-default">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simple Book Icon for the Hero
const BookIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M11.25 4.533A9.707 9.707 0 006 3.375c-.975 0-1.886.192-2.735.543-.52.217-.852.75-.762 1.302l.66 4.624c.15.826 1.05 1.25 1.77.893.355-.175.75-.325 1.157-.428V19.5a2.25 2.25 0 01-2.25 2.25h13.5A2.25 2.25 0 0019.5 19.5V10.27c.407.103.802.253 1.157.428.72.358 1.62-.067 1.77-.893l.66-4.624c.09-.552-.242-1.085-.762-1.302A9.707 9.707 0 0018 3.375c-2.308 0-4.436.837-6.046 2.221a9.709 9.709 0 00-6.046-2.221c-1.611 0-3.033.43-4.258 1.185V19.5a2.25 2.25 0 012.25 2.25h9V4.533z" />
    </svg>
);

export default BlogHero;
