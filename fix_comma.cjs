const fs = require('fs');
const path = require('path');
const mockDataPath = path.join(__dirname, 'backend', 'src', 'data', 'mockData.ts');
let content = fs.readFileSync(mockDataPath, 'utf16le');

// Replace the missing comma block
content = content.replace(/}\r?\n\s*{\r?\n\s*'id': 201/g, '},\n  {\n    \'id\': 201');

fs.writeFileSync(mockDataPath, content, 'utf16le');
console.log('Fixed missing comma');
