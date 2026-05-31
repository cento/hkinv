// Generates optimized solid-color PNG icons for PWA
import { writeFileSync } from 'fs';
import { deflateSync } from 'zlib';

function crc32(buf) {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crcVal = Buffer.alloc(4); crcVal.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([len, typeBytes, data, crcVal]);
}

function createSolidPNG(size, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Raw pixel data (filter byte 0 + RGB per pixel)
  const raw = Buffer.alloc(size * (1 + 3 * size));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + 3 * size) + 1;
    for (let x = 0; x < size; x++) {
      const p = rowStart + x * 3;
      raw[p] = r; raw[p + 1] = g; raw[p + 2] = b;
    }
  }

  // Proper zlib compression
  const compressed = deflateSync(raw);
  const cmf = 0x78; const flg = 0xDA; // best compression
  const zlibHeader = Buffer.from([cmf, flg]);

  // Adler-32
  let s1 = 1, s2 = 0;
  for (let i = 0; i < raw.length; i++) { s1 = (s1 + raw[i]) % 65521; s2 = (s2 + s1) % 65521; }
  const adler = Buffer.alloc(4); adler.writeUInt32BE((s2 << 16) | s1);

  const idat = chunk('IDAT', Buffer.concat([zlibHeader, compressed, adler]));
  const iend = chunk('IEND', Buffer.alloc(0));
  return Buffer.concat([signature, chunk('IHDR', ihdr), idat, iend]);
}

const BLUE = [26, 115, 232];
for (const size of [192, 512]) {
  const png = createSolidPNG(size, ...BLUE);
  writeFileSync(`public/icon-${size}.png`, png);
  console.log(`public/icon-${size}.png: ${(png.length / 1024).toFixed(1)} KB`);
}
