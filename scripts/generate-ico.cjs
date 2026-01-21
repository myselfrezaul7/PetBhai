/**
 * Generate favicon.ico from PNG
 * Usage: node scripts/generate-ico.cjs
 */

const pngToIcoModule = require('png-to-ico');
const pngToIco = pngToIcoModule.default || pngToIcoModule;
const fs = require('fs');
const path = require('path');

const outputFile = path.join(__dirname, '../public/favicon.ico');

async function generateIco() {
  try {
    const input = path.join(__dirname, '../public/favicon-32x32.png');

    if (!fs.existsSync(input)) {
      console.error('Input file not found:', input);
      process.exit(1);
    }

    const buf = await pngToIco([input]);
    fs.writeFileSync(outputFile, buf);
    console.log('Generated favicon.ico successfully');
  } catch (error) {
    console.error('Failed to generate favicon.ico:', error.message);
    process.exit(1);
  }
}

generateIco();
