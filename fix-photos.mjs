import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, 'Office', 'iCloud Photos from Agris Smukais');
const DST = path.join(__dirname, 'public', 'images');

async function main() {
  console.log('Fixing photos...\n');

  // IMG_6877 team selfie — needs MUCH more brightness
  const selfie = path.join(SRC_DIR, 'IMG_6877.JPEG');
  const selfieM = await sharp(selfie).metadata();
  console.log(`  Selfie original: ${selfieM.width}x${selfieM.height}`);

  for (const [ext, opts] of [
    ['jpg', { quality: 85, mozjpeg: true }],
    ['webp', { quality: 82 }],
  ]) {
    const pipeline = sharp(selfie)
      .rotate()
      .modulate({
        brightness: 1.45,    // Major brightness boost — it's very dark
        saturation: 1.3,     // Rich colors
      })
      .linear(1.2, -(1.2 - 1) * 100)  // Contrast boost
      .sharpen({ sigma: 1.0 })
      .resize(900, 600, { fit: 'cover', position: 'centre' });
    
    if (ext === 'jpg') {
      await pipeline.jpeg(opts).toFile(path.join(DST, `team-training.${ext}`));
    } else {
      await pipeline.webp(opts).toFile(path.join(DST, `team-training.${ext}`));
    }
  }
  console.log('  ok team-training (brightened)');

  // IMG_6930 training — crop more aggressively to remove overlays
  const training = path.join(SRC_DIR, 'IMG_6930.PNG');
  const tM = await sharp(training).metadata();
  console.log(`  Training original: ${tM.width}x${tM.height}`);
  
  // Crop: remove top 100px (timestamp), bottom 80px (Camera 01), left 20px, right 20px
  const cropTop = 100;
  const cropBottom = 80;
  const cropLeft = 20;
  const cropRight = 20;
  const cW = tM.width - cropLeft - cropRight;
  const cH = tM.height - cropTop - cropBottom;

  for (const [ext, opts] of [
    ['jpg', { quality: 85, mozjpeg: true }],
    ['webp', { quality: 82 }],
  ]) {
    const pipeline = sharp(training)
      .extract({ left: cropLeft, top: cropTop, width: cW, height: cH })
      .modulate({
        brightness: 1.4,
        saturation: 1.3,
      })
      .linear(1.18, -(1.18 - 1) * 110)
      .sharpen({ sigma: 1.3, m1: 1.2, m2: 0.6 })
      .resize(1200, 700, { fit: 'cover', position: 'centre' });
    
    if (ext === 'jpg') {
      await pipeline.jpeg(opts).toFile(path.join(DST, `training-enhanced.${ext}`));
    } else {
      await pipeline.webp(opts).toFile(path.join(DST, `training-enhanced.${ext}`));
    }
  }
  console.log('  ok training-enhanced (cropped + brightened)');

  console.log('\nDone!');
}

main().catch(console.error);
