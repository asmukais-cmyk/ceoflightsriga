import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, 'Office', 'iCloud Photos from Agris Smukais');
const DST = path.join(__dirname, 'public', 'images');

const QUALITY_JPG = 82;
const QUALITY_WEBP = 78;

async function processImage(srcFile, outName, width, height, options = {}) {
  const src = path.join(SRC, srcFile);
  const pipeline = sharp(src)
    .rotate()
    .resize(width, height, { fit: 'cover', position: options.position || 'centre' });

  if (options.warmGrade !== false) {
    pipeline.modulate({
      brightness: options.brightness || 1.06,
      saturation: options.saturation || 1.15,
    });
    pipeline.linear(options.contrast || 1.08, -(options.contrast || 1.08 - 1) * 128);
  }

  await pipeline.clone()
    .jpeg({ quality: QUALITY_JPG, mozjpeg: true })
    .toFile(path.join(DST, `${outName}.jpg`));

  await pipeline.clone()
    .webp({ quality: QUALITY_WEBP })
    .toFile(path.join(DST, `${outName}.webp`));

  console.log(`  ok ${outName} (${width}x${height})`);
}

async function main() {
  console.log('Processing new office photos...\n');

  // IMG_6877 — team selfie (great lighting, everyone smiling) — for "What You Get" section
  await processImage('IMG_6877.JPEG', 'team-training', 900, 600, {
    position: 'centre', brightness: 1.03, saturation: 1.1, contrast: 1.05,
  });

  // IMG_6761 — wide office floor shot — for photo gallery & strip
  await processImage('IMG_6761.JPEG', 'office-wide', 1600, 600, {
    position: 'centre', brightness: 1.08, saturation: 1.12,
  });

  // IMG_6757 — workstations with dividers — for photo gallery
  await processImage('IMG_6757.JPEG', 'office-floor', 800, 600, {
    position: 'centre', brightness: 1.08, saturation: 1.12,
  });

  // IMG_6758 — lounge with red chairs — for photo gallery
  await processImage('IMG_6758.JPEG', 'office-lounge', 800, 600, {
    position: 'centre', brightness: 1.05, saturation: 1.15,
  });

  // IMG_6904 — another lounge angle showing full office depth — for workstations strip
  await processImage('IMG_6904.JPEG', 'office-workstations', 1600, 500, {
    position: 'centre', brightness: 1.06, saturation: 1.12,
  });

  // IMG_6903 — cozy lounge closeup — for office detail
  await processImage('IMG_6903.JPEG', 'office-detail', 800, 600, {
    position: 'centre', brightness: 1.06, saturation: 1.12,
  });

  console.log('\nAll new office photos processed!');
}

main().catch(console.error);
