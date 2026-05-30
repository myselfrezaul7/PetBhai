const fs = require('fs');
const path = require('path');
const mockDataPath = path.join(__dirname, 'backend', 'src', 'data', 'mockData.ts');
let content = fs.readFileSync(mockDataPath, 'utf16le');

const updates = [
  { id: 108, imageUrl: '/blog-images/blog-nail-clipping.png' },
  { id: 208, imageUrl: '/blog-images/blog-flat-cat.png' },
  { id: 209, imageUrl: '/blog-images/blog-street-water.png' },
  { id: 210, imageUrl: '/blog-images/blog-found-kitten.png' },
  { id: 211, imageUrl: '/blog-images/blog-cat-lice.png' },
];

for (const u of updates) {
  const idMarker = `'id': ${u.id},`;
  const idIdx = content.indexOf(idMarker);
  if (idIdx === -1) { 
    console.error(`ID ${u.id} not found`); 
    continue; 
  }
  
  const imageUrlStart = content.indexOf("'imageUrl':", idIdx);
  if (imageUrlStart === -1) {
    console.error(`imageUrl not found for ID ${u.id}`);
    continue;
  }
  
  const nextLineEnd = content.indexOf('\n', imageUrlStart);
  
  content = content.substring(0, imageUrlStart) + 
    `'imageUrl': '${u.imageUrl}',` + 
    content.substring(nextLineEnd);
}

fs.writeFileSync(mockDataPath, content, 'utf16le');
console.log('Updated batch 8 thumbnails');
