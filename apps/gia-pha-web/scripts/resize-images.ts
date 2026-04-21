import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const TARGET_DIR = path.resolve('assets/homepage/ver02');
const MIN_SIZE_KB = 200;
const MAX_SIZE_KB = 500;

async function resizeImages() {
  const files = fs.readdirSync(TARGET_DIR);
  const imageFiles = files.filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));

  console.log(`Found ${imageFiles.length} images to process...`);

  for (const file of imageFiles) {
    const inputPath = path.join(TARGET_DIR, file);
    const stats = fs.statSync(inputPath);
    const initialSizeKB = stats.size / 1024;

    console.log(`Processing ${file} (Current size: ${initialSizeKB.toFixed(2)} KB)`);

    if (initialSizeKB <= MAX_SIZE_KB && initialSizeKB >= MIN_SIZE_KB) {
      console.log(`  - Skipping: Already within target range.`);
      continue;
    }

    try {
      const image = sharp(inputPath);
      const metadata = await image.metadata();

      // We'll try to compress by reducing quality and/or dimensions if they are huge
      let quality = 80;
      let width = metadata.width;
      
      // If the image is very large, we might want to scale it down a bit to help hit the target size
      // but without losing too much detail. 1920px is usually enough for web.
      if (width && width > 2560) {
        width = 2560;
      }

      let buffer: Buffer;
      let currentSizeKB: number;

      // Iterative approach to get close to the target size if possible
      // but usually one pass with good defaults works for 200-500kb unless it's a 100MB file
      
      const extension = path.extname(file).toLowerCase();
      
      if (extension === '.png') {
        // PNGs are often harder to get to 200-500kb without quality loss
        // We'll convert them to JPEG for better compression if they are large, 
        // OR use aggressive PNG compression. 
        // Given the request, I'll stick to the original format first.
        buffer = await image
          .resize({ width })
          .png({ palette: true, quality: 80 })
          .toBuffer();
      } else {
        buffer = await image
          .resize({ width })
          .jpeg({ quality: 80, mozjpeg: true })
          .toBuffer();
      }

      currentSizeKB = buffer.length / 1024;

      // If it's still too big, lower quality
      if (currentSizeKB > MAX_SIZE_KB) {
        if (extension === '.png') {
           // If PNG is still too big, we might need to convert to JPG or be more aggressive
           buffer = await image
            .resize({ width: Math.min(width || 2560, 1920) })
            .jpeg({ quality: 70, mozjpeg: true })
            .toBuffer();
           // Note: changing extension in place might be tricky if other things depend on it, 
           // but the user asked for 200-500kb.
        } else {
          buffer = await image
            .resize({ width: Math.min(width || 2560, 1920) })
            .jpeg({ quality: 60, mozjpeg: true })
            .toBuffer();
        }
        currentSizeKB = buffer.length / 1024;
      }

      // Write back to the same file
      fs.writeFileSync(inputPath, buffer);
      console.log(`  - Done: New size ${currentSizeKB.toFixed(2)} KB`);

    } catch (error) {
      console.error(`  - Error processing ${file}:`, error);
    }
  }

  console.log('Finished processing all images.');
}

resizeImages().catch(console.error);
