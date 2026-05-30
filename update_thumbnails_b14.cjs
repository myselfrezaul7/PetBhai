const fs = require('fs');
const mockDataPath = 'backend/src/data/mockData.ts';
let content = fs.readFileSync(mockDataPath, 'utf16le');

const updates = {
  48: '/blog-images/blog-desi-cat-tail.png',
  52: '/blog-images/blog-desi-dog-ear.png',
  55: '/blog-images/blog-desi-dog-bark.png',
  62: '/blog-images/blog-desi-black-cat.png',
  63: '/blog-images/blog-desi-microchip.png'
};

let replacedCount = 0;
for (const [id, newUrl] of Object.entries(updates)) {
  const regex = new RegExp(
    `("id":\\s*\\b${id}\\b[\\s\\S]*?"imageUrl":\\s*)"([^"]*?)"`,
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
