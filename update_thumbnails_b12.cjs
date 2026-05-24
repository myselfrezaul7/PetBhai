const fs = require('fs');
const mockDataPath = 'backend/src/data/mockData.ts';
let content = fs.readFileSync(mockDataPath, 'utf16le');

const updates = {
  206: '/blog-images/blog-tnr-effective.png',
  207: '/blog-images/blog-child-dog-safety.png',
  208: '/blog-images/blog-apartment-cat-care.png',
  209: '/blog-images/blog-summer-water-stray.png',
  210: '/blog-images/blog-rescued-kitten-care.png',
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
