const fs = require('fs');

let content = fs.readFileSync('backend/src/data/mockData.ts', 'utf8');
const lines = content.split('\n');

let fixes = 0;
let currentImagePath = null;

for (let i = 0; i < lines.length; i++) {
  // Detect image: '/blog-images/...' lines
  const imageMatch = lines[i].match(/^\s*image:\s*'([^']+)'/);
  if (imageMatch) {
    currentImagePath = imageMatch[1];
  }
  
  // Detect imageUrl: null lines
  if (lines[i].match(/^\s*imageUrl:\s*null/) && currentImagePath) {
    const indent = lines[i].match(/^(\s*)/)[1];
    lines[i] = indent + "imageUrl: '" + currentImagePath + "',";
    console.log('Fixed: ' + currentImagePath);
    fixes++;
    currentImagePath = null;
  }
  
  // Reset if we hit a new article block boundary
  if (lines[i].match(/^\s*\},?\s*$/)) {
    currentImagePath = null;
  }
}

fs.writeFileSync('backend/src/data/mockData.ts', lines.join('\n'), 'utf8');
console.log('\nTotal fixed: ' + fixes);
