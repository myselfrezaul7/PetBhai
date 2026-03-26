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
    <main className="w-full pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-12">
      <section className="container mx-auto px-4 pb-6 pt-4 md:px-6 md:pb-10 md:pt-8" aria-label="Hero banner">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-[2.1rem] border border-white/60 p-4 shadow-[0_22px_40px_rgba(30,64,175,0.16)] md:p-8"
        >
          <img
            src="/landing-hero-mobile.webp"
            alt="A loving home for every animal"
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0c1633]/72 via-[#0c1633]/36 to-transparent" />
          <div className="relative z-10 flex min-h-[15.5rem] items-end sm:min-h-[17rem]">
            <div className="w-full max-w-[17.5rem] rounded-[1.6rem] border border-white/25 bg-white/12 p-5 text-white backdrop-blur-md">
              <h1 className="text-[1.8rem] font-bold leading-[1.08] tracking-tight sm:text-[2rem] md:text-5xl">
                A Loving Home For Every Animal
              </h1>
              <p className="mt-3 text-base text-white/78">
                Discover premium care, organic food, and adoption centers near you.
              </p>
              <Link
                to="/shop"
                className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-blue-400 px-4 text-xl font-semibold text-white shadow-lg shadow-blue-900/30 transition-all duration-300 hover:scale-[1.02] active:scale-95"
              >
                Explore Now
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="container mx-auto px-4 pb-6 md:px-6 md:pb-8" aria-label="Quick actions">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[1.55rem] font-bold leading-none text-slate-900">Quick Actions</h2>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Top Picks</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.04 }}
            className="w-full"
          >
          <Link
            to="/shop"
            className="block min-h-[126px] rounded-[1.75rem] border border-white/80 bg-white/72 p-4 shadow-[0_10px_26px_rgba(30,64,175,0.08)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(30,64,175,0.14)]"
          >
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 2.75A1.75 1.75 0 0 0 4.25 4.5V7H3a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1h-1.25V4.5A1.75 1.75 0 0 0 18 2.75H6zm.25 4.25V4.75h11.5V7H6.25z" />
              </svg>
            </div>
            <h3 className="text-[2rem] font-semibold leading-none text-slate-900">Shop</h3>
            <p className="mt-2 text-sm text-slate-500">Premium pet supplies</p>
          </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="w-full"
          >
          <Link
            to="/services"
            className="block min-h-[126px] rounded-[1.75rem] border border-white/80 bg-white/72 p-4 shadow-[0_10px_26px_rgba(30,64,175,0.08)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(30,64,175,0.14)]"
          >
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 8h-1V6a1 1 0 0 0-1-1h-2V4a1 1 0 1 0-2 0v1h-2V4a1 1 0 1 0-2 0v1H7a1 1 0 0 0-1 1v2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zm-7 9a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
              </svg>
            </div>
            <h3 className="text-[2rem] font-semibold leading-none text-slate-900">Services</h3>
            <p className="mt-2 text-sm text-slate-500">Vets and grooming</p>
          </Link>
          </motion.div>

          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
          <Link
            to="/adopt"
            className="relative block min-h-[126px] overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/72 p-4 shadow-[0_10px_26px_rgba(30,64,175,0.08)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(30,64,175,0.14)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              className="absolute -right-2 bottom-1 h-24 w-24 text-slate-200"
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="24" cy="20" r="8" />
              <circle cx="44" cy="12" r="8" />
              <circle cx="62" cy="20" r="8" />
              <circle cx="78" cy="30" r="8" />
              <path d="M44 38c-11 0-24 11-24 25 0 10 7 16 16 16 8 0 13-4 18-4s10 4 18 4c9 0 16-6 16-16 0-15-15-25-26-25-5 0-9 2-12 5-3-3-7-5-12-5z" />
            </svg>
            <h3 className="text-[2rem] font-semibold leading-none text-slate-900">Adoption</h3>
            <p className="mt-2 max-w-xs text-sm text-slate-500">Find your new best friend today.</p>
            <span className="mt-4 inline-flex items-center gap-2 text-xl font-semibold text-blue-700">
              View Pets
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </Link>
          </motion.div>
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="container mx-auto px-4 pb-8 md:px-6 md:pb-10"
        aria-labelledby="best-sellers-heading"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id="best-sellers-heading" className="text-[1.75rem] font-bold leading-none text-slate-900 sm:text-[2rem]">
            {t('section_best_sellers')}
          </h2>
          <Link to="/shop" className="text-base font-semibold text-blue-700">
            See all
          </Link>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/80 bg-white/75 p-6 text-center text-slate-500">
            Loading products...
          </div>
        ) : error ? (
          <ApiStateCard
            title="Products are unavailable right now"
            message={error}
            actionLabel="Try Again"
            onAction={refetch}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {bestSellers.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.45, delay: 0.04 }}
                className="w-full"
              >
                <ProductCard product={product} variant="mobile-featured" />
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="container mx-auto px-4 pb-2 md:px-6"
        aria-labelledby="new-arrivals-heading"
      >
        <h2 id="new-arrivals-heading" className="mb-4 text-[1.75rem] font-bold leading-none text-slate-900 sm:text-[2rem]">
          {t('section_new_arrivals')}
        </h2>

        {error ? (
          <ApiStateCard
            title="New arrivals could not be loaded"
            message={error}
            actionLabel="Reload Products"
            onAction={refetch}
          />
        ) : (
          <div className="space-y-3">
            {newArrivals.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.42, delay: index * 0.05 }}
              >
                <ProductCard product={product} variant="mobile-list" />
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>
    </main>
  );
};

export default HomePage;
