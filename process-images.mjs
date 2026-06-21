import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, 'Office');
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

async function processPortrait(srcFile, outName, size = 400) {
  const src = path.join(SRC, srcFile);
  await sharp(src)
    .rotate()
    .resize(size, size, { fit: 'cover', position: 'top' })
    .modulate({ brightness: 1.04, saturation: 1.1 })
    .jpeg({ quality: QUALITY_JPG, mozjpeg: true })
    .toFile(path.join(DST, `${outName}.jpg`));

  await sharp(src)
    .rotate()
    .resize(size, size, { fit: 'cover', position: 'top' })
    .modulate({ brightness: 1.04, saturation: 1.1 })
    .webp({ quality: QUALITY_WEBP })
    .toFile(path.join(DST, `${outName}.webp`));

  console.log(`  ok ${outName} (${size}x${size} portrait)`);
}

async function main() {
  console.log('Processing images...\n');

  // Hero: Office1 - glass partitions + world clocks
  await processImage('Office1.jpeg', 'hero', 1920, 1080, {
    position: 'centre', brightness: 1.02, saturation: 1.08, contrast: 1.06,
  });

  // Office wide panoramic (lounge with red chairs)
  await processImage('Office2.jpeg', 'office-wide', 1600, 600, {
    position: 'centre', brightness: 1.04, saturation: 1.12,
  });

  // Workstations (cubicles, overhead angle)
  await processImage('Office3.jpeg', 'office-floor', 800, 600, {
    position: 'top',
  });

  // Workspace detail (desk + bookshelf + plant)
  await processImage('Office4.JPG', 'office-detail', 800, 600, {
    position: 'centre', brightness: 1.08,
  });

  // Lounge area
  await processImage('Office2.jpeg', 'office-lounge', 800, 600, {
    position: 'left', brightness: 1.05, saturation: 1.15,
  });

  // World clocks strip
  await processImage('Office1.jpeg', 'office-workstations', 1600, 500, {
    position: 'right',
  });

  // Team training photo
  await processImage('New Trainees.jpeg', 'team-training', 900, 600, {
    position: 'centre', brightness: 1.04, saturation: 1.08, contrast: 1.05,
  });

  // Team group (wider for team section)
  await processImage('New Trainees.jpeg', 'team-group', 1200, 700, {
    position: 'top', brightness: 1.05, saturation: 1.1,
  });

  // Portraits
  await processPortrait('People/Casper5.JPG', 'team-casper', 400);
  await processPortrait('People/Olivia_Brooks_2.png', 'team-olivia', 400);

  console.log('\nAll images processed!');
}

main().catch(console.error);
