const fs = require('fs');

let headerContent = fs.readFileSync('components/Header.tsx', 'utf8');

// Fix Mobile Menu Drawer Background
headerContent = headerContent.replace(
  /bg-white\/95([\s\S]*?)backdrop-blur-glass([\s\S]*?)dark:bg-\[linear-gradient[^\]]+\]/g,
  'bg-white/80$1backdrop-blur-2xl$2dark:bg-zinc-900/80'
);
fs.writeFileSync('components/Header.tsx', headerContent);

// Fix BottomNav duplicate hover classes
let bottomContent = fs.readFileSync('components/BottomNav.tsx', 'utf8');
bottomContent = bottomContent.replace(
  /text-zinc-500 dark:text-zinc-400 hover:bg-amber-50\/80 dark:bg-zinc-800\/80 hover:text-zinc-900 dark:text-zinc-50 dark:text-zinc-500 dark:text-zinc-400 dark:hover:bg-amber-50\/80 dark:bg-zinc-800\/80 dark:hover:text-zinc-900 dark:text-zinc-50/g,
  'text-zinc-500 dark:text-zinc-400 hover:bg-amber-50/80 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-50'
);
fs.writeFileSync('components/BottomNav.tsx', bottomContent);
