const fs = require('fs');
const content = fs.readFileSync('backend/src/data/mockData.ts', 'utf16le');

const idRegex = /'id':\s*(\d+)/g;
let match;
const issues = [];

while ((match = idRegex.exec(content)) !== null) {
  const id = parseInt(match[1]);
  const startIdx = match.index;
  const contentFieldMatch = content.substring(startIdx, startIdx + 15000).match(/'content':\s*`([\s\S]*?)`/);
  if (contentFieldMatch) {
    const articleContent = contentFieldMatch[1];
    const banglaChars = (articleContent.match(/[\u0980-\u09FF]/g) || []).length;
    const totalChars = articleContent.length;
    const banglaRatio = totalChars > 0 ? banglaChars / totalChars : 0;
    
    // Check for mojibake / garbled characters (chars outside Bangla + normal ASCII + markdown)
    const cleanChars = (articleContent.match(/[\u0980-\u09FF\u0020-\u007E\n\r\t\u09E6-\u09EF]/g) || []).length;
    const garbageRatio = totalChars > 0 ? 1 - (cleanChars / totalChars) : 0;

    const titleMatch = content.substring(startIdx, startIdx + 2000).match(/'title':\s*[`']([^`']*)[`']/);
    const title = titleMatch ? titleMatch[1].substring(0, 60) : 'UNKNOWN';

    if (garbageRatio > 0.02 || (banglaRatio < 0.15 && totalChars > 100)) {
      issues.push({
        id,
        title,
        type: garbageRatio > 0.02 ? 'GARBAGE_CHARS' : 'LOW_BANGLA',
        banglaRatio: (banglaRatio * 100).toFixed(1) + '%',
        garbageRatio: (garbageRatio * 100).toFixed(1) + '%',
        len: totalChars
      });
    }
  }
}

console.log(JSON.stringify(issues, null, 2));
console.log('Total problematic articles:', issues.length);
