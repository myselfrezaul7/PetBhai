const fs = require('fs');
const path = require('path');
const mockDataPath = path.join(__dirname, 'backend', 'src', 'data', 'mockData.ts');
let content = fs.readFileSync(mockDataPath, 'utf16le');

// Find MOCK_ARTICLES boundaries
const articlesStart = content.indexOf('export const MOCK_ARTICLES');
const animalsExport = content.indexOf('export const MOCK_ANIMALS');
const articlesEndBracket = content.lastIndexOf('];', animalsExport);

// Find the misplaced articles block in MOCK_USERS
// They start with "{\n    'id': 201," and end after the last one (id 210) with "},\n"
const firstMisplaced = content.indexOf("'id': 201,");
const lastMisplacedContent = content.indexOf("'id': 210,");

if (firstMisplaced === -1 || lastMisplacedContent === -1) {
  console.log('Misplaced articles not found. Already fixed?');
  process.exit(0);
}

// Find the closing "},\n" after id 210's full object
let endOfLast = content.indexOf('},', lastMisplacedContent);
endOfLast = content.indexOf('\n', endOfLast) + 1;
// Find the opening "{" before id 201
let startOfFirst = content.lastIndexOf('{', firstMisplaced);
// Include any leading whitespace
while (startOfFirst > 0 && content[startOfFirst - 1] === ' ') startOfFirst--;

const misplacedBlock = content.substring(startOfFirst, endOfLast);

// Remove from MOCK_USERS
content = content.substring(0, startOfFirst) + content.substring(endOfLast);

// Recalculate MOCK_ARTICLES end (positions shifted after removal)
const newAnimalsExport = content.indexOf('export const MOCK_ANIMALS');
const newArticlesEnd = content.lastIndexOf('];', newAnimalsExport);

// Insert before MOCK_ARTICLES closing ];
content = content.substring(0, newArticlesEnd) + misplacedBlock + content.substring(newArticlesEnd);

fs.writeFileSync(mockDataPath, content, 'utf16le');
console.log('Done: relocated articles 201-210 to MOCK_ARTICLES');
