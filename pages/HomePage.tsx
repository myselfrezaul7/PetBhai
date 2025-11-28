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
    <div className="w-full animate-fade-in">
      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-20 pb-12">
        <div className="glass-card text-center p-10 md:p-16">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-800 dark:text-white drop-shadow-lg">{t('hero_title')}</h1>
          <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto text-slate-700 dark:text-slate-200 drop-shadow-md">
            {t('hero_subtitle')}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              to="/adopt"
              className="inline-block bg-orange-500 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-orange-600 transition-all transform hover:scale-105 duration-300 shadow-lg"
            >
              {t('btn_adopt')}
            </Link>
             <Link
              to="/shop"
              className="inline-block bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-all transform hover:scale-105 duration-300 shadow-lg"
            >
              {t('btn_shop')}
            </Link>
          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4">{t('section_best_sellers')}</h2>
          <p className="max-w-3xl mx-auto text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-12">
            {t('section_best_sellers_sub')}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {bestSellers.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
      
      {/* Vet Consultation CTA -> Services CTA */}
      <section className="bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm py-20">
        <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row-reverse items-center gap-12">
                <div className="md:w-1/2">
                    <img src="https://picsum.photos/seed/services-cta/600/400" alt="Professional Pet Services" className="rounded-2xl shadow-lg" loading="lazy" />
                </div>
                <div className="md:w-1/2 text-center md:text-left">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white">{t('section_services_title')}</h2>
                    <p className="text-lg text-slate-700 dark:text-slate-300 mt-4">
                        {t('section_services_desc')}
                    </p>
                    <Link
                      to="/services"
                      className="mt-8 inline-flex items-center space-x-3 bg-orange-500 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-orange-600 transition-all transform hover:scale-105 duration-300 shadow-lg"
                    >
                      <span>{t('btn_explore_services')}</span>
                    </Link>
                </div>
            </div>
        </div>
      </section>
      
      {/* Shop by Brand Section */}
      <section className="py-20">
          <div className="container mx-auto px-6 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-12">{t('section_brands')}</h2>
              <div className="flex flex-wrap justify-center items-center gap-8">
                  {MOCK_BRANDS.map(brand => (
                      <Link key={brand.id} to="/shop" state={{ brand: brand.name }} className="grayscale hover:grayscale-0 transition-all duration-300 transform hover:scale-110">
                          <img src={brand.logoUrl} alt={brand.name} className="h-12" />
                      </Link>
                  ))}
              </div>
          </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-20 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4">{t('section_new_arrivals')}</h2>
          <p className="max-w-3xl mx-auto text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-12">
            {t('section_new_arrivals_sub')}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {newArrivals.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Link
            to="/shop"
            className="mt-12 inline-block bg-orange-500 text-white font-bold py-3 px-10 rounded-full text-lg hover:bg-orange-600 transition-all transform hover:scale-105 duration-300 shadow-lg"
          >
            {t('btn_explore_shop')}
          </Link>
        </div>
      </section>

      {/* PetBhai+ CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="glass-card text-center p-10 md:p-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white drop-shadow-lg">{t('section_plus_title')}</h2>
            <p className="max-w-3xl mx-auto text-lg mt-4 text-slate-700 dark:text-slate-200 drop-shadow-md">
              {t('section_plus_desc')}
            </p>
            <Link
              to="/plus-membership"
              className="mt-8 inline-block bg-orange-500 text-white font-bold py-3 px-10 rounded-full text-lg hover:bg-orange-600 transition-all transform hover:scale-105 duration-300 shadow-xl"
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
