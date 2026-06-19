const fs = require('fs');
const { execSync } = require('child_process');

console.log('Validating encoding of staged files...');

try {
  // Get list of staged files
  const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM').toString().split('\n').filter(Boolean);

  let hasErrors = false;

  for (const file of stagedFiles) {
    // Only check source files
    if (!file.match(/\.(ts|tsx|js|jsx|json|css|html|md)$/)) continue;

    // Skip if file doesn't exist (e.g. deleted)
    if (!fs.existsSync(file)) continue;

    const buffer = fs.readFileSync(file);
    
    // Check for BOM (Byte Order Mark)
    if (buffer.length >= 2) {
      if ((buffer[0] === 0xFE && buffer[1] === 0xFF) || (buffer[0] === 0xFF && buffer[1] === 0xFE)) {
        console.error(`❌ ERROR: ${file} contains a UTF-16 BOM.`);
        hasErrors = true;
      }
    }

    // Check for null bytes (common in UTF-16LE without BOM)
    if (buffer.includes(0x00)) {
      console.error(`❌ ERROR: ${file} contains null bytes. It might be saved as UTF-16!`);
      hasErrors = true;
    }

    // Specific check for mockData.ts
    if (file === 'backend/src/data/mockData.ts') {
      const content = buffer.toString('utf8');
      const bengaliChars = (content.match(/[\u0980-\u09FF]/g) || []).length;
      if (bengaliChars < 100) {
        console.error(`❌ ERROR: ${file} seems to have lost its Bengali text!`);
        console.error(`Expected >100 Bengali characters, found ${bengaliChars}.`);
        console.error(`Did you save it in the wrong encoding?`);
        hasErrors = true;
      }
    }
  }

  if (hasErrors) {
    console.error('\n🚫 COMMIT REJECTED due to encoding errors.');
    console.error('Please fix the files above (save as UTF-8) and try again.');
    process.exit(1);
  }

  console.log('✅ Encoding validation passed.');
  process.exit(0);

} catch (err) {
  console.error('Error running encoding validation:', err);
  process.exit(1);
}
