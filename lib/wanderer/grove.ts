import { dot, dotDome, dotLine, withAlpha } from './dots';
import type { Frame } from './frame';
import { seededRandom, smoothStep } from './math';
import { renderHaze } from './mist';
import type { RenderState } from './state';
import { terrainHeight } from './terrain';

type GroveScenery = Pick<RenderState, 'character' | 'reducedMotion' | 'time'>;

export const GROVE = { start: 10900, arch: 13250 } as const;

const CAP = ['#c9a6d6', '#ddbde4', '#e9cfe6', '#b894c8'] as const;
const LEAF = ['#5f7f45', '#7f9a52', '#9fb15f', '#c9b45a', '#4c6b3c'] as const;
const GLOW = '#ffd98a';

function groveVisibility(X: number): number {
  return smoothStep(10500, 11100, X);
}

function scaleFor(frame: Frame): number {
  return Math.max(0.7, Math.min(1.3, frame.h / 800));
}

// A tall misty rock pillar with a green crown and hanging vines.
function renderPillar(
  ctx: CanvasRenderingContext2D,
  x: number,
  ground: number,
  width: number,
  height: number,
  seed: number,
  alpha: number,
): void {
  const top = ground - height;
  for (let y = top; y < ground; y += 5) {
    const spread = width * (0.42 + 0.25 * ((y - top) / height));
    for (let px = x - spread; px <= x + spread; px += 5) {
      const id = seed + Math.round(y) * 7 + Math.round(px);
      if (seededRandom(id) < 0.35) continue;
      ctx.fillStyle = seededRandom(id + 1) > 0.5 ? '#b9b2c9' : '#cfc8d9';
      ctx.globalAlpha = alpha * (0.35 + seededRandom(id + 2) * 0.35);
      ctx.fillRect(px, y, 2.2, 2.2);
    }
  }
  for (let c = 0; c < 4; c++) {
    const cx = x + (c - 1.5) * width * 0.32,
      cy = top - 4 - seededRandom(seed + c * 13) * 10,
      rad = width * (0.24 + seededRandom(seed + c * 17) * 0.12);
    for (let d = 0; d < rad * 3; d++) {
      const a = seededRandom(seed + c * 31 + d) * 6.283,
        rr = Math.sqrt(seededRandom(seed + c * 37 + d)) * rad;
      ctx.fillStyle = d % 3 ? '#a7b996' : '#c6d1ad';
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillRect(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 2.2, 2.2);
    }
  }
  ctx.fillStyle = '#93a77f';
  for (let v = 0; v < 6; v++) {
    const vx = x - width / 2 + seededRandom(seed + v * 3) * width,
      len = height * (0.15 + seededRandom(seed + v * 5) * 0.35);
    for (let y = 0; y < len; y += 5) {
      ctx.globalAlpha = alpha * 0.55 * (1 - y / len);
      dot(ctx, vx + Math.sin(y * 0.08 + v) * 1.5, top + 4 + y, 1.2);
    }
  }
}

function renderStillGrove(frame: Frame, gy: number): void {
  const { w, h } = frame;
  for (let i = 0; i < 9; i++) {
    const x = w * (0.18 + i * 0.09 + seededRandom(i + 11000) * 0.04),
      width = w * (0.035 + seededRandom(i + 11010) * 0.03),
      height = h * (0.18 + seededRandom(i + 11020) * 0.2);
    renderPillar(frame.ctx, x, gy - h * 0.04, width, height, 11030 + i * 97, 1);
  }
  renderHaze(frame, gy, 0.6, 0.3);
  renderHaze(frame, gy, 0.3, 0.12);
}

// Frozen backdrop: a soft sun, misty pillars and fog behind the grove.
export function renderGroveBackdrop(s: GroveScenery, frame: Frame): void {
  const { ctx, w, h, X, col } = frame,
    fade = groveVisibility(X);
  if (fade <= 0.01) return;
  const gy = frame.SY(terrainHeight(s.character.x, X)) + 2,
    sunX = w * 0.62,
    sunY = h * 0.3,
    glow = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 120);
  glow.addColorStop(0, withAlpha('#ffd98a', 0.4 * fade));
  glow.addColorStop(1, withAlpha('#ffd98a', 0));
  ctx.globalAlpha = 1;
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 120, sunY - 120, 240, 240);
  ctx.fillStyle = withAlpha('#f9d98c', 0.75 * fade);
  dot(ctx, sunX, sunY, 32);
  const baseY = Math.round(h * 0.72);
  if (frame.layer)
    frame.layer(
      'grove',
      (o) => renderStillGrove({ ...frame, ctx: o }, baseY),
      fade,
      gy - baseY,
    );
  else {
    ctx.save();
    ctx.globalAlpha = fade;
    renderStillGrove(frame, gy);
    ctx.restore();
  }
  const time = s.reducedMotion ? 0 : s.time;
  ctx.strokeStyle = col.mut;
  ctx.lineWidth = 1.1;
  ctx.globalAlpha = 0.55 * fade;
  for (let i = 0; i < 2; i++) {
    const bx = w * (0.55 + i * 0.03) + Math.sin(time * 0.3 + i) * 20,
      by = h * (0.35 + i * 0.03),
      flap = 3 + Math.sin(time * 4 + i * 2) * 2;
    ctx.beginPath();
    ctx.moveTo(bx - 7, by - flap);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + 7, by - flap);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// A glowing mushroom: cream stem, warm gills under a dotted lavender cap.
function renderMushroom(
  ctx: CanvasRenderingContext2D,
  x: number,
  ground: number,
  size: number,
  seed: number,
  fade: number,
  pulse: number,
): void {
  const capW = size,
    capH = size * 0.58,
    stemH = size * 0.95,
    stemW = size * 0.16,
    capY = ground - stemH;
  const halo = ctx.createRadialGradient(x, capY + capH * 0.3, 4, x, capY, size);
  halo.addColorStop(0, withAlpha(GLOW, (0.45 + pulse * 0.1) * fade));
  halo.addColorStop(1, withAlpha(GLOW, 0));
  ctx.globalAlpha = 1;
  ctx.fillStyle = halo;
  ctx.fillRect(x - size, capY - size, size * 2, size * 2);
  const stem = ctx.createLinearGradient(x - stemW, 0, x + stemW, 0);
  stem.addColorStop(0, withAlpha('#f3e4c4', 0.95 * fade));
  stem.addColorStop(0.5, withAlpha('#fff6df', 0.95 * fade));
  stem.addColorStop(1, withAlpha('#e6d1a8', 0.95 * fade));
  ctx.fillStyle = stem;
  ctx.beginPath();
  ctx.moveTo(x - stemW * 1.3, ground);
  ctx.quadraticCurveTo(
    x - stemW * 0.7,
    ground - stemH * 0.5,
    x - stemW * 0.8,
    capY,
  );
  ctx.lineTo(x + stemW * 0.8, capY);
  ctx.quadraticCurveTo(
    x + stemW * 0.7,
    ground - stemH * 0.5,
    x + stemW * 1.3,
    ground,
  );
  ctx.closePath();
  ctx.fill();
  // Warm gills radiating under the cap.
  ctx.strokeStyle = '#e8b85a';
  ctx.lineWidth = 1;
  for (let g = 0; g <= 22; g++) {
    const t = g / 22 - 0.5;
    ctx.globalAlpha = (0.55 + pulse * 0.2) * fade;
    ctx.beginPath();
    ctx.moveTo(x + t * stemW * 1.5, capY + capH * 0.18);
    ctx.lineTo(x + t * capW * 1.85, capY + capH * 0.05);
    ctx.stroke();
  }
  // Dotted dome cap with pale spots.
  const gap = Math.max(3.4, size / 26);
  for (let row = 0; row * gap < capH; row++) {
    const y = capY - row * gap,
      reach = capW * Math.sqrt(1 - Math.pow((row * gap) / capH, 2));
    for (let dx = -reach; dx <= reach; dx += gap) {
      const id = seed + row * 53 + Math.round(dx);
      ctx.fillStyle =
        seededRandom(id) > 0.9
          ? '#fbf3fb'
          : CAP[Math.floor(seededRandom(id + 1) * 4)];
      ctx.globalAlpha = (0.75 + seededRandom(id + 2) * 0.25) * fade;
      dot(ctx, x + dx + (row % 2) * gap * 0.5, y, gap * 0.4);
    }
  }
  ctx.fillStyle = withAlpha(GLOW, 0.9 * fade);
  for (let i = 0; i < 18; i++) {
    const t = seededRandom(seed + i * 9) - 0.5;
    ctx.globalAlpha = (0.5 + pulse * 0.3) * fade;
    dot(ctx, x + t * capW * 1.8, capY + capH * 0.1, 1.4);
  }
}

// A round dotted canopy blob (no flat base, unlike a dome).
function canopy(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  seed: number,
  fade: number,
): void {
  const gap = Math.max(5, radius / 7),
    count = Math.round((radius * radius * 3.1) / (gap * gap));
  for (let i = 0; i < count; i++) {
    const reach = radius * Math.sqrt((i + 0.5) / count),
      angle = i * 2.39996 + (seededRandom(seed + i) - 0.5) * 0.6,
      warm = seededRandom(seed + i * 3) > 0.82;
    ctx.fillStyle = warm
      ? '#d9b44e'
      : LEAF[Math.floor(seededRandom(seed + i * 5) * 5)];
    ctx.globalAlpha = (0.7 + seededRandom(seed + i * 7) * 0.3) * fade;
    dot(
      ctx,
      cx + Math.cos(angle) * reach,
      cy + Math.sin(angle) * reach * 0.9,
      gap * (0.3 + seededRandom(seed + i * 11) * 0.18),
    );
  }
}

function renderTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  ground: number,
  size: number,
  seed: number,
  fade: number,
): void {
  ctx.fillStyle = '#7a5f45';
  ctx.globalAlpha = 0.85 * fade;
  dotLine(ctx, x, ground, x - size * 0.06, ground - size * 0.85, 4, 2.4, seed);
  dotLine(
    ctx,
    x - size * 0.04,
    ground - size * 0.55,
    x + size * 0.32,
    ground - size * 0.95,
    4,
    1.5,
    seed + 1,
  );
  dotLine(
    ctx,
    x - size * 0.05,
    ground - size * 0.65,
    x - size * 0.3,
    ground - size * 1.05,
    4,
    1.5,
    seed + 2,
  );
  canopy(
    ctx,
    x - size * 0.28,
    ground - size * 1.05,
    size * 0.38,
    seed + 10,
    fade,
  );
  canopy(
    ctx,
    x + size * 0.3,
    ground - size * 1.0,
    size * 0.36,
    seed + 20,
    fade,
  );
  canopy(ctx, x, ground - size * 1.3, size * 0.42, seed + 30, fade);
}

function renderArch(
  ctx: CanvasRenderingContext2D,
  x: number,
  ground: number,
  k: number,
  fade: number,
  pulse: number,
): void {
  const width = 120 * k,
    height = 190 * k,
    top = ground - height;
  const light = ctx.createRadialGradient(
    x,
    ground - height * 0.4,
    8,
    x,
    ground - height * 0.4,
    height,
  );
  light.addColorStop(0, withAlpha('#fff1c2', (0.85 + pulse * 0.1) * fade));
  light.addColorStop(0.5, withAlpha(GLOW, 0.35 * fade));
  light.addColorStop(1, withAlpha(GLOW, 0));
  ctx.globalAlpha = 1;
  ctx.fillStyle = light;
  ctx.fillRect(x - height, top - height * 0.3, height * 2, height * 1.4);
  ctx.fillStyle = '#a99c86';
  for (const side of [-1, 1])
    for (let y = ground; y > top + width * 0.5; y -= 9)
      for (let c = 0; c < 3; c++) {
        ctx.globalAlpha = (0.7 + seededRandom(y + c + side) * 0.3) * fade;
        ctx.fillRect(x + side * (width * 0.5 + c * 7) - 3, y - 7, 6, 7);
      }
  for (let a = 0; a <= 24; a++) {
    const t = Math.PI * (a / 24);
    for (let ring = 0; ring < 3; ring++) {
      const r = width * 0.5 + ring * 7;
      ctx.globalAlpha = (0.7 + seededRandom(a * 3 + ring) * 0.3) * fade;
      ctx.fillRect(
        x - Math.cos(t) * r - 3,
        top + width * 0.5 - Math.sin(t) * r - 3,
        6,
        6,
      );
    }
  }
  ctx.fillStyle = '#6f8f4a';
  for (let v = 0; v < 60; v++) {
    const t = seededRandom(v + 11500) * Math.PI,
      r = width * 0.5 + 14,
      len = 10 + seededRandom(v + 11510) * 50;
    for (let y = 0; y < len; y += 6) {
      ctx.globalAlpha = 0.7 * fade * (1 - y / len);
      dot(
        ctx,
        x - Math.cos(t) * r,
        top + width * 0.5 - Math.sin(t) * r + y,
        1.8,
      );
    }
  }
  ctx.fillStyle = '#d8ccb6';
  for (let st = 0; st < 5; st++) {
    ctx.globalAlpha = 0.8 * fade;
    ctx.fillRect(
      x - width * 0.6 - st * 18 * k,
      ground - st * 6 * k,
      width * 1.2 + st * 36 * k,
      5 * k,
    );
  }
}

const MUSHROOMS: ReadonlyArray<readonly [number, number]> = [
  [11080, 70],
  [11300, 190],
  [11520, 60],
  [11760, 110],
  [12060, 210],
  [12380, 80],
  [12620, 150],
  [12960, 90],
];
const TREES = [11000, 11650, 12250, 12850];

// The glowing grove itself, anchored to the world in front of the backdrop.
export function renderGrove(s: GroveScenery, frame: Frame): void {
  const { ctx, cam, w, X } = frame,
    fade = groveVisibility(X);
  if (fade <= 0.01) return;
  const k = scaleFor(frame),
    time = s.reducedMotion ? 0 : s.time,
    groundAt = (x: number) => frame.SY(terrainHeight(s.character.x, x)) + 2,
    visible = (x: number, pad: number) => x - cam > -pad && x - cam < w + pad;
  for (const [n, x] of TREES.entries())
    if (visible(x, 200))
      renderTree(ctx, x - cam, groundAt(x), 150 * k, 11600 + n * 31, fade);
  if (visible(GROVE.arch, 300))
    renderArch(
      ctx,
      GROVE.arch - cam,
      groundAt(GROVE.arch),
      k,
      fade,
      Math.sin(time * 1.4) * 0.5 + 0.5,
    );
  for (const [n, [x, size]] of MUSHROOMS.entries())
    if (visible(x, size * 1.4 * k))
      renderMushroom(
        ctx,
        x - cam,
        groundAt(x),
        size * k,
        11700 + n * 43,
        fade,
        Math.sin(time * 1.2 + n) * 0.5 + 0.5,
      );
  // Boulders, tiny glowing mushrooms, flowers and grass along the path.
  for (let wx = GROVE.start - 300; wx < GROVE.arch + 200; wx += 22) {
    if (!visible(wx, 60)) continue;
    const x = wx - cam,
      g = groundAt(wx),
      r = seededRandom(wx * 0.13);
    if (r > 0.94)
      dotDome(
        ctx,
        x,
        g + 6,
        (24 + r * 30) * k,
        (16 + r * 18) * k,
        wx,
        ['#6e6a72', '#8e8a92'],
        [0.85 * fade, 0.7 * fade],
        0.4,
        4,
        1.8,
      );
    else if (r > 0.82) {
      const sx = 9 * k;
      ctx.fillStyle = withAlpha('#f3e4c4', 0.95 * fade);
      ctx.fillRect(x - 1.5, g - sx, 3, sx);
      ctx.fillStyle = withAlpha(GLOW, 0.5 * fade);
      dot(ctx, x, g - sx, sx * 1.4);
      ctx.fillStyle = withAlpha('#f6e6d0', 0.95 * fade);
      dot(ctx, x, g - sx, sx * 0.6);
    } else if (r > 0.6) {
      ctx.fillStyle = ['#b79bd3', '#ffffff', '#e8c46a'][Math.floor(r * 30) % 3];
      ctx.globalAlpha = 0.9 * fade;
      dot(ctx, x, g - (10 + r * 14) * k, 2.2 * k);
    }
    ctx.strokeStyle = LEAF[Math.floor(r * 5)];
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.75 * fade;
    for (let b = 0; b < 5; b++) {
      const lean = (b / 4 - 0.5) * 1.1,
        height = (8 + seededRandom(wx + b) * 14) * k;
      ctx.beginPath();
      ctx.moveTo(x + b * 2, g);
      ctx.lineTo(
        x + b * 2 + Math.sin(lean) * height,
        g - Math.cos(lean) * height,
      );
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}
