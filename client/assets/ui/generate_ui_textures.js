const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function createPng(width, height, pixelFn) {
  const rowBytes = width * 4;
  const raw = Buffer.alloc(height * (rowBytes + 1));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = a !== undefined ? a : 255;
    }
  }

  const deflated = zlib.deflateSync(raw);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);
    let crc = 0xffffffff;
    for (let i = 0; i < body.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ body[i]) & 0xff];
    }
    crc = (crc ^ 0xffffffff) >>> 0;
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, body, crcBuf]);
  }

  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    header,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflated),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const outDir = 'client/assets/ui';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// -------------------------------------------------------------
// 1. JOYSTICK BASE RUNE RING (128x128)
// Mystical Stone & Golden Runes Ring
// -------------------------------------------------------------
const joyBasePng = createPng(128, 128, (x, y) => {
  const cx = 63.5, cy = 63.5;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist >= 63.0) return [0, 0, 0, 0];

  // Outer dark ring
  if (dist >= 56.0 && dist <= 62.0) {
    return [40, 42, 52, 220]; // Dark slate stone ring
  }
  // Rune track (dist 44..55)
  if (dist >= 44.0 && dist <= 55.0) {
    const angle = Math.atan2(dy, dx);
    const runeDot = (Math.sin(angle * 8) > 0.85); // 8 glowing rune nodes
    if (runeDot) {
      return [255, 205, 70, 240]; // Glowing rune
    }
    return [24, 26, 34, 180]; // Inner dark stone path
  }
  // Inner metallic rim
  if (dist >= 40.0 && dist <= 43.0) {
    return [160, 130, 60, 220]; // Brass/gold rim
  }
  // Translucent dark center
  if (dist < 40.0) {
    const fade = dist / 40.0;
    return [15, 18, 25, Math.floor(fade * 120)];
  }

  return [0, 0, 0, 0];
});
fs.writeFileSync(path.join(outDir, 'joystick_base.png'), joyBasePng);

// -------------------------------------------------------------
// 2. JOYSTICK THUMB GEM (64x64)
// Glowing Ruby/Cyan Crystal Knob
// -------------------------------------------------------------
const joyThumbPng = createPng(64, 64, (x, y) => {
  const cx = 31.5, cy = 31.5;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist >= 31.0) return [0, 0, 0, 0];

  // Brass bevel ring
  if (dist >= 26.0 && dist <= 30.0) {
    return [210, 170, 60, 255];
  }
  if (dist >= 24.0 && dist < 26.0) {
    return [70, 50, 20, 255]; // Shadow groove
  }

  // Gem face (faceted highlight)
  if (dist < 24.0) {
    const lightAngle = Math.atan2(dy + 8, dx + 8);
    const highlight = Math.max(0, -Math.sin(lightAngle));
    const r = Math.min(255, Math.floor(40 + highlight * 180));
    const g = Math.min(255, Math.floor(140 + highlight * 115));
    const b = Math.min(255, Math.floor(220 + highlight * 35));
    return [r, g, b, 245];
  }

  return [0, 0, 0, 0];
});
fs.writeFileSync(path.join(outDir, 'joystick_thumb.png'), joyThumbPng);

// -------------------------------------------------------------
// 3. GOTHIC ACTION BUTTON (96x96)
// Stone plate button with golden rim & cross swords engraving
// -------------------------------------------------------------
const btnActionPng = createPng(96, 96, (x, y) => {
  const cx = 47.5, cy = 47.5;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist >= 47.0) return [0, 0, 0, 0];

  // Outer gold rim
  if (dist >= 42.0 && dist <= 46.5) {
    const shade = (dy > 0) ? 140 : 230;
    return [shade, Math.floor(shade * 0.75), 40, 255];
  }
  // Dark bevel
  if (dist >= 39.0 && dist < 42.0) {
    return [30, 22, 18, 255];
  }
  // Iron plate center
  if (dist < 39.0) {
    // Engraved crossed swords
    const isSword1 = Math.abs(dx - dy) <= 1.8 && dist <= 24.0;
    const isSword2 = Math.abs(dx + dy) <= 1.8 && dist <= 24.0;
    if (isSword1 || isSword2) {
      return [255, 235, 140, 255]; // Glowing gold blades icon
    }
    // Dark gothic stone background
    const baseVal = Math.floor(42 + (dy / 40.0) * 15);
    return [baseVal, baseVal + 3, baseVal + 8, 240];
  }

  return [0, 0, 0, 0];
});
fs.writeFileSync(path.join(outDir, 'button_action.png'), btnActionPng);

// -------------------------------------------------------------
// 4. GOTHIC HP/MP BAR FRAME (200x24)
// Stone filigree bar frame
// -------------------------------------------------------------
const barFramePng = createPng(200, 24, (x, y) => {
  const isBorder = (x <= 2 || x >= 197 || y <= 2 || y >= 21);
  const isCorner = ((x <= 4 || x >= 195) && (y <= 4 || y >= 19));

  if (isCorner) {
    return [240, 190, 60, 255]; // Gold filigree corner studs
  }
  if (isBorder) {
    return [90, 75, 50, 255]; // Antique bronze border
  }
  return [20, 20, 26, 220]; // Inner dark recess
});
fs.writeFileSync(path.join(outDir, 'bar_frame.png'), barFramePng);

console.log('Generated Gothic HUD texture set!');

