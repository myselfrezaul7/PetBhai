const fs = require('fs');
const path = require('path');

const mockDataPath = path.join(__dirname, 'backend', 'src', 'data', 'mockData.ts');
const content = fs.readFileSync(mockDataPath, 'utf16le');

const idRegex = /'id':\s*(\d+)/g;
let match;
let articles = [];

while ((match = idRegex.exec(content)) !== null) {
  const id = parseInt(match[1]);
  const startIdx = match.index;
  const chunk = content.substring(startIdx, startIdx + 8000);
  
  const titleMatch = chunk.match(/'title':\s*'([^']*)'/);
  const title = titleMatch ? titleMatch[1] : 'NO_TITLE';
  
  const categoryMatch = chunk.match(/'category':\s*'([^']*)'/);
  const category = categoryMatch ? categoryMatch[1] : 'NO_CAT';

  const slugMatch = chunk.match(/'slug':\s*'([^']*)'/);
  const slug = slugMatch ? slugMatch[1] : 'NO_SLUG';

  // Extract first 300 chars of content to identify topic
  const contentMatch = chunk.match(/'content':\s*`([\s\S]*?)`/);
  const articleContent = contentMatch ? contentMatch[1].substring(0, 300) : '';

  articles.push({ id, title, category, slug, preview: articleContent.replace(/\n/g, ' ').substring(0, 200) });
}

console.log('Total articles found: ' + articles.length);
console.log('\n=== EXISTING ARTICLE INVENTORY ===\n');

articles.forEach(a => {
  console.log('ID: ' + a.id);
  console.log('Title: ' + a.title);
  console.log('Category: ' + a.category);
  console.log('Slug: ' + a.slug);
  console.log('Preview: ' + a.preview.substring(0, 150));
  console.log('---');
});
