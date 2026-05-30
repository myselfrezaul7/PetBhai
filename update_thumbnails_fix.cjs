const fs = require('fs');
const mockDataPath = 'backend/src/data/mockData.ts';
let content = fs.readFileSync(mockDataPath, 'utf16le');

const updates = {
  1010: '/blog-images/blog-rescue-quarantine.png',
  1011: '/blog-images/blog-choking-firstaid.png',
  1012: '/blog-images/blog-home-poisoning.png',
  1013: '/blog-images/blog-urine-blockage.png',
  1014: '/blog-images/blog-heartworm-prevention.png',
  1015: '/blog-images/blog-seizure-care.png',
  1016: '/blog-images/blog-pet-diabetes.png',
  1018: '/blog-images/blog-parvovirus.png',
  1019: '/blog-images/blog-cat-flu.png',
  45: '/blog-images/blog-desi-eye-care.png',
  67: '/blog-images/blog-desi-dog-stairs.png',
  1006: '/blog-images/blog-desi-puppy-training.png'
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
