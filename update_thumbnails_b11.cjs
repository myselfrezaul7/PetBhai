const fs = require('fs');
const mockDataPath = 'backend/src/data/mockData.ts';
let content = fs.readFileSync(mockDataPath, 'utf16le');

const updates = {
  101: '/blog-images/blog-dog-tick-flea.png',
  202: '/blog-images/blog-dog-rabies.png',
  203: '/blog-images/blog-feeding-stray.png',
  204: '/blog-images/blog-spay-neuter-stray.png',
  205: '/blog-images/blog-animal-cruelty-law.png',
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
