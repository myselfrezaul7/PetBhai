const fs = require('fs');
const path = require('path');

const mockDataPath = path.join(__dirname, 'backend', 'src', 'data', 'mockData.ts');

try {
  let content = fs.readFileSync(mockDataPath, 'utf16le');

  const targetIds = [45, 48, 52, 55, 62, 63, 67, 68, 69, 70, 1000, 1001, 1002, 1003, 1004, 1005, 1006];

  // Helper function to generate slug exactly as in the mock generator
  function generateSlug(title, id) {
    return title.replace(/[^a-zA-Z0-9\u0980-\u09FF \-]/g, '').replace(/\s+/g, '-') + '-' + id;
  }

  // We find each object block using the IDs, then replace the title, excerpt, and slug inside it
  const idRegex = /'id':\s*(\d+)/g;
  let match;
  let matches = [];
  while ((match = idRegex.exec(content)) !== null) {
    matches.push({ id: parseInt(match[1]), index: match.index });
  }

  // We manipulate the string back-to-front or just split and join to not mess up indices
  // Actually, easiest is to slice out each block one by one, fix it, and rebuild the file
  let newContent = '';
  let lastIndex = 0;

  for (let i = 0; i < matches.length; i++) {
    const id = matches[i].id;
    if (!targetIds.includes(id)) {
      continue;
    }

    const startObj = content.lastIndexOf('{', matches[i].index);
    const endObj = i < matches.length - 1 ? content.lastIndexOf('},', matches[i+1].index) : content.lastIndexOf('}', content.indexOf('];', matches[i].index));
    
    // Slice everything before this object
    newContent += content.substring(lastIndex, startObj);
    
    let objText = content.substring(startObj, endObj + 1);

    // 1. Extract content to find the real title and excerpt
    // It's like 'content': `**title**\n\ntext...`
    const contentMatch = objText.match(/'content':\s*`([\s\S]*?)`/);
    if (!contentMatch) {
      throw new Error('Content not found for ID ' + id);
    }
    const cleanContent = contentMatch[1];
    
    // Extract real title from the first ** **
    const titleMatch = cleanContent.match(/\*\*([^\*]+)\*\*/);
    const realTitle = titleMatch ? titleMatch[1].trim() : 'PetBhai Article';
    
    // Extract real excerpt by removing markdown, and taking 150 chars
    let realExcerpt = cleanContent.replace(/[#*\n\r]/g, ' ').replace(/\s+/g, ' ').trim().replace(realTitle, '').trim();
    realExcerpt = realExcerpt.substring(0, 150) + '...';

    // Generate real slug
    const realSlug = generateSlug(realTitle, id);

    // 2. Replace the fields in the object text
    // Replace title
    objText = objText.replace(/'title':\s*['`][^'`]*['`]/, `'title': '${realTitle}'`);
    
    // Replace excerpt
    objText = objText.replace(/'excerpt':\s*[`]['\s\S]*?[`]/, `'excerpt': \`${realExcerpt}\``);
    // In case excerpt was enclosed in single quotes instead of backticks:
    objText = objText.replace(/'excerpt':\s*['][^']*[']/, `'excerpt': \`${realExcerpt}\``);
    
    // Replace slug
    objText = objText.replace(/'slug':\s*['`][^'`]*['`]/, `'slug': '${realSlug}'`);

    // Add mutated object to new content
    newContent += objText;
    lastIndex = endObj + 1;
  }

  // Append whatever remains of the file
  newContent += content.substring(lastIndex);

  fs.writeFileSync(mockDataPath, newContent, 'utf16le');
  console.log('Successfully fixed garbled metadata for 17 original articles!');

} catch (err) {
  console.error('Error:', err);
}
