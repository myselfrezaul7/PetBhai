import React from 'react';
import { Link } from 'react-router-dom';
import { MOCK_BRANDS } from '../constants';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../contexts/ProductContext';
import { useLanguage } from '../contexts/LanguageContext';

const HomePage: React.FC = () => {
  const { products } = useProducts();
  const { t } = useLanguage();
  const bestSellers = [...products].sort((a, b) => b.rating - a.rating).slice(0, 4);
  const newArrivals = [...products].sort((a, b) => b.id - a.id).slice(0, 4);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section
        className="container mx-auto px-4 md:px-6 pt-16 md:pt-24 pb-12 animate-fade-in"
        style={{ animationDelay: '0ms' }}
      >
        <div className="glass-card text-center p-8 md:p-20 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-orange-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

          <h1 className="relative z-10 text-4xl md:text-7xl font-extrabold text-slate-800 dark:text-white drop-shadow-sm tracking-tight leading-tight">
            {t('hero_title')}
          </h1>
          <p className="relative z-10 mt-6 text-base md:text-2xl max-w-3xl mx-auto text-slate-600 dark:text-slate-200 font-medium">
            {t('hero_subtitle')}
          </p>
          <div className="relative z-10 mt-10 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link
              to="/adopt"
              className="inline-block bg-orange-500 text-white font-bold py-3 px-8 md:py-4 md:px-10 rounded-full text-lg hover:bg-orange-600 transition-all transform hover:scale-105 duration-300 shadow-xl shadow-orange-500/30"
            >
              {t('btn_adopt')}
            </Link>
            <Link
              to="/shop"
              className="inline-block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white font-bold py-3 px-8 md:py-4 md:px-10 rounded-full text-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all transform hover:scale-105 duration-300 shadow-lg"
            >
              {t('btn_shop')}
            </Link>
          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="py-12 md:py-20 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="container mx-auto px-3 md:px-6">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-slate-800 dark:text-white mb-2 md:mb-4">
              {t('section_best_sellers')}
            </h2>
            <p className="max-w-2xl mx-auto text-sm md:text-lg text-slate-600 dark:text-slate-400">
              {t('section_best_sellers_sub')}
            </p>
          </div>
          {/* Mobile optimized grid: gap-3 for mobile, gap-8 for desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Vet Consultation CTA -> Services CTA */}
      <section className="py-12 md:py-20 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="glass-card p-0 overflow-hidden flex flex-col md:flex-row-reverse items-center">
            <div className="md:w-1/2 h-48 md:h-auto w-full">
              <img
                src="https://picsum.photos/seed/services-cta/800/600"
                alt="Professional Pet Services"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="md:w-1/2 p-6 md:p-16 text-center md:text-left">
              <h2 className="text-2xl md:text-5xl font-bold text-slate-800 dark:text-white leading-tight">
                {t('section_services_title')}
              </h2>
              <p className="text-sm md:text-lg text-slate-600 dark:text-slate-300 mt-4 md:mt-6 leading-relaxed">
                {t('section_services_desc')}
              </p>
              <Link
                to="/services"
                className="mt-6 md:mt-8 inline-flex items-center space-x-2 bg-orange-500 text-white font-bold py-2.5 px-6 md:py-3 md:px-8 rounded-full text-base md:text-lg hover:bg-orange-600 transition-all transform hover:scale-105 duration-300 shadow-lg"
              >
                <span>{t('btn_explore_services')}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Brand Section */}
      <section className="py-10 md:py-16 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-lg md:text-2xl font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-8 md:mb-10">
            {t('section_brands')}
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 opacity-80 hover:opacity-100 transition-opacity">
            {MOCK_BRANDS.map((brand) => (
              <Link
                key={brand.id}
                to="/shop"
                state={{ brand: brand.name }}
                className="grayscale hover:grayscale-0 transition-all duration-300 transform hover:scale-110"
              >
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="h-8 md:h-14 w-auto object-contain"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section
        className="py-12 md:py-20 bg-white/50 dark:bg-black/20 backdrop-blur-sm animate-fade-in"
        style={{ animationDelay: '400ms' }}
      >
        <div className="container mx-auto px-3 md:px-6 text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-slate-800 dark:text-white mb-2 md:mb-4">
            {t('section_new_arrivals')}
          </h2>
          <p className="max-w-2xl mx-auto text-sm md:text-lg text-slate-600 dark:text-slate-400 mb-8 md:mb-12">
            {t('section_new_arrivals_sub')}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-10 md:mt-16">
            <Link
              to="/shop"
              className="inline-block border-2 border-orange-500 text-orange-600 dark:text-orange-400 font-bold py-2.5 px-8 md:py-3 md:px-10 rounded-full text-base md:text-lg hover:bg-orange-500 hover:text-white transition-all transform hover:scale-105 duration-300"
            >
              {t('btn_explore_shop')}
            </Link>
          </div>
        </div>
      </section>

      {/* PetBhai+ CTA */}
      <section className="py-12 md:py-20 animate-fade-in" style={{ animationDelay: '500ms' }}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="glass-card text-center p-8 md:p-20 bg-gradient-to-br from-yellow-100/50 to-orange-100/50 dark:from-yellow-900/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800/30">
            <h2 className="text-2xl md:text-5xl font-extrabold text-slate-800 dark:text-white mb-4 md:mb-6">
              {t('section_plus_title')}
            </h2>
            <p className="max-w-3xl mx-auto text-sm md:text-xl text-slate-700 dark:text-slate-200 mb-8 md:mb-10 leading-relaxed">
              {t('section_plus_desc')}
            </p>
            <Link
              to="/plus-membership"
              className="inline-block bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 px-8 md:py-4 md:px-12 rounded-full text-base md:text-lg hover:from-yellow-600 hover:to-orange-600 transition-all transform hover:scale-105 duration-300 shadow-xl"
            >
              {t('btn_join_plus')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
