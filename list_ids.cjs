const fs = require('fs');
const content = fs.readFileSync('backend/src/data/mockData.ts', 'utf16le');

const idRegex = /'id':\s*(\d+)/g;
let match;
const garbageIds = [];
const goodIds = [];

while ((match = idRegex.exec(content)) !== null) {
  const id = parseInt(match[1]);
  const startIdx = match.index;
  const contentFieldMatch = content.substring(startIdx, startIdx + 15000).match(/'content':\s*`([\s\S]*?)`/);
  if (contentFieldMatch) {
    const articleContent = contentFieldMatch[1];
    const totalChars = articleContent.length;
    const cleanChars = (articleContent.match(/[\u0980-\u09FF\u0020-\u007E\n\r\t\u09E6-\u09EF]/g) || []).length;
    const garbageRatio = totalChars > 0 ? 1 - (cleanChars / totalChars) : 0;
    
    if (garbageRatio > 0.02) {
      garbageIds.push(id);
    } else {
      goodIds.push(id);
    }
  }
}

console.log('GARBAGE IDs (' + garbageIds.length + '):', JSON.stringify(garbageIds));
console.log('GOOD IDs (' + goodIds.length + '):', JSON.stringify(goodIds));
