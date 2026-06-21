/**
 * Optimize office photos for web using sharp
 * Converts to WebP, resizes to appropriate dimensions, and optimizes quality
 */
import sharp from 'sharp';
import { readdir, mkdir } from 'fs/promises';
import { join, parse } from 'path';

const OFFICE_DIR = 'C:\\ANTIGRAVITY\\CF Riga Video\\Office';
const OUTPUT_DIR = 'c:\\ANTIGRAVITY\\CEOFLIGHTS Riga\\public\\images';

// Images to process with their target configs
const IMAGES = [
  // Hero background — wide, cropped for landscape banner
  { src: 'Office6.JPEG', name: 'office-workstations', width: 1920, height: 900, quality: 82, fit: 'cover' },
  // Team photo — for the culture/benefits section
  { src: 'New Trainees.jpeg', name: 'team-training', width: 1200, height: 800, quality: 80, fit: 'cover', cropLeft: 0.18 },
  // Lounge — for comfort/culture showcase
  { src: 'Office5.JPEG', name: 'office-lounge', width: 800, height: 600, quality: 80, fit: 'cover' },
  // World clocks — for international vibe
  { src: 'Office9.JPEG', name: 'world-clocks', width: 800, height: 600, quality: 80, fit: 'cover' },
  // Wide office shot — glass rooms
  { src: 'Office1.jpeg', name: 'office-wide', width: 1200, height: 800, quality: 80, fit: 'cover' },
  // Full floor with cubicles
  { src: 'Office3.jpeg', name: 'office-floor', width: 1200, height: 800, quality: 80, fit: 'cover' },
];

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  for (const img of IMAGES) {
    const inputPath = join(OFFICE_DIR, img.src);
    const outputWebp = join(OUTPUT_DIR, `${img.name}.webp`);
    const outputJpg = join(OUTPUT_DIR, `${img.name}.jpg`); // fallback

    try {
      // Build the sharp pipeline
      let pipeline = sharp(inputPath).rotate(); // auto-apply EXIF orientation

      // If cropLeft is set, extract a region first (crop from left edge)
      if (img.cropLeft) {
        const meta = await sharp(inputPath).rotate().metadata();
        const cropPx = Math.round(meta.width * img.cropLeft);
        pipeline = pipeline.extract({
          left: cropPx,
          top: 0,
          width: meta.width - cropPx,
          height: meta.height,
        });
      }

      // WebP (primary)
      await pipeline.clone()
        .resize(img.width, img.height, { fit: img.fit, position: 'centre' })
        .webp({ quality: img.quality, effort: 6 })
        .toFile(outputWebp);

      // JPEG fallback
      await pipeline.clone()
        .resize(img.width, img.height, { fit: img.fit, position: 'centre' })
        .jpeg({ quality: img.quality, mozjpeg: true })
        .toFile(outputJpg);

      const webpStats = await sharp(outputWebp).metadata();
      const jpgStats = await sharp(outputJpg).metadata();
      
      console.log(`✅ ${img.name}`);
      console.log(`   WebP: ${img.width}x${img.height} → ${(await import('fs')).statSync(outputWebp).size / 1024 | 0}KB`);
      console.log(`   JPEG: ${img.width}x${img.height} → ${(await import('fs')).statSync(outputJpg).size / 1024 | 0}KB`);
    } catch (err) {
      console.error(`❌ ${img.name}: ${err.message}`);
    }
  }

  // Also generate the CEOFLIGHTS logo as a local file from the existing URL
  console.log('\n✅ All images optimized and saved to public/images/');
}

main();
