import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../contexts/ProductContext';
import { useLanguage } from '../contexts/LanguageContext';
import ApiStateCard from '../components/ApiStateCard';

const HomePage: React.FC = () => {
  const { products, loading, error, refetch } = useProducts();
  const { t } = useLanguage();

  const bestSellers = useMemo(
    () => [...products].sort((a, b) => b.rating - a.rating).slice(0, 6),
    [products]
  );

  const newArrivals = useMemo(
    () => [...products].sort((a, b) => b.id - a.id).slice(0, 5),
    [products]
  );

  return (
    <main className="w-full pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-12 space-y-6 md:space-y-10 pt-2">
      
      {/* 1. Unified Hero Section */}
      <section className="container mx-auto px-4 md:px-6" aria-label="Hero banner">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative w-full aspect-[4/4.5] sm:aspect-[21/9] overflow-hidden rounded-[2rem] shadow-sm dark:shadow-black/20"
        >
          <img
            src="/landing-hero-mobile.webp"
            alt="A loving home for every animal"
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
          
          {/* Text Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 flex flex-col justify-end">
            <h1 className="text-[2.25rem] sm:text-5xl font-bold leading-[1.05] tracking-tight text-white mb-2">
              A Loving Home <br/>For Every Animal
            </h1>
            <p className="text-[15px] sm:text-lg text-zinc-200/90 max-w-sm">
              Discover premium care, organic food, and adoption centers near you.
            </p>
          </div>
        </motion.div>
      </section>

      {/* 2. Bento Grid Quick Actions */}
      <section className="container mx-auto px-4 md:px-6" aria-label="Quick actions">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[1.35rem] sm:text-2xl font-bold leading-none text-zinc-900 dark:text-zinc-50">Explore</h2>
        </div>
        
        <div className="grid grid-cols-2 grid-rows-2 gap-3 sm:grid-cols-3 sm:grid-rows-1">
          {/* Main Block: Shop */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="col-span-1 row-span-2 sm:col-span-1 sm:row-span-1"
          >
            <Link
              to="/shop"
              className="relative flex flex-col h-full min-h-[170px] overflow-hidden rounded-[1.5rem] border border-amber-500/20 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-zinc-800 dark:to-zinc-900 p-5 shadow-sm transition-transform active:scale-[0.98]"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 mb-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 2.75A1.75 1.75 0 0 0 4.25 4.5V7H3a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1h-1.25V4.5A1.75 1.75 0 0 0 18 2.75H6zm.25 4.25V4.75h11.5V7H6.25z" />
                </svg>
              </div>
              <div className="mt-4 relative z-10">
                <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Shop</h3>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-snug">Premium supplies <br/>for your pet</p>
              </div>
              {/* Decorative graphic */}
              <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-amber-500/10 blur-xl"></div>
            </Link>
          </motion.div>

          {/* Secondary Block 1: Services */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="col-span-1 row-span-1"
          >
            <Link
              to="/services"
              className="flex h-full flex-col justify-between rounded-[1.5rem] border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm transition-transform active:scale-[0.98]"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 8h-1V6a1 1 0 0 0-1-1h-2V4a1 1 0 1 0-2 0v1h-2V4a1 1 0 1 0-2 0v1H7a1 1 0 0 0-1 1v2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zm-7 9a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
                </svg>
              </div>
              <div className="mt-2">
                <h3 className="text-[1.05rem] font-bold text-zinc-900 dark:text-zinc-50">Services</h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Vets & Grooming</p>
              </div>
            </Link>
          </motion.div>

          {/* Secondary Block 2: Adoption */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="col-span-1 row-span-1"
          >
            <Link
              to="/adopt"
              className="flex h-full flex-col justify-between rounded-[1.5rem] border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm transition-transform active:scale-[0.98]"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <div className="mt-2">
                <h3 className="text-[1.05rem] font-bold text-zinc-900 dark:text-zinc-50">Adoption</h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Find a friend</p>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 3. Horizontal Swiping Best Sellers */}
      <section className="container mx-auto px-4 md:px-6" aria-labelledby="best-sellers-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="best-sellers-heading" className="text-[1.35rem] sm:text-2xl font-bold leading-none text-zinc-900 dark:text-zinc-50">
            {t('section_best_sellers')}
          </h2>
          <Link to="/shop" className="text-sm font-semibold text-amber-600 dark:text-amber-500">
            See all
          </Link>
        </div>

        {loading ? (
          <div className="rounded-[1.5rem] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-6 text-center text-zinc-500 dark:text-zinc-400 text-sm">
            Loading products...
          </div>
        ) : error ? (
          <ApiStateCard
            title="Products unavailable"
            message={error}
            actionLabel="Try Again"
            onAction={refetch}
          />
        ) : (
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-3 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] items-stretch">
              {bestSellers.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: 15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="w-[150px] sm:w-[200px] flex-none snap-start"
                >
                  <ProductCard product={product} variant="mobile-featured" />
                </motion.div>
              ))}
              {/* Spacer at the end for consistent padding when scrolled fully */}
              <div className="w-1 flex-none sm:hidden"></div>
            </div>
          </div>
        )}
      </section>

      {/* 4. New Arrivals (compact list list) */}
      <section className="container mx-auto px-4 md:px-6" aria-labelledby="new-arrivals-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="new-arrivals-heading" className="text-[1.35rem] sm:text-2xl font-bold leading-none text-zinc-900 dark:text-zinc-50">
            {t('section_new_arrivals')}
          </h2>
        </div>

        {error ? (
          <ApiStateCard
            title="New arrivals unavailable"
            message={error}
            actionLabel="Reload"
            onAction={refetch}
          />
        ) : (
          <div className="space-y-3">
            {newArrivals.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <ProductCard product={product} variant="mobile-list" />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default HomePage;
