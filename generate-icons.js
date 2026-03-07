import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateIcons() {
  const svgBuffer = fs.readFileSync('public/icon.svg');

  console.log('Generating 192x192 icon...');
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/icons/icon-192x192.png');

  console.log('Generating 512x512 icon...');
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/icons/icon-512x512.png');

  console.log('Generating apple-touch-icon...');
  // Apple touch icon typically needs a solid background to look good, but we can just resize the svg.
  // We'll give it a white background just in case if the svg is transparent, but our SVG has stroke colors.
  // Actually, let's just make it a raw resize.
  await sharp(svgBuffer)
    .resize(180, 180)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toFile('public/apple-touch-icon.png');
    
  console.log('Generating favicon.png...');
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile('public/favicon.png');

  console.log('Done!');
}

generateIcons().catch(console.error);
