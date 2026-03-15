import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PawIcon, HeartIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';

const DhakaHero: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="relative w-full overflow-hidden px-1 py-3 md:py-6">
      <div className="glass-card-premium relative mx-auto w-full max-w-5xl rounded-[28px] px-5 py-8 text-center md:px-10 md:py-14">
        <motion.div
          className="mx-auto flex w-fit items-center gap-2 glass-pill px-4 py-2"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
            Pet Care x Commerce
          </span>
        </motion.div>

        <motion.div
          className="relative mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100/60 dark:bg-orange-500/15 md:h-20 md:w-20"
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.05 }}
        >
          <HeartIcon className="absolute h-full w-full scale-150 text-orange-200/50 dark:text-orange-500/10" />
          <PawIcon className="z-10 h-8 w-8 text-orange-500 md:h-10 md:w-10" />
        </motion.div>

        <motion.h1
          className="mt-5 text-4xl font-black tracking-tight text-slate-900 dark:text-zinc-100 md:text-6xl"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          {t('hero_title')}
        </motion.h1>

        <motion.p
          className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 dark:text-zinc-400 md:text-lg"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.15 }}
        >
          Shop essentials, book vet help, and adopt responsibly in one place.
        </motion.p>

        <motion.div
          className="mt-6 flex w-full flex-col gap-3 sm:mx-auto sm:w-auto sm:flex-row"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.2 }}
        >
          <Link
            to="/shop"
            className="min-h-[44px] w-full rounded-full bg-orange-500 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600 active:scale-95 sm:w-auto"
          >
            {t('btn_shop')}
          </Link>
          <Link
            to="/services"
            className="glass-pill min-h-[44px] w-full px-8 py-3 text-sm font-bold text-slate-700 transition-colors hover:text-orange-600 active:scale-95 dark:text-zinc-300 dark:hover:text-orange-400 sm:w-auto"
          >
            Book Services
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default DhakaHero;
