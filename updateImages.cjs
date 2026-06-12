const fs = require('fs');

let content = fs.readFileSync('backend/src/data/mockData.ts', 'utf8');

const images = [
  'thumb_desi_1_1781279921508.png',
  'thumb_desi_2_1781279933774.png',
  'thumb_desi_3_1781279945488.png',
  'thumb_desi_4_1781279957172.png',
  'thumb_desi_5_1781279974405.png',
  'thumb_desi_6_1781279985360.png',
  'thumb_desi_7_1781279995818.png',
  'thumb_desi_8_1781280007231.png',
  'thumb_desi_9_1781280025037.png',
  'thumb_desi_10_1781280035220.png',
  'thumb_desi_11_1781280047281.png',
  'thumb_desi_12_1781280056007.png',
  'thumb_desi_13_1781280073610.png'
].map(name => `/blog-images/${name}`);

const articlesStart = content.indexOf('export const MOCK_ARTICLES');
if (articlesStart === -1) {
    console.log('MOCK_ARTICLES not found!');
    process.exit(1);
}

const beforeArticles = content.substring(0, articlesStart);
let afterArticles = content.substring(articlesStart);

let count = 0;
afterArticles = afterArticles.replace(/"imageUrl":\s*".*?"/g, (match) => {
  if (count < images.length) {
    return `"imageUrl": "${images[count++]}"`;
  }
  return match;
});

fs.writeFileSync('backend/src/data/mockData.ts', beforeArticles + afterArticles, 'utf8');
console.log(`Successfully replaced ${count} images.`);
