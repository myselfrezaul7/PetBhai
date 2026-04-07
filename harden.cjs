const fs = require('fs');
const glob = require('fs').readdirSync;
const path = require('path');

const ROUTES_DIR = path.join(__dirname, 'backend', 'src', 'routes');

// Helper to get all TS files in routes dir
function getRouteFiles() {
  return fs.readdirSync(ROUTES_DIR)
    .filter(f => f.endsWith('.ts'))
    .map(f => path.join(ROUTES_DIR, f));
}

const files = getRouteFiles();

let totalReplaced = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Convert `db.write()` to `await db.write()`
  content = content.replace(/(?<!await\s)db\.write\(\)/g, 'await db.write()');
  
  // Convert `persistChanges(res)` to `await persistChanges(res)`
  content = content.replace(/(?<!await\s)persistChanges\(res\)/g, 'await persistChanges(res)');
  
  // If the file now has `await ` but the handler isn't async, we need to convert the handler.
  // We can convert: (req, res) => ... to async (req, res) =>
  // A naive but surprisingly effective regex for express handlers:
  // e.g. `(req, res) => {` -> `async (req, res) => {`
  content = content.replace(/\((req,?[\s\S]*?,?\s*res)\)\s*=>/g, (match, p1) => {
    if (match.includes('async')) return match;
    return `async (${p1}) =>`;
  });
  
  // Also handle `(req: AuthRequest, res)` and similar
  content = content.replace(/\(\s*req:\s*[a-zA-Z]+,\s*res\s*\)\s*=>/g, (match) => {
     if (match.includes('async')) return match;
     return `async ${match}`;
  });

  content = content.replace(/\(\s*req:\s*[a-zA-Z]+,\s*res:\s*[a-zA-Z]+\s*\)\s*=>/g, (match) => {
     if (match.includes('async')) return match;
     return `async ${match}`;
  });
  
  // For `function (req, res)`
  content = content.replace(/function\s*\(\s*req,\s*res/g, (match) => {
      if (match.includes('async')) return match;
      return `async ${match}`;
  });

  // Specifically for persistChanges definition in authRoutes.ts
  content = content.replace(/const persistChanges = \(res: any\): boolean => {/, 'const persistChanges = async (res: any): Promise<boolean> => {');
  
  if (fs.readFileSync(file, 'utf8') !== content) {
    fs.writeFileSync(file, content, 'utf8');
    totalReplaced++;
  }
}

console.log('Modified', totalReplaced, 'files to use await db.write() / await persistChanges(res).');

