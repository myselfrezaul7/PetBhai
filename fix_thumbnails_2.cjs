const fs = require('fs');

let content = fs.readFileSync('backend/src/data/mockData.ts', 'utf8');
const lines = content.split('\n');

let fixes = 0;

for (let i = 0; i < lines.length; i++) {
  // Find lines like:    image: '/blog-images/...',
  const imageMatch = lines[i].match(/^(\s*)image:\s*'([^']+)',?\s*$/);
  if (imageMatch) {
    const indent = imageMatch[1];
    const imagePath = imageMatch[2];
    
    // Check if any subsequent line (before the next `}`) already has imageUrl
    let hasImageUrl = false;
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].match(/^\s*\}/)) break;
      if (lines[j].match(/^\s*imageUrl:/)) {
        hasImageUrl = true;
        break;
      }
    }
    
    if (!hasImageUrl) {
      // Find the author: line (that comes after content:) and insert imageUrl before it
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].match(/^\s*author:/)) {
          // Insert imageUrl line before author
          const authorIndent = lines[j].match(/^(\s*)/)[1];
          lines.splice(j, 0, authorIndent + "imageUrl: '" + imagePath + "',");
          console.log('Fixed [' + imagePath + '] - inserted before author at line ' + (j + 1));
          fixes++;
          break;
        }
        if (lines[j].match(/^\s*\}/)) break;
      }
    }
  }
}

fs.writeFileSync('backend/src/data/mockData.ts', lines.join('\n'), 'utf8');
console.log('\nTotal fixed: ' + fixes);
