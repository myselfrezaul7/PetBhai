const fs = require('fs');
const path = require('path');

const replacements = {
  'rgba(30,64,175,0.08)': 'rgba(0,0,0,0.04)',
  'rgba(30,64,175,0.12)': 'rgba(0,0,0,0.06)',
  'rgba(30,64,175,0.14)': 'rgba(0,0,0,0.08)',
  'rgba(30,64,175,0.16)': 'rgba(0,0,0,0.05)',
  'rgba(30,64,175,0.2)': 'rgba(0,0,0,0.08)',
  'rgba(30, 64, 175, 0.12)': 'rgba(0, 0, 0, 0.05)',
  'rgba(30, 64, 175, 0.18)': 'rgba(0, 0, 0, 0.08)',
  'rgba(56, 189, 248, 0.15)': 'rgba(245, 166, 35, 0.12)',
  'rgba(59, 130, 246, 0.12)': 'rgba(244, 63, 94, 0.08)',
  'bg-[linear-gradient(165deg,rgba(255,255,255,0.96),rgba(235,243,252,0.93))]': 'bg-white/95',
  'bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(233,243,255,0.93))]': 'bg-white/95',
  'bg-[linear-gradient(145deg,rgba(15,23,42,0.95),rgba(30,64,175,0.88))]': 'bg-zinc-900',
  'dark:border-amber-900/10 dark:border-amber-100/10': 'dark:border-amber-100/10',
  'dark:bg-white/95 dark:bg-zinc-900/95': 'dark:bg-zinc-900/95',
  'dark:bg-amber-50/80 dark:bg-zinc-800/80': 'dark:bg-zinc-800/80',
  'border-amber-900/10 dark:border-amber-100/10 dark:border-amber-100/10': 'border-amber-900/10 dark:border-amber-100/10'
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
      } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
        results.push(file);
      }
    });
  } catch (e) {}
  return results;
}

const files = [...walkDir('components'), ...walkDir('pages'), ...walkDir('contexts'), ...walkDir('.')];

let totalChanges = 0;

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  Object.keys(replacements).forEach(key => {
    if (content.includes(key)) {
      content = content.split(key).join(replacements[key]);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    totalChanges++;
  }
});
console.log(`Updated ${totalChanges} files to remove blue shadows/gradients.`);