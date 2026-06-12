const fs = require('fs');
const content = fs.readFileSync('backend/src/data/mockData.ts', 'utf16le');
const match = content.match(/["']https:\/\/placehold\.co[^"']*["']/g);
console.log(match ? match.slice(0, 5) : 'No match');
