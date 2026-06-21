import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, 'Office', 'iCloud Photos from Agris Smukais', 'IMG_6930.PNG');
const DST = path.join(__dirname, 'public', 'images');

/**
 * Strategy: Crop the image to remove the timestamp (top-left) and Camera 01 (bottom-right)
 * by focusing on the center-right area where the training scene is most compelling.
 * Then enhance brightness, saturation, and sharpness.
 */
async function main() {
  console.log('Processing IMG_6930 training photo...\n');

  const metadata = await sharp(SRC).metadata();
  console.log(`  Original: ${metadata.width}x${metadata.height}`);

  // The timestamp is at top-left (approx top 60px), Camera 01 is at bottom-right (bottom 50px)
  // Crop to remove both overlays — take center portion
  const cropTop = 70;     // Remove timestamp area
  const cropBottom = 60;  // Remove Camera 01 area
  const cropLeft = 0;
  const cropRight = 0;

  const cropWidth = metadata.width - cropLeft - cropRight;
  const cropHeight = metadata.height - cropTop - cropBottom;

  // Process as team-training-new (enhanced training scene)
  await sharp(SRC)
    .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
    .modulate({
      brightness: 1.35,     // Significantly brighten the dark camera footage
      saturation: 1.25,     // Make colors more vivid
    })
    .linear(1.15, -(1.15 - 1) * 128)  // Increase contrast
    .sharpen({ sigma: 1.2, m1: 1.0, m2: 0.5 })
    .resize(1200, 700, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(path.join(DST, 'training-enhanced.jpg'));

  await sharp(SRC)
    .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
    .modulate({
      brightness: 1.35,
      saturation: 1.25,
    })
    .linear(1.15, -(1.15 - 1) * 128)
    .sharpen({ sigma: 1.2, m1: 1.0, m2: 0.5 })
    .resize(1200, 700, { fit: 'cover', position: 'centre' })
    .webp({ quality: 80 })
    .toFile(path.join(DST, 'training-enhanced.webp'));

  console.log('  ok training-enhanced (1200x700)');

  console.log('\nDone!');
}

main().catch(console.error);
