const fs = require('fs');
const mockData = require('./backend/dist/data/mockData.js');

const articles = mockData.MOCK_ARTICLES || [];
const imagesDir = 'public/blog-images/';
const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));

// Build Pools
let dogPool = files.filter(f => f.toLowerCase().includes('dog') || f.toLowerCase().includes('puppy') || f.toLowerCase().includes('desi') && !f.toLowerCase().includes('cat'));
let catPool = files.filter(f => f.toLowerCase().includes('cat') || f.toLowerCase().includes('kitten'));
let genericPool = files.filter(f => !dogPool.includes(f) && !catPool.includes(f));

// Fallback logic
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
  
  if (!selectedImage) {
    console.error('Ran out of images!');
    process.exit(1);
  }

  // Find the exact title line
  // The line usually looks like: title: '...',
  // But could be title: "..."
  // We find id: a.id,
  const searchId = `id: ${a.id},`;
  const idIndex = content.indexOf(searchId);
  if (idIndex === -1) {
    console.log(`Could not find id ${a.id} in source file.`);
    continue;
  }
  
  const titleStart = content.indexOf('title:', idIndex);
  const titleEnd = content.indexOf(',', titleStart);
  
  if (titleStart === -1 || titleEnd === -1) {
     console.log(`Could not find title for id ${a.id}`);
     continue;
  }
  
  const prefix = content.substring(0, titleEnd + 1);
  const suffix = content.substring(titleEnd + 1);
  
  const injection = `\n    image: '/blog-images/${selectedImage}',`;
  content = prefix + injection + suffix;
  replaceCount++;
}

fs.writeFileSync('backend/src/data/mockData.ts', content, 'utf8');
console.log(`Successfully injected ${replaceCount} images.`);
