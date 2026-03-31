const fs = require('fs');
let content = fs.readFileSync('c:/Users/mysel/Downloads/petbhai/constants.ts', 'utf8');
content = content.replace(/\]\(\/community\)/g, '](#/community)');
fs.writeFileSync('c:/Users/mysel/Downloads/petbhai/constants.ts', content);
console.log('Fixed URLs in constants.ts');
