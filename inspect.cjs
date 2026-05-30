const fs = require('fs');
const lines = fs.readFileSync('backend/src/data/mockData.ts', 'utf16le').split('\n');
const idx = lines.findIndex(l => l.includes('"id": 102'));
if(idx !== -1) {
  console.log(lines.slice(idx, Math.min(idx+20, lines.length)).join('\n'));
} else {
  console.log('ID 102 not found');
}
