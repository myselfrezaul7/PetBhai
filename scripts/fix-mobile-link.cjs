const fs = require('fs');

let c = fs.readFileSync('components/Header.tsx', 'utf8');

c = c.replace(
  /:'bg-white\/60 dark:bg-zinc-900\/60 text-zinc-900 dark:text-zinc-50 border-amber-900\/10 dark:border-white\/10 hover:bg-amber-50\/80 dark:hover:bg-zinc-800\/80 backdrop-blur-xl'}/g,
  `:'bg-white/60 dark:bg-zinc-900/60 text-zinc-900 dark:text-zinc-50 border-amber-900/10 dark:border-white/10 hover:bg-amber-50/80 dark:hover:bg-zinc-800/80 backdrop-blur-xl'\n        } \$\{className || ''\}`
);

fs.writeFileSync('components/Header.tsx', c);
