const fs = require('fs');

const files = ['components/ArticleCard.tsx', 'components/ProductCard.tsx', 'components/PostCard.tsx', 'components/AnimalCard.tsx', 'components/VetCard.tsx'];

for (const file of files) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix duplicate loading props
    content = content.replace(/loading=['"]lazy['"]\s+decoding=['"]async['"]\s+loading="lazy"/g, 'loading="lazy"');
    content = content.replace(/loading=['"]lazy['"]\s+decoding=['"]async['"]\s+decoding="async"/g, 'decoding="async"');
    content = content.replace(/<img loading='lazy' decoding='async' (.*?)loading="lazy"(.*?)>/g, '<img $1loading="lazy"$2>');
    content = content.replace(/<img loading='lazy' decoding='async' (.*?)decoding="async"(.*?)>/g, '<img $1decoding="async"$2>');
    content = content.replace(/loading="lazy"([\s\S]*?)loading="lazy"/g, 'loading="lazy"$1');
    content = content.replace(/decoding="async"([\s\S]*?)decoding="async"/g, 'decoding="async"$1');
    
    fs.writeFileSync(file, content);
  } catch(e) {}
}
