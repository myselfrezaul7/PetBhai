const fs = require('fs');

// 1. Fix Header.tsx
let headerContent = fs.readFileSync('components/Header.tsx', 'utf8');

// Fix MobileNavLink classes
headerContent = headerContent.replace(
  /: 'bg-white[^`]+'/g,
  `:` + `'bg-white/60 dark:bg-zinc-900/60 text-zinc-900 dark:text-zinc-50 border-amber-900/10 dark:border-white/10 hover:bg-amber-50/80 dark:hover:bg-zinc-800/80 backdrop-blur-xl'`
);

// Fix Top Nav Header
headerContent = headerContent.replace(
  /bg-white\/95 dark:bg-zinc-900\/95 backdrop-blur-md border border-amber-900\/10 dark:border-amber-100\/10/g,
  'bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-sm'
);

fs.writeFileSync('components/Header.tsx', headerContent);

// 2. Fix BottomNav.tsx
let bottomNavContent = fs.readFileSync('components/BottomNav.tsx', 'utf8');

bottomNavContent = bottomNavContent.replace(
  /rounded-\[1\.85rem\] border border-amber-900\/10 dark:border-amber-100\/10 bg-white\/95 dark:bg-zinc-900\/95 px-2 py-2\.5 shadow-\[0_18px_46px_rgba\(0,0,0,0\.12\)\] backdrop-blur-glass dark:border-amber-100\/10 dark:bg-zinc-900\/95 md:hidden/g,
  'rounded-full border border-white/20 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 px-2 py-1.5 shadow-lg backdrop-blur-xl md:hidden'
);

// Slimmer bottom nav links
bottomNavContent = bottomNavContent.replace(
  /min-h-\[56px\] flex-col items-center justify-center rounded-2xl px-1 py-1\.5/g,
  'min-h-[48px] flex-col items-center justify-center rounded-full px-1 py-1'
);

fs.writeFileSync('components/BottomNav.tsx', bottomNavContent);

// 3. Fix HomePage.tsx (Remove Explore Now)
let homePageContent = fs.readFileSync('pages/HomePage.tsx', 'utf8');

homePageContent = homePageContent.replace(
  /<Link[\s\S]*?to="\/shop"[\s\S]*?Explore Now\s*<\/Link>/g,
  ''
);

fs.writeFileSync('pages/HomePage.tsx', homePageContent);

console.log('All changes applied!');
