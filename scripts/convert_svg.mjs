import sharp from 'sharp';

async function convert() {
  try {
    await sharp('public/og-image.svg')
      .resize(1200, 630)
      .png()
      .toFile('public/og-image.png');
    console.log('Converted og-image.svg to og-image.png successfully.');
  } catch (error) {
    console.error('Error converting SVG:', error);
  }
}

convert();
