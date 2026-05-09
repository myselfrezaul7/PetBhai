const fs = require('fs');
const mockDataPath = 'backend/src/data/mockData.ts';
let content = fs.readFileSync(mockDataPath, 'utf16le');

const updates = {
  1007: '/blog-images/blog-vaccine-calendar.png',
  1008: '/blog-images/blog-diet-transition.png',
  1009: '/blog-images/blog-separation-anxiety.png',
  1010: '/blog-images/blog-rescue-quarantine.png',
  1011: '/blog-images/blog-choking-firstaid.png',
  1012: '/blog-images/blog-home-poisoning.png',
  1013: '/blog-images/blog-urine-blockage.png',
  1014: '/blog-images/blog-heartworm-prevention.png',
  1015: '/blog-images/blog-seizure-care.png',
  1016: '/blog-images/blog-pet-diabetes.png',
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
