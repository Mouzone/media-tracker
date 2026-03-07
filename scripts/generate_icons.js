import fs from 'fs';
import sharp from 'sharp';

async function process() {
  try {
    const svgBuffer = fs.readFileSync('/Users/sunnyliu/Repos/media-tracker/public/icon.svg');
    console.log('Read SVG. Generating 192...');
    await sharp(svgBuffer).resize(192, 192).toFile('/Users/sunnyliu/Repos/media-tracker/public/icons/icon-192x192.png');
    console.log('Generating 512...');
    await sharp(svgBuffer).resize(512, 512).toFile('/Users/sunnyliu/Repos/media-tracker/public/icons/icon-512x512.png');
    console.log('Generating Apple Touch...');
    await sharp(svgBuffer).resize(192, 192).toFile('/Users/sunnyliu/Repos/media-tracker/public/apple-touch-icon.png');
    console.log('Generating Favicon...');
    await sharp(svgBuffer).resize(192, 192).toFile('/Users/sunnyliu/Repos/media-tracker/public/favicon.png');
    console.log('Done generating icons!');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

process();
