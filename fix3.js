const fs = require('fs');
let content = fs.readFileSync('c:/Users/mysel/Downloads/petbhai/constants.ts', 'utf8');

const regex = /\{\s*id:\s*101,\s*title:\s*"How to Potty Train Your Kitten: A Step-by-Step Guide"/g;

const match = regex.exec(content);
if(match) {
    const idx = match.index;
    content = content.slice(0, idx) + "export const MOCK_ARTICLES: Article[] = [\n  " + content.slice(idx);
    fs.writeFileSync('c:/Users/mysel/Downloads/petbhai/constants.ts', content);
    console.log('Fixed constants.ts!');
} else {
    console.log('Not found!');
}
