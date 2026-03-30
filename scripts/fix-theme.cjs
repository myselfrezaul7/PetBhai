const fs = require('fs');
const path = require('path');

const replacements = {
  'text-kw-text-main': 'text-zinc-900 dark:text-zinc-50',
  'text-kw-text-muted': 'text-zinc-500 dark:text-zinc-400',
  'text-kw-primary': 'text-amber-600 dark:text-amber-500',
  'bg-kw-primary/10': 'bg-amber-500/10 dark:bg-amber-500/10',
  'bg-kw-primary/20': 'bg-amber-500/20 dark:bg-amber-500/20',
  'bg-kw-primary/90': 'bg-amber-500/90 dark:bg-amber-600/90',
  'bg-kw-primary': 'bg-amber-500 dark:bg-amber-600',
  'hover:bg-kw-primary-hover': 'hover:bg-amber-600 dark:hover:bg-amber-500',
  'bg-kw-bg-surface-hover': 'bg-amber-50/80 dark:bg-zinc-800/80',
  'bg-kw-bg-surface': 'bg-white/95 dark:bg-zinc-900/95',
  'bg-kw-bg-page': 'bg-[#fdfbf7] dark:bg-zinc-950',
  'border-kw-border/50': 'border-amber-900/5 dark:border-amber-100/5',
  'border-kw-border': 'border-amber-900/10 dark:border-amber-100/10',
  'ring-kw-primary': 'ring-amber-500 dark:ring-amber-400',
  'ring-kw-border': 'ring-amber-200 dark:ring-zinc-700',
  'focus:ring-kw-primary': 'focus:ring-amber-500',
  'from-kw-primary': 'from-amber-500',
  'to-kw-primary-hover': 'to-amber-600'
};

function walkDir(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      file = path.join(dir, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory()) {
        results = results.concat(walkDir(file));
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    });
  } catch (e) {
    // Ignore missing dirs
  }
  return results;
}

const files = [...walkDir('components'), ...walkDir('pages'), ...walkDir('contexts')];

let totalChanges = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  Object.keys(replacements).forEach(key => {
    if (content.includes(key)) {
      content = content.split(key).join(replacements[key]);
      changed = true;
    }
  });

  if (changed) {
    // Basic cleanup just in case
    content = content.replace(/dark:dark:/g, 'dark:');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
    totalChanges++;
  }
});
console.log(`Updated ${totalChanges} files.`);