const fs = require('fs');

const bgStr = fs.readFileSync('pages/HomePage.tsx', 'utf8');

const regex = /<motion\.div\s+initial=\{\{ opacity: 0[\s\S]*?<\/motion\.div>/;

const newBlock = `<motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="flex flex-col gap-4"
        >
          {/* Text Content First (Explore Now Section) */}
          <div className="w-full rounded-[2.1rem] border border-amber-900/10 dark:border-amber-100/10 bg-white/95 dark:bg-zinc-900/95 p-6 md:p-8 shadow-[0_14px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_14px_30px_rgba(0,0,0,0.3)] backdrop-blur-md">
            <h1 className="text-[2rem] font-bold leading-[1.08] tracking-tight text-zinc-900 dark:text-zinc-50 md:text-5xl">
              A Loving Home For Every Animal
            </h1>
            <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
              Discover premium care, organic food, and adoption centers near you.
            </p>
            <Link
              to="/shop"
              className="mt-6 inline-flex min-h-[48px] w-full max-w-[16rem] items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 text-[1.1rem] font-bold text-white shadow-lg shadow-amber-900/30 transition-all duration-300 hover:scale-[1.02] active:scale-95"
            >
              Explore Now
            </Link>
          </div>

          {/* Hero Image Section After text */}
          <div className="relative w-full aspect-[4/3] sm:aspect-[21/9] overflow-hidden rounded-[2.1rem] border border-amber-900/10 dark:border-amber-100/10 shadow-[0_22px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_22px_40px_rgba(0,0,0,0.5)]">
            <img
              src="/landing-hero-mobile.webp"
              alt="A loving home for every animal"
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
              decoding="async"
            />
            {/* Soft overlay gradient to ensure image looks rich in dark mode but no longer covered by text */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/10 via-transparent to-transparent dark:from-black/40 dark:via-black/10" />
          </div>
        </motion.div>`;

const replaced = bgStr.replace(regex, newBlock);
fs.writeFileSync('pages/HomePage.tsx', replaced);
