const fs = require('fs');
let data = fs.readFileSync('C:/Users/mysel/Downloads/petbhai/backend/src/data/mockData.ts', 'utf8');

function escapeString(match, prefix, content) {
    let escapedContent = content.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    return prefix + '`' + escapedContent + '`,\n';
}

['content', 'excerpt', 'title'].forEach(key => {
    let regex = new RegExp("([ \\t]+'" + key + "': )'([\\s\\S]*?)',\\r?\\n", "g");
    data = data.replace(regex, escapeString);
});

fs.writeFileSync('C:/Users/mysel/Downloads/petbhai/backend/src/data/mockData.ts', data);
console.log('Fixed content, excerpt, and title fields in backend mockData.ts!');
