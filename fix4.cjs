const fs = require('fs');
let content = fs.readFileSync('c:/Users/mysel/Downloads/petbhai/constants.ts', 'utf8');

const regex = /({\s*id:\s*101,\s*title:\s*"How to Potty Train Your Kitten: A Step-by-Step Guide")/g;

let count = 0;
content = content.replace(regex, (match) => {
    count++;
    if (count === 1) {
        return "export const MOCK_ARTICLES: Article[] = [\n  " + match;
    }
    return match;
});

if (count > 0) {
    fs.writeFileSync('c:/Users/mysel/Downloads/petbhai/constants.ts', content);
    console.log('Fixed constants.ts!');
} else {
    console.log('Not found!');
}
