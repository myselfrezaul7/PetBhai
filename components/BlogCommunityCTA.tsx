import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const BlogCommunityCTA: React.FC = () => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  return (
    <div className="mt-8 mb-4 sm:mt-12 sm:mb-6 rounded-3xl p-6 md:p-8 bg-gradient-to-br from-orange-50 to-amber-100 dark:from-zinc-800/80 dark:to-orange-900/20 border border-orange-200/50 dark:border-orange-500/20 shadow-sm relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-orange-300/30 dark:bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto space-y-4">
        <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
          {isBn ? 'সাহায্য বা পরামর্শ প্রয়োজন?' : 'Need Help or Advice?'}
        </span>
        
        <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 dark:text-white leading-tight">
          {isBn 
            ? 'একা দুশ্চিন্তা করবেন না, আমরা আপনার পাশে আছি!' 
            : "Don't stress alone, we are here for you!"}
        </h3>
        
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
          {isBn 
            ? 'আপনার পোষা প্রাণী কি অস্বাভাবিক আচরণ করছে? বা আপনি কি সঠিক কাজ করছেন কিনা তা নিশ্চিত হতে চান? এখনই আমাদের কমিউনিটিতে একটি প্রশ্ন করুন।' 
            : 'Is your pet acting weird? Or do you just want to be sure you are doing the right thing? Ask a question in our community right now.'}
        </p>
        
        <div className="flex items-center space-x-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white/60 dark:bg-zinc-900/60 px-4 py-1.5 rounded-full border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex -space-x-2">
            {[300, 400, 500].map((weight) => (
              <div key={weight} className={`w-6 h-6 rounded-full border-2 border-white dark:border-zinc-800 bg-orange-${weight} flex items-center justify-center overflow-hidden`}>
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            ))}
          </div>
          <span>
            {isBn ? '৪.৫০ লক্ষ+ সদস্য যুক্ত হয়েছেন' : '450K+ members joined'}
          </span>
        </div>
        
        <a 
          href="https://www.facebook.com/groups/catwaala/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center justify-center w-full sm:w-auto px-8 py-3.5 text-base font-bold text-white bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-orange-500/30"
        >
          {isBn ? 'কমিউনিটিতে যুক্ত হোন' : 'Tap into the Community'}
          <svg className="w-5 h-5 ml-2 -mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </div>
    </div>
  );
};

export default BlogCommunityCTA;

