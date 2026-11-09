import * as THREE from 'three';

const floorTextureCache = new Map<number, THREE.CanvasTexture>();
let cachedStoneWallTex: THREE.CanvasTexture | null = null;
let cachedTudorWallTex: THREE.CanvasTexture | null = null;
let cachedRoofTex: THREE.CanvasTexture | null = null;
let cachedWoodPlankTex: THREE.CanvasTexture | null = null;
let cachedCanopyStripeTex: THREE.CanvasTexture | null = null;

function createCanvasContext(size = 256): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context for procedural texture');
  }
  return { canvas, ctx };
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// Deterministic pseudo-random helper so textures always look crisp and identical
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const dynamicTextureMap = new Map<number, THREE.Texture>();
/** floorType yang gambarnya SUDAH selesai di-decode (aman dipakai shader). */
const loadedDynamicTextures = new Set<number>();

/**
 * Register dynamic texture for custom floor types (> 100) with custom tiling scale
 */
export function registerDynamicFloorTexture(
  floorType: number,
  textureUrl: string,
  repeatScale = 1.0,
  onLoaded?: () => void
): THREE.Texture {
  const existing = dynamicTextureMap.get(floorType);
  if (existing) {
    const img = existing.image as HTMLImageElement | undefined;
    if (img && typeof img.src === 'string' && img.src !== textureUrl) {
      existing.dispose();
      loadedDynamicTextures.delete(floorType);
    } else {
      existing.repeat.set(repeatScale, repeatScale);
      existing.needsUpdate = true;
      return existing;
    }
  }

  const loader = new THREE.TextureLoader();
  const tex = loader.load(
    textureUrl,
    (loadedTex) => {
      loadedTex.wrapS = THREE.RepeatWrapping;
      loadedTex.wrapT = THREE.RepeatWrapping;
      loadedTex.repeat.set(repeatScale, repeatScale);
      loadedTex.colorSpace = THREE.SRGBColorSpace;
      loadedTex.needsUpdate = true;
      loadedDynamicTextures.add(floorType);
      if (onLoaded) onLoaded();
    },
    undefined,
    (err) => {
      loadedDynamicTextures.delete(floorType);
      dynamicTextureMap.delete(floorType);
      console.error(`Failed to load dynamic floor texture (${floorType}):`, err);
    }
  );
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatScale, repeatScale);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  dynamicTextureMap.set(floorType, tex);
  return tex;
}

/**
 * Updates the tiling repetition scale (repeat.set) for an already loaded dynamic floor texture.
 */
export function updateDynamicFloorTiling(floorType: number, repeatScale: number): void {
  const tex = dynamicTextureMap.get(floorType);
  if (tex) {
    tex.repeat.set(repeatScale, repeatScale);
    tex.needsUpdate = true;
  }
}

/**
 * Generates or returns cached procedural floor texture for each floorType ID (1..8, or dynamic > 100)
 */
export function getFloorTexture(floorType: number): THREE.Texture {
  if (floorType > 100) {
    // Hanya pakai tekstur custom jika gambarnya benar-benar sudah ter-load.
    // Texture tanpa image = shader sample hitam.
    if (loadedDynamicTextures.has(floorType) && dynamicTextureMap.has(floorType)) {
      return dynamicTextureMap.get(floorType)!;
    }
    // Fallback ke cobblestone (2) selama loading / jika file hilang
    return getFloorTexture(2);
  }
  const existing = floorTextureCache.get(floorType);
  if (existing) return existing;

  const { canvas, ctx } = createCanvasContext(256);
  const rand = seededRandom(floorType * 9973 + 123);

  switch (floorType) {
    case 1: {
      // 1: Fortress Border Stone (Dark heavy ashlar slabs)
      ctx.fillStyle = '#242c3a';
      ctx.fillRect(0, 0, 256, 256);

      const rows = 4;
      const cols = 2;
      const rowH = 256 / rows;
      const colW = 256 / cols;

      for (let r = 0; r < rows; r++) {
        const offsetX = (r % 2) * (colW / 2);
        for (let c = -1; c <= cols; c++) {
          const bx = c * colW + offsetX;
          const by = r * rowH;
          const shade = 34 + Math.floor(rand() * 18);
          ctx.fillStyle = `rgb(${shade}, ${shade + 6}, ${shade + 16})`;
          ctx.fillRect(bx + 3, by + 3, colW - 6, rowH - 6);

          // Highlight bevel top-left
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
          ctx.lineWidth = 2;
          ctx.strokeRect(bx + 4, by + 4, colW - 8, rowH - 8);
        }
      }

      // Subtle stone grain
      for (let i = 0; i < 350; i++) {
        ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)';
        ctx.fillRect(rand() * 256, rand() * 256, 3, 3);
      }
      break;
    }

    case 2: {
      // 2: Medieval Cobblestone (Town road & plaza stones)
      ctx.fillStyle = '#2b323d'; // Mortar base
      ctx.fillRect(0, 0, 256, 256);

      const grid = 4;
      const cell = 256 / grid;
      const palette = ['#4b5563', '#525e6e', '#64748b', '#475569', '#5b6472'];

      for (let gy = 0; gy < grid; gy++) {
        const shiftX = (gy % 2) * (cell * 0.45);
        for (let gx = -1; gx <= grid; gx++) {
          const x = gx * cell + shiftX + (rand() - 0.5) * 6;
          const y = gy * cell + (rand() - 0.5) * 6;
          const w = cell - 7;
          const h = cell - 7;
          const color = palette[Math.floor(rand() * palette.length)] ?? '#525e6e';

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect(x + 3.5, y + 3.5, w, h, 9);
          ctx.fill();

          // Inner stone highlight
          ctx.strokeStyle = 'rgba(226, 232, 240, 0.18)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(x + 5, y + 5, w - 3, h - 3, 7);
          ctx.stroke();
        }
      }

      // Speckles
      for (let i = 0; i < 300; i++) {
        ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.12)';
        ctx.fillRect(rand() * 256, rand() * 256, 2.5, 2.5);
      }
      break;
    }

    case 3: {
      // 3: Dirt Pathway (Warm compacted earth & pebbles)
      ctx.fillStyle = '#5c4028';
      ctx.fillRect(0, 0, 256, 256);

      for (let i = 0; i < 450; i++) {
        const x = rand() * 256;
        const y = rand() * 256;
        const r = 2 + rand() * 8;
        ctx.fillStyle =
          rand() > 0.6
            ? 'rgba(120, 83, 50, 0.35)'
            : rand() > 0.3
            ? 'rgba(68, 46, 28, 0.35)'
            : 'rgba(161, 118, 76, 0.25)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Small pebbles
      for (let i = 0; i < 45; i++) {
        const px = rand() * 256;
        const py = rand() * 256;
        ctx.fillStyle = rand() > 0.5 ? '#78716c' : '#a8a29e';
        ctx.beginPath();
        ctx.ellipse(px, py, 3 + rand() * 3, 2 + rand() * 2, rand() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 4: {
      // 4: Royal Crimson Carpet (Ornate red runner with gold border)
      ctx.fillStyle = '#6b141a';
      ctx.fillRect(0, 0, 256, 256);

      // Woven fabric pattern
      ctx.strokeStyle = 'rgba(127, 29, 29, 0.65)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 256; i += 8) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 256);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(256, i);
        ctx.stroke();
      }

      // Gold ornate border & center diamond medallion
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 6;
      ctx.strokeRect(12, 12, 232, 232);

      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.strokeRect(22, 22, 212, 212);

      ctx.save();
      ctx.translate(128, 128);
      ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.strokeRect(-32, -32, 64, 64);
      ctx.restore();
      break;
    }

    case 5: {
      // 5: Mossy Ancient Ruins (Stone tiles with vibrant green moss seams)
      ctx.fillStyle = '#14532d'; // Deep moss crevices
      ctx.fillRect(0, 0, 256, 256);

      const grid = 3;
      const cell = 256 / grid;
      for (let gy = 0; gy < grid; gy++) {
        for (let gx = 0; gx < grid; gx++) {
          const x = gx * cell;
          const y = gy * cell;
          ctx.fillStyle = (gx + gy) % 2 === 0 ? '#334e4a' : '#2b423f';
          ctx.beginPath();
          ctx.roundRect(x + 6, y + 6, cell - 12, cell - 12, 8);
          ctx.fill();
        }
      }

      // Moss patches creeping over stones
      for (let i = 0; i < 80; i++) {
        const mx = rand() * 256;
        const my = rand() * 256;
        const mr = 4 + rand() * 12;
        ctx.fillStyle = rand() > 0.4 ? 'rgba(34, 197, 94, 0.35)' : 'rgba(21, 128, 61, 0.45)';
        ctx.beginPath();
        ctx.arc(mx, my, mr, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 6: {
      // 6: Lush Grass Meadow (Verdant stylized meadow with grass blade strokes)
      ctx.fillStyle = '#2d7a3e';
      ctx.fillRect(0, 0, 256, 256);

      // Soft dithered grass patches
      for (let i = 0; i < 220; i++) {
        const gx = rand() * 256;
        const gy = rand() * 256;
        const gr = 8 + rand() * 18;
        ctx.fillStyle =
          rand() > 0.5 ? 'rgba(52, 148, 70, 0.35)' : 'rgba(32, 102, 47, 0.35)';
        ctx.beginPath();
        ctx.arc(gx, gy, gr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Crisp stylized grass blades
      ctx.lineWidth = 2;
      for (let i = 0; i < 420; i++) {
        const bx = rand() * 256;
        const by = rand() * 256;
        const bh = 6 + rand() * 7;
        const lean = (rand() - 0.5) * 5;
        ctx.strokeStyle =
          rand() > 0.65 ? '#4ade80' : rand() > 0.3 ? '#22c55e' : '#15803d';
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + lean, by - bh);
        ctx.stroke();
      }
      break;
    }

    case 7: {
      // 7: River Water (Flowing blue stream with stylized foam & ripples)
      const grad = ctx.createLinearGradient(0, 0, 256, 256);
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.5, '#0ea5e9');
      grad.addColorStop(1, '#0369a1');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      // Water wave bands
      for (let y = 8; y < 256; y += 24) {
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.45)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = 0; x <= 256; x += 16) {
          const waveY = y + Math.sin((x / 256) * Math.PI * 4) * 4;
          if (x === 0) ctx.moveTo(x, waveY);
          else ctx.lineTo(x, waveY);
        }
        ctx.stroke();
      }

      // Shimmer highlights
      for (let i = 0; i < 65; i++) {
        const wx = rand() * 240;
        const wy = rand() * 250;
        const ww = 12 + rand() * 22;
        ctx.fillStyle = 'rgba(224, 242, 254, 0.38)';
        ctx.beginPath();
        ctx.roundRect(wx, wy, ww, 3, 2);
        ctx.fill();
      }
      break;
    }

    case 8: {
      // 8: Timber Wood Deck (Medieval pier & tavern oak planks)
      ctx.fillStyle = '#451a03';
      ctx.fillRect(0, 0, 256, 256);

      const planks = 6;
      const plankH = 256 / planks;
      const woodShades = ['#78350f', '#92400e', '#854d0e', '#713f12'];

      for (let p = 0; p < planks; p++) {
        const py = p * plankH;
        ctx.fillStyle = woodShades[p % woodShades.length] ?? '#78350f';
        ctx.fillRect(0, py + 2, 256, plankH - 4);

        // Wood grain lines
        ctx.strokeStyle = 'rgba(69, 26, 3, 0.35)';
        ctx.lineWidth = 1.5;
        for (let g = 0; g < 5; g++) {
          const gy = py + 6 + g * ((plankH - 10) / 5);
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(256, gy + (rand() - 0.5) * 3);
          ctx.stroke();
        }

        // Plank joint & nail heads
        const jointX = ((p * 97 + 40) % 200) + 28;
        ctx.strokeStyle = '#290f02';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(jointX, py + 2);
        ctx.lineTo(jointX, py + plankH - 2);
        ctx.stroke();

        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.arc(jointX - 6, py + 10, 2, 0, Math.PI * 2);
        ctx.arc(jointX - 6, py + plankH - 10, 2, 0, Math.PI * 2);
        ctx.arc(jointX + 6, py + 10, 2, 0, Math.PI * 2);
        ctx.arc(jointX + 6, py + plankH - 10, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    default: {
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, 256, 256);
      break;
    }
  }

  const tex = finalizeTexture(canvas, 1, 1);
  floorTextureCache.set(floorType, tex);
  return tex;
}

/**
 * Generates stackable stone block brick texture
 */
export function getStoneWallTexture(): THREE.CanvasTexture {
  if (cachedStoneWallTex) return cachedStoneWallTex;

  const { canvas, ctx } = createCanvasContext(256);
  const rand = seededRandom(777);

  ctx.fillStyle = '#27272a'; // Mortar
  ctx.fillRect(0, 0, 256, 256);

  const rows = 4;
  const cols = 3;
  const rowH = 256 / rows;
  const colW = 256 / cols;
  const stoneColors = ['#52525b', '#71717a', '#57534e', '#64748b', '#4b5563'];

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (colW * 0.5);
    for (let c = -1; c <= cols; c++) {
      const x = c * colW + offset;
      const y = r * rowH;
      const color = stoneColors[Math.floor(rand() * stoneColors.length)] ?? '#52525b';

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x + 3, y + 3, colW - 6, rowH - 6, 5);
      ctx.fill();

      // Top highlight for 3D stacked stone feel
      ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.fillRect(x + 5, y + 4, colW - 10, 4);

      // Bottom shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(x + 5, y + rowH - 8, colW - 10, 4);
    }
  }

  cachedStoneWallTex = finalizeTexture(canvas, 1, 1);
  return cachedStoneWallTex;
}

/**
 * Half-timbered medieval Tudor house wall texture
 */
export function getTudorWallTexture(): THREE.CanvasTexture {
  if (cachedTudorWallTex) return cachedTudorWallTex;

  const { canvas, ctx } = createCanvasContext(256);
  // Warm plaster background
  ctx.fillStyle = '#f5ebd6';
  ctx.fillRect(0, 0, 256, 256);

  // Timber frame beams
  ctx.fillStyle = '#451a03';
  ctx.fillRect(0, 0, 256, 18);
  ctx.fillRect(0, 120, 256, 16);
  ctx.fillRect(0, 238, 256, 18);
  ctx.fillRect(0, 0, 18, 256);
  ctx.fillRect(120, 0, 16, 256);
  ctx.fillRect(238, 0, 18, 256);

  // Diagonal Tudor cross-bracing
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(14, 14);
  ctx.lineTo(124, 124);
  ctx.moveTo(242, 14);
  ctx.lineTo(132, 124);
  ctx.stroke();

  cachedTudorWallTex = finalizeTexture(canvas, 1, 1);
  return cachedTudorWallTex;
}

/**
 * Medieval clay shingle roof texture
 */
export function getRoofShingleTexture(): THREE.CanvasTexture {
  if (cachedRoofTex) return cachedRoofTex;

  const { canvas, ctx } = createCanvasContext(256);
  ctx.fillStyle = '#7c2d12';
  ctx.fillRect(0, 0, 256, 256);

  const rows = 8;
  const rowH = 256 / rows;
  for (let r = 0; r < rows; r++) {
    const py = r * rowH;
    ctx.fillStyle = r % 2 === 0 ? '#9a3412' : '#7c2d12';
    ctx.fillRect(0, py, 256, rowH - 2);

    ctx.strokeStyle = '#431407';
    ctx.lineWidth = 2;
    for (let x = (r % 2) * 16; x < 256; x += 32) {
      ctx.beginPath();
      ctx.arc(x + 16, py + rowH - 4, 16, 0, Math.PI);
      ctx.stroke();
    }
  }

  cachedRoofTex = finalizeTexture(canvas, 2, 2);
  return cachedRoofTex;
}

/**
 * Wood plank texture for bridges, fences, and stalls
 */
export function getWoodPlankTexture(): THREE.Texture {
  if (cachedWoodPlankTex) return cachedWoodPlankTex;
  return getFloorTexture(8);
}

/**
 * Striped red & cream market stall canopy texture
 */
export function getCanopyStripeTexture(): THREE.CanvasTexture {
  if (cachedCanopyStripeTex) return cachedCanopyStripeTex;

  const { canvas, ctx } = createCanvasContext(256);
  const stripes = 8;
  const w = 256 / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#dc2626' : '#fef3c7';
    ctx.fillRect(i * w, 0, w, 256);
  }

  cachedCanopyStripeTex = finalizeTexture(canvas, 1, 1);
  return cachedCanopyStripeTex;
}

