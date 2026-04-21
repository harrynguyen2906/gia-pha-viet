/**
 * composite-homepage.ts — Creates homepage images from ver02 assets
 * 
 * Output:
 *   2.png = full composite background (0.jpg + all layers)
 *   3.png = tree cutout (cropped, transparent)
 *   4.png = house cutout (cropped, transparent)
 *   5.png = chùa cutout (cropped, transparent)
 *   6.png = rocks/pond cutout (cropped, transparent)
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const PUBLIC = path.resolve('public/homepage');
const VER02 = path.resolve('assets/homepage/ver02');
const W = 1920;
const H = 1071;

function findBoundingBox(data: Buffer, width: number, height: number, channels: number) {
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * channels + 3];
      if (alpha > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/** Convert near-black pixels to transparent (for tree layer with black bg) */
async function removeBlackBackground(buffer: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i], g = out[i + 1], b = out[i + 2];
    const brightness = (r + g + b) / 3;
    if (brightness < 15) {
      out[i + 3] = 0; // fully transparent
    } else if (brightness < 40) {
      // Feather edge for smooth blending
      out[i + 3] = Math.min(255, Math.round((brightness - 15) * (255 / 25)));
    }
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

async function main() {
  console.log('Building full background composite...');
  const bgBuffer = await sharp(path.join(VER02, '0.jpg'))
    .resize(W, H, { fit: 'fill' }).png().toBuffer();

  const treeRaw = await sharp(path.join(VER02, '1.png'))
    .resize(W, H, { fit: 'fill' }).png().toBuffer();
  const houseBuffer = await sharp(path.join(VER02, '2.png'))
    .resize(W, H, { fit: 'fill' }).png().toBuffer();
  const chuaBuffer = await sharp(path.join(VER02, '3.png'))
    .resize(W, H, { fit: 'fill' }).png().toBuffer();
  const rocksBuffer = await sharp(path.join(VER02, '4.png'))
    .resize(W, H, { fit: 'fill' }).png().toBuffer();

  console.log('Removing black background from tree...');
  const treeTransparent = await removeBlackBackground(treeRaw);

  const fullComposite = await sharp(bgBuffer)
    .composite([
      { input: treeRaw, top: 0, left: 0, blend: 'screen' },
      { input: houseBuffer, top: 0, left: 0, blend: 'over' },
      { input: chuaBuffer, top: 0, left: 0, blend: 'over' },
      { input: rocksBuffer, top: 0, left: 0, blend: 'over' },
    ])
    .png({ compressionLevel: 8 })
    .toBuffer();

  await sharp(fullComposite).toFile(path.join(PUBLIC, '2.png'));
  console.log('  → Saved 2.png (background)');

  console.log('Generating full-size transparent layers...');
  await sharp(treeTransparent).png({ compressionLevel: 8 }).toFile(path.join(PUBLIC, '3.png'));
  await sharp(houseBuffer).png({ compressionLevel: 8 }).toFile(path.join(PUBLIC, '4.png'));
  await sharp(chuaBuffer).png({ compressionLevel: 8 }).toFile(path.join(PUBLIC, '5.png'));
  await sharp(rocksBuffer).png({ compressionLevel: 8 }).toFile(path.join(PUBLIC, '6.png'));

  console.log('\n--- Final files ---');
  for (const f of ['2.png', '3.png', '4.png', '5.png', '6.png']) {
    const p = path.join(PUBLIC, f);
    if (fs.existsSync(p)) {
      console.log(`  ${f}: ${(fs.statSync(p).size / 1024).toFixed(1)} KB`);
    }
  }
  console.log('\n✅ Done!');
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
