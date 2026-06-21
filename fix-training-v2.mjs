import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, 'Office', 'iCloud Photos from Agris Smukais', 'IMG_6930.PNG');
const DST = path.join(__dirname, 'public', 'images');

async function main() {
  const tM = await sharp(SRC).metadata();
  console.log(`  Original: ${tM.width}x${tM.height}`);
  
  // Much more aggressive crop to completely remove ALL overlay text
  // Top: timestamp goes down about 55px at original res (2796x1290)
  // Bottom-right: "Camera 01" sits in the last ~70px height, right ~350px
  // Let's crop generously from all edges
  const cropTop = 140;     // Well past the timestamp
  const cropBottom = 120;  // Well past Camera 01
  const cropLeft = 80;     
  const cropRight = 80;    
  const cW = tM.width - cropLeft - cropRight;
  const cH = tM.height - cropTop - cropBottom;

  console.log(`  Crop area: ${cW}x${cH} (from ${cropLeft},${cropTop})`);

  for (const [ext, opts] of [
    ['jpg', { quality: 85, mozjpeg: true }],
    ['webp', { quality: 82 }],
  ]) {
    const pipeline = sharp(SRC)
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
  console.log('  ok training-enhanced');
}

main().catch(console.error);
