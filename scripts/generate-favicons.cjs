/**
 * Favicon Generator Script
 * Run this script to generate favicon files from icon-512x512.png
 *
 * Prerequisites: npm install sharp
 * Usage: node scripts/generate-favicons.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE_ICON = path.join(__dirname, '../public/icon-512x512.png');
const OUTPUT_DIR = path.join(__dirname, '../public');

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
];

async function generateFavicons() {
  console.log('Generating favicons from:', SOURCE_ICON);

  if (!fs.existsSync(SOURCE_ICON)) {
    console.error('Source icon not found:', SOURCE_ICON);
    process.exit(1);
  }

  for (const { name, size } of sizes) {
    const outputPath = path.join(OUTPUT_DIR, name);

    try {
      await sharp(SOURCE_ICON)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${name}:`, error.message);
    }
  }

  // Generate ICO file (requires ico-encoder or similar)
  // For now, we'll copy the 32x32 as a fallback
  console.log('\nNote: For favicon.ico, use an online converter or:');
  console.log('npm install png-to-ico');
  console.log('Then convert favicon-32x32.png to favicon.ico');

  console.log('\n✓ Favicon generation complete!');
}

generateFavicons().catch(console.error);
