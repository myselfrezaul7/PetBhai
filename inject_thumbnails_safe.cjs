const fs = require('fs');
const mockData = require('./backend/dist/data/mockData.js');

const articles = mockData.MOCK_ARTICLES || [];
const imagesDir = 'public/blog-images/';
const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));

let dogPool = files.filter(f => f.toLowerCase().includes('dog') || f.toLowerCase().includes('puppy') || f.toLowerCase().includes('desi') && !f.toLowerCase().includes('cat'));
let catPool = files.filter(f => f.toLowerCase().includes('cat') || f.toLowerCase().includes('kitten'));
let genericPool = files.filter(f => !dogPool.includes(f) && !catPool.includes(f));

function getCatImage() {
  if (catPool.length > 0) return catPool.pop();
  if (genericPool.length > 0) return genericPool.pop();
  return dogPool.pop();
}

function getDogImage() {
  if (dogPool.length > 0) return dogPool.pop();
  if (genericPool.length > 0) return genericPool.pop();
  return catPool.pop();
}

function getGenericImage() {
  if (genericPool.length > 0) return genericPool.pop();
  if (dogPool.length > 0) return dogPool.pop();
  return catPool.pop();
}

let content = fs.readFileSync('backend/src/data/mockData.ts', 'utf8');
let replaceCount = 0;

for (const a of articles) {
  const isCat = a.title.includes('বিড়াল') || a.title.includes('ক্যাট');
  const isDog = a.title.includes('কুকুর') || a.title.includes('ডগ');
  
  let selectedImage = '';
  if (isCat) selectedImage = getCatImage();
  else if (isDog) selectedImage = getDogImage();
  else selectedImage = getGenericImage();
  
  const searchId = `id: ${a.id},`;
  const idIndex = content.indexOf(searchId);
  if (idIndex === -1) {
    console.log(`Could not find id ${a.id}`);
    continue;
  }
  
  const endOfIdLine = idIndex + searchId.length;
  const prefix = content.substring(0, endOfIdLine);
  const suffix = content.substring(endOfIdLine);
  
  const injection = `\n    image: '/blog-images/${selectedImage}',`;
  content = prefix + injection + suffix;
  replaceCount++;
}

fs.writeFileSync('backend/src/data/mockData.ts', content, 'utf8');
console.log(`Successfully injected ${replaceCount} images.`);
