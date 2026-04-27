const fs = require('fs');
const path = require('path');
const mockDataPath = path.join(__dirname, 'backend', 'src', 'data', 'mockData.ts');
let content = fs.readFileSync(mockDataPath, 'utf16le');

const updates = [
  { id: 107, imageUrl: '/blog-images/blog-puppy-ear-clean.png' },
  { id: 204, imageUrl: '/blog-images/blog-spay-neuter.png' },
  { id: 205, imageUrl: '/blog-images/blog-animal-cruelty.png' },
  { id: 206, imageUrl: '/blog-images/blog-tnr-program.png' },
  { id: 207, imageUrl: '/blog-images/blog-dog-bite-firstaid.png' },
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
console.log('Updated batch 7 thumbnails');
