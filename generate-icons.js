import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateIcons() {
  const svgBuffer = fs.readFileSync('public/icon.svg');

  console.log('Generating 192x192 icon...');
  await sharp(svgBuffer)
    .resize(192, 192)
    .flatten({ background: '#ffffff' })
    .png()
    .toFile('public/icons/icon-192x192.png');

  console.log('Generating 512x512 icon...');
  await sharp(svgBuffer)
    .resize(512, 512)
    .flatten({ background: '#ffffff' })
    .png()
    .toFile('public/icons/icon-512x512.png');

  console.log('Generating apple-touch-icon...');
  await sharp(svgBuffer)
    .resize(180, 180)
    .flatten({ background: '#ffffff' })
    .png()
    .toFile('public/apple-touch-icon.png');
    
  console.log('Generating favicon.png...');
  await sharp(svgBuffer)
    .resize(32, 32)
    .flatten({ background: '#ffffff' })
    .png()
    .toFile('public/favicon.png');

  console.log('Done!');
}

generateIcons().catch(console.error);
