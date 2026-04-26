const fs = require('fs');
const path = require('path');
const mockDataPath = path.join(__dirname, 'backend', 'src', 'data', 'mockData.ts');
let content = fs.readFileSync(mockDataPath, 'utf16le');

const updates = [
  { id: 45, imageUrl: '/blog-images/blog-eye-care.png' },
  { id: 48, imageUrl: '/blog-images/blog-cat-tail.png' },
  { id: 52, imageUrl: '/blog-images/blog-dog-ear.png' },
  { id: 55, imageUrl: '/blog-images/blog-dog-bark.png' },
  { id: 62, imageUrl: '/blog-images/blog-black-cat.png' },
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
console.log('Updated thumbnails');
