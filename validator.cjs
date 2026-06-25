const fs = require('fs');
const ts = require('typescript');

const mockDataContent = fs.readFileSync('backend/src/data/mockData.ts', 'utf8');
const jsCode = ts.transpileModule(mockDataContent, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;

fs.writeFileSync('tempMockData.cjs', jsCode, 'utf8');
const mockData = require('./tempMockData.cjs');

const requiredFields = {
    MOCK_ARTICLES: ['id', 'title', 'content', 'imageUrl', 'author', 'date', 'readTime'],
    MOCK_PRODUCTS: ['id', 'name', 'category', 'price', 'imageUrl', 'description', 'weight', 'brandId', 'rating', 'reviews'],
    MOCK_ANIMALS: ['id', 'name', 'breed', 'age', 'gender', 'size', 'status', 'description', 'imageUrl'],
    MOCK_VETS: ['id', 'name', 'specialization', 'clinicName', 'address', 'phone', 'imageUrl', 'availability', 'bio', 'qualifications', 'services', 'reviews']
};

let hasError = false;
let report = "";

for (const [key, fields] of Object.entries(requiredFields)) {
    const array = mockData[key];
    if (!array || !Array.isArray(array)) {
        report += `Missing or invalid exported array: ${key}\n`;
        hasError = true;
        continue;
    }
    
    report += `Checking ${key} (${array.length} items)...\n`;
    let missingCount = 0;
    array.forEach((item, index) => {
        const missing = fields.filter(f => item[f] === undefined || item[f] === null || item[f] === '');
        if (missing.length > 0) {
            report += `- ${key}[${index}] (ID: ${item.id}) is missing fields: ${missing.join(', ')}\n`;
            hasError = true;
            missingCount++;
        }
    });
    if (missingCount === 0) {
        report += `✅ All ${key} items are valid.\n`;
    }
}

if (!hasError) {
    report += "All mock arrays strictly conform to their TypeScript interfaces!\n";
} else {
    report += "Validation failed.\n";
}

console.log(report);
fs.writeFileSync('audit_report.txt', report, 'utf8');
