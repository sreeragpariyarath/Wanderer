import { WORLD } from './config';
import { dot, dotDome, dotLine, withAlpha } from './dots';
import type { Frame } from './frame';
import {
  renderHaze,
  renderMistLayer,
  type MistLayer,
  type MistPalette,
} from './mist';
import { seededRandom, smoothStep } from './math';
import type { RenderState } from './state';
import { terrainHeight } from './terrain';

type ForestScenery = Pick<
  RenderState,
  'character' | 'reducedMotion' | 'seeds' | 'time'
>;

const FOREST_START = 3450;
// The forest floor carries on past the trees, up to the start of the bridge.
const FOREST_END = WORLD.bridgeStart - 10;
const SAGE = ['#a9c2ad', '#8fb39a', '#7fa9a0'] as const;
const FOREST_MIST: MistPalette = { leaves: SAGE, trunk: '#b9a896' };
const LEAF = ['#2c5236', '#3d6e48', '#4f8a5b', '#6f9a78'] as const;

function forestVisibility(X: number): number {
  return smoothStep(3300, 3900, X) * (1 - smoothStep(6400, 6900, X));
}

function scaleFor(frame: Frame): number {
  return Math.max(0.7, Math.min(1.3, frame.h / 800));
}

function renderSun(frame: Frame, fade: number): void {
  const { ctx, w, h } = frame,
    radius = Math.max(42, w * 0.04),
    x = w * 0.25,
    y = h * 0.36,
    glow = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius * 2.8);
  glow.addColorStop(0, withAlpha('#f6d58a', 0.35 * fade));
  glow.addColorStop(0.45, withAlpha('#f6d58a', 0.1 * fade));
  glow.addColorStop(1, withAlpha('#f6d58a', 0));
  ctx.globalAlpha = 1;
  ctx.fillStyle = glow;
  ctx.fillRect(x - radius * 2.8, y - radius * 2.8, radius * 5.6, radius * 5.6);
  ctx.fillStyle = withAlpha('#f6d58a', 0.38 * fade);
  dot(ctx, x, y, radius);
}

// Far rows sit higher and fainter; the nearest row is small and crisp.
const MIST_LAYERS: readonly MistLayer[] = [
  {
    seed: 7400,
    size: 0.045,
    alpha: 0.22,
    spacing: [0.8, 1.4],
    lift: 0.1,
    small: true,
  },
  {
    seed: 7500,
    size: 0.06,
    alpha: 0.3,
    spacing: [1, 1.7],
    lift: 0.06,
    small: true,
  },
  {
    seed: 7600,
    size: 0.07,
    alpha: 0.4,
    spacing: [1.4, 2.3],
    lift: 0.03,
    small: false,
  },
  {
    seed: 7700,
    size: 0.05,
    alpha: 0.55,
    spacing: [2.4, 4],
    lift: 0,
    small: false,
  },
];

function renderStillForest(frame: Frame, gy: number, fade: number): void {
  const { ctx, w, h, col } = frame;
  // Distant dotted hills above the tree line.
  for (const [n, [cx, rx, ry]] of [
    [0.06, 0.12, 0.16],
    [0.3, 0.1, 0.11],
    [0.47, 0.11, 0.14],
    [0.66, 0.1, 0.12],
    [0.8, 0.08, 0.1],
    [0.96, 0.12, 0.16],
  ].entries())
    dotDome(
      ctx,
      w * cx,
      gy - h * 0.3,
      w * rx,
      h * ry,
      7200 + n * 37,
      [col.dot, SAGE[0]],
      [0.4 * fade, 0.45 * fade],
      0.35,
    );
  renderHaze(frame, gy - h * 0.3, 0.4, 0.12);
  const [far, distant, middle, near] = MIST_LAYERS as [
    MistLayer,
    MistLayer,
    MistLayer,
    MistLayer,
  ];
  renderMistLayer(frame, gy, fade, far, FOREST_MIST);
  renderHaze(frame, gy, 0.5);
  renderMistLayer(frame, gy, fade, distant, FOREST_MIST);
  renderHaze(frame, gy, 0.45, 0.22);
  renderMistLayer(frame, gy, fade, middle, FOREST_MIST);
  renderHaze(frame, gy, 0.32, 0.14);
  renderMistLayer(frame, gy, fade, near, FOREST_MIST);
  renderHaze(frame, gy, 0.18, 0.08);
}

// Frozen backdrop: it stays still while the forest path scrolls in front.
export function renderForestBackdrop(s: ForestScenery, frame: Frame): void {
  const { ctx, w, h, X, col } = frame,
    fade = forestVisibility(X);
  if (fade <= 0.01) return;
  const gy = frame.SY(terrainHeight(s.character.x, X)) + 2;
  renderSun(frame, fade);
  const baseY = Math.round(frame.h * 0.72);
  // Hills, mist and fog never change, so they come from the renderer's cache
  // (drawn at full strength, then faded); the ground's slope shifts them.
  const paint = (target: CanvasRenderingContext2D, alpha: number) =>
    renderStillForest(
      { ...frame, ctx: target },
      frame.layer ? baseY : gy,
      alpha,
    );
  if (frame.layer) frame.layer('forest', (o) => paint(o, 1), fade, gy - baseY);
  else paint(ctx, fade);
  // Still amber specks and a couple of slow birds.
  ctx.fillStyle = '#d9a35b';
  for (let i = 0; i < 10; i++) {
    ctx.globalAlpha = (0.35 + seededRandom(i + 7800) * 0.35) * fade;
    dot(
      ctx,
      w * seededRandom(i + 7810),
      h * (0.12 + seededRandom(i + 7820) * 0.5),
      1.6,
    );
  }
  const time = s.reducedMotion ? 0 : s.time;
  ctx.strokeStyle = col.mut;
  ctx.lineWidth = 1.1;
  ctx.globalAlpha = 0.45 * fade;
  for (let i = 0; i < 2; i++) {
    const span = w + 240,
      bx = ((seededRandom(i + 7700) * span + time * (4 + i * 2)) % span) - 120,
      by = h * (0.32 + i * 0.1) + Math.sin(time + i) * 5,
      flap = 3 + Math.sin(time * 4 + i * 2) * 2;
    ctx.beginPath();
    ctx.moveTo(bx - 6, by - flap);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + 6, by - flap);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// Dandelion seeds drifting upward: a stem under a fan of fine rays.
export function renderForestSeeds(s: ForestScenery, frame: Frame): void {
  const { ctx, cam, SY, w, h, col } = frame;
  for (const seed of s.seeds) {
    const life = (s.time * seed.sp * 0.08 + seed.off) % 1,
      sx = seed.x - cam + Math.sin(s.time + seed.off * 9) * 18 + life * 60;
    if (sx < -30 || sx > w + 30) continue;
    const sy = SY(terrainHeight(s.character.x, seed.x)) - 20 - life * h * 0.55;
    ctx.globalAlpha = Math.sin(life * Math.PI) * 0.85;
    ctx.strokeStyle = col.mut;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - 4, sy + 20);
    ctx.stroke();
    ctx.lineWidth = 0.7;
    for (let k = 0; k < 9; k++) {
      const a = -Math.PI / 2 + (k - 4) * 0.3;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(a) * 11, sy + Math.sin(a) * 11);
      ctx.stroke();
    }
    if (seed.off > 0.5) {
      ctx.fillStyle = '#d9a35b';
      dot(ctx, sx - 4, sy + 21, 1.3);
    }
  }
  ctx.globalAlpha = 1;
}

function renderGrass(
  ctx: CanvasRenderingContext2D,
  x: number,
  ground: number,
  k: number,
  seed: number,
  fade: number,
): void {
  const blades = 6 + Math.floor(seededRandom(seed) * 5);
  for (let b = 0; b < blades; b++) {
    const lean = (b / (blades - 1) - 0.5) * 1.2,
      height = (14 + seededRandom(seed + b) * 20) * k,
      curl = (seededRandom(seed + b * 3) - 0.5) * 6 * k,
      baseX = x + b * 1.8 * k,
      midX = baseX + Math.sin(lean) * height * 0.5 + curl,
      midY = ground - Math.cos(lean) * height * 0.5;
    ctx.fillStyle = LEAF[(b + Math.floor(seededRandom(seed + 9) * 4)) % 4];
    ctx.globalAlpha = 0.75 * fade;
    dotLine(ctx, baseX, ground, midX, midY, 3.4 * k, 0.9 * k, seed + b * 5);
    dotLine(
      ctx,
      midX,
      midY,
      baseX + Math.sin(lean) * height + curl * 2,
      ground - Math.cos(lean) * height,
      3.4 * k,
      0.75 * k,
      seed + b * 7,
    );
  }
}

function renderFlower(
  ctx: CanvasRenderingContext2D,
  x: number,
  ground: number,
  k: number,
  seed: number,
  fade: number,
): void {
  const heads = seededRandom(seed + 3) > 0.6 ? 2 : 1;
  for (let f = 0; f < heads; f++) {
    const height = (30 + seededRandom(seed + f * 5) * 30) * k,
      bend = (seededRandom(seed + 1 + f) - 0.5) * 12 * k + f * 6 * k,
      fluffy = seededRandom(seed + 7 + f) > 0.85;
    ctx.fillStyle = '#4f5a4c';
    ctx.globalAlpha = 0.75 * fade;
    dotLine(
      ctx,
      x,
      ground,
      x + bend,
      ground - height,
      3.4 * k,
      0.75 * k,
      seed + f,
    );
    ctx.fillStyle = fluffy
      ? '#ffffff'
      : seededRandom(seed + 2 + f) > 0.4
        ? '#d9a35b'
        : '#e8c46a';
    ctx.globalAlpha = 0.95 * fade;
    dot(ctx, x + bend, ground - height, (fluffy ? 3 : 2.4) * k);
  }
}

function renderBush(
  ctx: CanvasRenderingContext2D,
  x: number,
  ground: number,
  k: number,
  seed: number,
  fade: number,
): void {
  const rx = (30 + seededRandom(seed) * 40) * k,
    ry = (18 + seededRandom(seed + 1) * 20) * k,
    count = Math.round(rx * ry * 0.08);
  for (let i = 0; i < count; i++) {
    const angle = seededRandom(seed + i * 3) * Math.PI,
      reach = Math.sqrt(seededRandom(seed + i * 3 + 1));
    ctx.fillStyle = LEAF[Math.floor(seededRandom(seed + i * 3 + 2) * 3)];
    ctx.globalAlpha = 0.82 * fade;
    dot(
      ctx,
      x + Math.cos(angle) * reach * rx,
      ground - Math.sin(angle) * reach * ry,
      (1.4 + seededRandom(seed + i * 5) * 1.5) * k,
    );
  }
}

// World-anchored undergrowth and a dark path line in front of the trees.
export function renderForestUndergrowth(s: ForestScenery, frame: Frame): void {
  const { ctx, cam, w, h, X } = frame,
    fade = smoothStep(3300, 3900, X) * (1 - smoothStep(8200, 8600, X));
  if (fade <= 0.01) return;
  const k = scaleFor(frame),
    groundAt = (x: number) => frame.SY(terrainHeight(s.character.x, x)) + 2,
    glow = ctx.createLinearGradient(0, groundAt(X), 0, groundAt(X) + h * 0.12);
  glow.addColorStop(0, withAlpha('#f3d79a', 0.12 * fade));
  glow.addColorStop(1, withAlpha('#f3d79a', 0));
  ctx.globalAlpha = 1;
  ctx.fillStyle = glow;
  ctx.fillRect(0, groundAt(X), w, h * 0.12);
  const step = 14,
    first = Math.max(
      Math.floor(FOREST_START / step),
      Math.floor(cam / step) - 6,
    ),
    last = Math.min(
      Math.ceil(FOREST_END / step),
      Math.ceil((cam + w) / step) + 6,
    );
  for (let n = first; n <= last; n++) {
    const pick = seededRandom(n + 7900),
      x = n * step + seededRandom(n + 7950) * 8,
      sx = x - cam,
      ground = groundAt(x);
    // Low ground cover: tiny sage dots just above the path.
    ctx.fillStyle = SAGE[n % 3];
    ctx.globalAlpha = 0.5 * fade;
    dot(ctx, sx, ground - 3 * k - seededRandom(n + 7990) * 4 * k, 1.1 * k);
    // A bush roughly every 250px, skipping some along a slow wave.
    if (n % 18 === 0 && Math.sin(n * 0.11) > -0.3)
      renderBush(ctx, sx, ground, k, n * 13 + 8000, fade);
    else if (pick < 0.42) renderGrass(ctx, sx, ground, k, n * 17 + 8100, fade);
    else if (pick < 0.56) renderFlower(ctx, sx, ground, k, n * 19 + 8200, fade);
  }
  const dotStep = 11 * k,
    firstDot = Math.floor(cam / dotStep),
    lastDot = Math.ceil((cam + w) / dotStep);
  ctx.fillStyle = '#3f3a2e';
  for (let n = firstDot; n <= lastDot; n++) {
    const wx = n * dotStep;
    if (wx < FOREST_START - 200 || wx > FOREST_END) continue;
    const gy = groundAt(wx);
    ctx.globalAlpha = 0.75 * fade;
    dot(ctx, wx - cam, gy, 2.4 * k);
    ctx.globalAlpha = 0.16 * fade;
    dot(ctx, wx - cam, gy + 13 * k, 2 * k);
  }
  ctx.globalAlpha = 1;
}
