const fs = require('fs');
const content = fs.readFileSync('backend/src/data/mockData.ts', 'utf16le');

const idRegex = /'id':\s*(\d+)/g;
let match;

while ((match = idRegex.exec(content)) !== null) {
  const id = parseInt(match[1]);
  const startIdx = match.index;
  const chunk = content.substring(startIdx, startIdx + 5000);
  
  // Extract title
  const titleMatch = chunk.match(/'title':\s*'([^']*)'/);
  const title = titleMatch ? titleMatch[1] : 'NO_TITLE';
  
  // Extract excerpt
  const excerptMatch = chunk.match(/'excerpt':\s*`([^`]*)`/);
  const excerpt = excerptMatch ? excerptMatch[1].substring(0, 80) : 'NO_EXCERPT';
  
  // Extract slug
  const slugMatch = chunk.match(/'slug':\s*'([^']*)'/);
  const slug = slugMatch ? slugMatch[1] : 'NO_SLUG';
  
  // Check each field for garbage (non-Bangla, non-ASCII printable)
  function hasGarbage(str) {
    const clean = (str.match(/[\u0980-\u09FF\u0020-\u007E\n\r\t\u09E6-\u09EF]/g) || []).length;
    const ratio = str.length > 0 ? 1 - (clean / str.length) : 0;
    return { garbage: ratio > 0.02, ratio: (ratio * 100).toFixed(1) + '%' };
  }
  
  const titleCheck = hasGarbage(title);
  const excerptCheck = hasGarbage(excerpt);
  const slugCheck = hasGarbage(slug);
  
  if (titleCheck.garbage || excerptCheck.garbage || slugCheck.garbage) {
    console.log('ID ' + id + ':');
    if (titleCheck.garbage) console.log('  TITLE GARBAGE (' + titleCheck.ratio + '): ' + title.substring(0, 60));
    if (excerptCheck.garbage) console.log('  EXCERPT GARBAGE (' + excerptCheck.ratio + '): ' + excerpt.substring(0, 60));
    if (slugCheck.garbage) console.log('  SLUG GARBAGE (' + slugCheck.ratio + '): ' + slug.substring(0, 60));
  }
}
