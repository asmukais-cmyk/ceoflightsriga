import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, 'Office', 'iCloud Photos from Agris Smukais');
const DST_DIR = path.join(__dirname, 'public', 'images');

const QUALITY_JPG = 85;
const QUALITY_WEBP = 82;

async function reprocessSelfie() {
  const src = path.join(SRC_DIR, 'IMG_6877.JPEG');
  console.log(`Reprocessing team selfie: ${src}`);

  // The original photo is already bright and beautifully exposed.
  // We apply minimal modulation and avoid linear contrast boosts which clip whites.
  const pipeline = sharp(src)
    .rotate()
    .resize(900, 600, { fit: 'cover', position: 'centre' })
    .modulate({
      brightness: 1.02,
      saturation: 1.05,
    });

  await pipeline.clone()
    .jpeg({ quality: QUALITY_JPG, mozjpeg: true })
    .toFile(path.join(DST_DIR, 'team-training.jpg'));

  await pipeline.clone()
    .webp({ quality: QUALITY_WEBP })
    .toFile(path.join(DST_DIR, 'team-training.webp'));

  console.log('  ✅ team-training (selfie) reprocessed successfully!');
}

async function reprocessTraining() {
  const src = path.join(SRC_DIR, 'IMG_6930.PNG');
  console.log(`Reprocessing training camera still: ${src}`);

  const metadata = await sharp(src).metadata();
  console.log(`  Original dimensions: ${metadata.width}x${metadata.height}`);

  // Crop security overlays: 110px from top (timestamp), 110px from bottom (Camera 01 label)
  const cropTop = 110;
  const cropBottom = 110;
  const cropLeft = 0;
  const cropRight = 0;
  const cropWidth = metadata.width - cropLeft - cropRight;
  const cropHeight = metadata.height - cropTop - cropBottom;

  // The camera still is slightly dark and cool-toned.
  // We apply a gentle brightness boost (1.12) and light contrast (1.04) to look warm and natural.
  const pipeline = sharp(src)
    .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
    .modulate({
      brightness: 1.12,
      saturation: 1.1,
    })
    .linear(1.04, -(1.04 - 1) * 128)
    .sharpen({ sigma: 1.1, m1: 1.0, m2: 0.5 })
    .resize(1200, 700, { fit: 'cover', position: 'centre' });

  await pipeline.clone()
    .jpeg({ quality: QUALITY_JPG, mozjpeg: true })
    .toFile(path.join(DST_DIR, 'training-enhanced.jpg'));

  await pipeline.clone()
    .webp({ quality: QUALITY_WEBP })
    .toFile(path.join(DST_DIR, 'training-enhanced.webp'));

  console.log('  ✅ training-enhanced reprocessed successfully!');
}

async function main() {
  console.log('--- START PHOTO REPROCESSING ---');
  await reprocessSelfie();
  await reprocessTraining();
  console.log('--- DONE ---');
}

main().catch(console.error);
