const fs = require('fs');
const path = require('path');
const mockDataPath = path.join(__dirname, 'backend', 'src', 'data', 'mockData.ts');
let content = fs.readFileSync(mockDataPath, 'utf16le');

const updates = [
  { id: 1005, imageUrl: '/blog-images/blog-desi-dog.png' },
  { id: 1006, imageUrl: '/blog-images/blog-puppy-training.png' }
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
console.log('Updated 2 thumbnails from batch 4');
