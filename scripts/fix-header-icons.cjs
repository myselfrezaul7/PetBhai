const fs = require('fs');

const file = 'components/Header.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /className="[^"]*?min-[hw]-\[44px\][^"]*?"/g,
  (match) => {
    if (match.includes('rounded-full')) return match;
    if (match.includes('text-slate-600') || match.includes('text-slate-500')) return match;
    
    // Clean string for header buttons
    return `className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-amber-50/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-400 transition-colors touch-manipulation active:scale-95 border border-amber-900/10 dark:border-zinc-700/50"`;
  }
);

fs.writeFileSync(file, content);
console.log('Fixed Header buttons');
