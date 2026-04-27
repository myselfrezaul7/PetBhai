const fs = require('fs');
const path = require('path');
const mockDataPath = path.join(__dirname, 'backend', 'src', 'data', 'mockData.ts');
let content = fs.readFileSync(mockDataPath, 'utf16le');

const updates = [
  { id: 212, imageUrl: '/blog-images/blog-mother-dog-puppies.png' },
  { id: 213, imageUrl: '/blog-images/blog-mother-cat-kittens.png' },
  { id: 106, imageUrl: '/blog-images/blog-winter-dog-bath.png' },
  { id: 202, imageUrl: '/blog-images/blog-dog-vaccine.png' },
  { id: 203, imageUrl: '/blog-images/blog-feeding-stray-cats.png' },
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
console.log('Updated batch 6 thumbnails');
