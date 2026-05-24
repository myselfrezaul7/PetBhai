const fs = require('fs');
const mockDataPath = 'backend/src/data/mockData.ts';
let content = fs.readFileSync(mockDataPath, 'utf16le');

const updates = {
  211: '/blog-images/blog-cat-lice-firstaid.png',
  212: '/blog-images/blog-newborn-puppy-care.png',
  213: '/blog-images/blog-motherless-kitten.png',
  1020: '/blog-images/blog-toxic-pet-foods.png',
  1021: '/blog-images/blog-pet-bleeding-firstaid.png',
};

let replacedCount = 0;
for (const [id, newUrl] of Object.entries(updates)) {
  const regex = new RegExp(
    `("id":\\s*${id}[\\s\\S]*?"imageUrl":\\s*)"([^"]*?)"`,
    'g'
  );
  if (regex.test(content)) {
    content = content.replace(regex, `$1"${newUrl}"`);
    replacedCount++;
  } else {
    console.error(`Could not find imageUrl for ID ${id}`);
  }
}

fs.writeFileSync(mockDataPath, content, 'utf16le');
console.log(`Successfully updated ${replacedCount} imageUrl entries in mockData.ts`);
