import { WORLD } from './config';
import { dot, dotDome, withAlpha } from './dots';
import type { Frame } from './frame';
import { seededRandom, smoothStep } from './math';
import {
  renderHaze,
  renderMistLayer,
  type MistLayer,
  type MistPalette,
} from './mist';
import type { RenderState } from './state';
import { terrainHeight } from './terrain';

type BridgeScenery = Pick<RenderState, 'character' | 'reducedMotion' | 'time'>;

const MIST: MistPalette = {
  leaves: ['#a9b8c4', '#b8c6d0', '#c3ced6'],
  trunk: '#b4b9bd',
};
const MIST_LAYERS: readonly MistLayer[] = [
  {
    seed: 9100,
    size: 0.05,
    alpha: 0.42,
    spacing: [1.5, 2.4],
    lift: 0.06,
    small: true,
  },
  {
    seed: 9200,
    size: 0.07,
    alpha: 0.5,
    spacing: [1.8, 2.9],
    lift: 0.03,
    small: true,
  },
  {
    seed: 9300,
    size: 0.085,
    alpha: 0.6,
    spacing: [1.4, 2.2],
    lift: 0,
    small: false,
  },
];

function bridgeVisibility(X: number): number {
  return smoothStep(6500, 7000, X) * (1 - smoothStep(8200, 8600, X));
}

// Still parts of the lake view: hills, misty shore trees, fog and far water.
function renderStillLake(frame: Frame, gy: number): void {
  const { ctx, w, h } = frame,
    shore = gy + h * 0.03;
  for (const [n, [cx, rx, ry]] of [
    [0.05, 0.13, 0.15],
    [0.24, 0.1, 0.12],
    [0.62, 0.12, 0.13],
    [0.8, 0.11, 0.17],
    [0.97, 0.12, 0.14],
  ].entries())
    dotDome(
      ctx,
      w * cx,
      shore - h * 0.12,
      w * rx,
      h * ry,
      9000 + n * 41,
      ['#9fb0bd', '#b8c6d0'],
      [0.5, 0.42],
      0.4,
    );
  renderHaze(frame, shore - h * 0.12, 0.3, 0.12);
  const [far, distant, near] = MIST_LAYERS as [MistLayer, MistLayer, MistLayer];
  renderMistLayer(frame, shore, 1, far, MIST);
  renderHaze(frame, shore, 0.35, 0.25);
  renderMistLayer(frame, shore, 1, distant, MIST);
  renderHaze(frame, shore, 0.25, 0.14);
  // The right bank has taller, nearer trees, as in the design.
  renderMistLayer(frame, shore, 1, near, MIST, frame.w * 0.55);
  renderHaze(frame, shore, 0.12, 0.06);
}

// The shoreline: a sandy beach sloping down to the right from the bridge's
// first pier, as in the design. Shared by the lake and the beach foreground.
function bankGeometry(frame: Frame, _gy: number) {
  // The lake and the river share one surface, so there is a single water line.
  const shore = frame.SY(WORLD.waterY),
    top = WORLD.bridgeStart - 20 - frame.cam,
    bottom = top + frame.h * 0.62;
  return {
    shore,
    top,
    at: (t: number) => ({
      x: top + (bottom - top) * t,
      y: shore + (frame.h - shore) * t,
    }),
  };
}

// The lake starts where the water does: land before the bridge stays land,
// and a warm sandy beach runs down into the water.
function renderLake(frame: Frame, gy: number, fade: number): void {
  const { ctx, cam, w, h, col } = frame,
    { shore, top, at } = bankGeometry(frame, gy);
  if (top - w * 1.2 >= w) return;
  // Warm sand under the path, strongest near the water.
  const sandLeft = Math.max(0, top - w * 1.1),
    sand = ctx.createLinearGradient(0, shore - h * 0.02, 0, h);
  sand.addColorStop(0, withAlpha('#f3e7d2', 0.55 * fade));
  sand.addColorStop(1, withAlpha('#ead7b5', 0.85 * fade));
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(sandLeft, shore - h * 0.02);
  ctx.lineTo(Math.min(w, top), shore - h * 0.02);
  for (let i = 0; i <= 20; i++) {
    const p = at(i / 20);
    ctx.lineTo(Math.min(w + 400, p.x + 30), p.y);
  }
  ctx.lineTo(sandLeft, h);
  ctx.closePath();
  ctx.clip();
  ctx.globalAlpha = 1;
  ctx.fillStyle = sand;
  ctx.fillRect(sandLeft, shore - h * 0.02, w + 400 - sandLeft, h);
  // Fade the sand out towards the forest so the land blends in.
  ctx.globalCompositeOperation = 'destination-out';
  const fadeOut = ctx.createLinearGradient(
    sandLeft,
    0,
    Math.max(sandLeft + 1, top - w * 0.15),
    0,
  );
  fadeOut.addColorStop(0, 'rgba(0,0,0,1)');
  fadeOut.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fadeOut;
  ctx.fillRect(
    sandLeft,
    shore - h * 0.02,
    Math.max(1, top - w * 0.15 - sandLeft),
    h,
  );
  ctx.restore();
  if (top >= w) return;
  // Water to the right of the beach line.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(top, shore);
  ctx.lineTo(w, shore);
  ctx.lineTo(w, h);
  for (let i = 20; i >= 0; i--) {
    const p = at(i / 20);
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.clip();
  const lake = ctx.createLinearGradient(0, shore, 0, h);
  lake.addColorStop(0, withAlpha('#cfe0ec', 0.9 * fade));
  lake.addColorStop(0.3, withAlpha('#b4d0e6', 0.8 * fade));
  lake.addColorStop(1, withAlpha('#9cc2e0', 0.75 * fade));
  ctx.globalAlpha = 1;
  ctx.fillStyle = lake;
  ctx.fillRect(top, shore, w - top, h - shore);
  ctx.fillStyle = col.bg;
  for (let i = 0; i < 90; i++) {
    const x = WORLD.bridgeStart + seededRandom(i + 9410) * 2800 - cam,
      y = shore + 6 + seededRandom(i + 9400) * (h - shore) * 0.6,
      len = 10 + seededRandom(i + 9420) * 40;
    if (x > w) continue;
    ctx.globalAlpha = 0.5 * fade;
    ctx.fillRect(x, y, len, 1.2);
  }
  ctx.restore();
  // Wet sand edge and a soft dotted waterline along the beach.
  for (let i = 0; i <= 60; i++) {
    const p = at(i / 60);
    ctx.fillStyle = '#d9c39a';
    ctx.globalAlpha = 0.5 * fade;
    dot(ctx, p.x - 6, p.y, 3);
    ctx.fillStyle = '#7d9db8';
    ctx.globalAlpha = 0.45 * fade;
    dot(ctx, p.x + 2, p.y, 1.4);
  }
  // Pebbles scattered over the sand.
  ctx.fillStyle = '#8a8580';
  for (let i = 0; i < 40; i++) {
    const t = seededRandom(i + 9450),
      p = at(t),
      x = p.x - 20 - seededRandom(i + 9460) * 220;
    if (x < -10 || x > w + 10) continue;
    ctx.globalAlpha = (0.3 + seededRandom(i + 9470) * 0.35) * fade;
    dot(
      ctx,
      x,
      p.y + seededRandom(i + 9480) * 20,
      1.2 + seededRandom(i + 9490) * 2,
    );
  }
  ctx.globalAlpha = 1;
}

// Frozen backdrop: sun, hills, misty shore and lake stay still behind the bridge.
export function renderBridgeBackdrop(s: BridgeScenery, frame: Frame): void {
  const { ctx, w, h, X, col } = frame,
    fade = bridgeVisibility(X);
  if (fade <= 0.01) return;
  const gy = frame.SY(terrainHeight(s.character.x, X)) + 2,
    sunX = w * 0.75,
    sunY = h * 0.32,
    radius = Math.max(40, w * 0.035),
    glow = ctx.createRadialGradient(
      sunX,
      sunY,
      radius * 0.3,
      sunX,
      sunY,
      radius * 2.6,
    );
  glow.addColorStop(0, withAlpha('#f6d58a', 0.32 * fade));
  glow.addColorStop(0.45, withAlpha('#f6d58a', 0.1 * fade));
  glow.addColorStop(1, withAlpha('#f6d58a', 0));
  ctx.globalAlpha = 1;
  ctx.fillStyle = glow;
  ctx.fillRect(
    sunX - radius * 2.6,
    sunY - radius * 2.6,
    radius * 5.2,
    radius * 5.2,
  );
  ctx.fillStyle = withAlpha('#f6d58a', 0.32 * fade);
  dot(ctx, sunX, sunY, radius);
  const baseY = Math.round(h * 0.72),
    paint = (target: CanvasRenderingContext2D, y: number) =>
      renderStillLake({ ...frame, ctx: target }, y);
  if (frame.layer)
    frame.layer('bridge', (o) => paint(o, baseY), fade, gy - baseY);
  else {
    ctx.save();
    ctx.globalAlpha = fade;
    paint(ctx, gy);
    ctx.restore();
  }
  renderLake(frame, gy, fade);
  const time = s.reducedMotion ? 0 : s.time;
  ctx.strokeStyle = col.mut;
  ctx.lineWidth = 1.1;
  ctx.globalAlpha = 0.5 * fade;
  for (let i = 0; i < 4; i++) {
    const span = w + 240,
      bx = ((seededRandom(i + 9500) * span + time * (5 + i * 2)) % span) - 120,
      by = h * (0.2 + seededRandom(i + 9510) * 0.15) + Math.sin(time + i) * 4,
      flap = 3 + Math.sin(time * 4 + i * 2) * 2;
    ctx.beginPath();
    ctx.moveTo(bx - 6, by - flap);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + 6, by - flap);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function renderReeds(
  ctx: CanvasRenderingContext2D,
  x: number,
  ground: number,
  k: number,
  seed: number,
  alpha: number,
): void {
  for (let i = 0; i < 9; i++) {
    const height = (40 + seededRandom(seed + i) * 70) * k,
      lean = (seededRandom(seed + i * 3) - 0.4) * 0.6,
      baseX = x + (seededRandom(seed + i * 5) - 0.5) * 60 * k,
      tipX = baseX + Math.sin(lean) * height,
      tipY = ground - Math.cos(lean) * height;
    ctx.strokeStyle = '#3d3a33';
    ctx.lineWidth = 1.1 * k;
    ctx.globalAlpha = 0.75 * alpha;
    ctx.beginPath();
    ctx.moveTo(baseX, ground);
    ctx.quadraticCurveTo(
      baseX + Math.sin(lean) * height * 0.2,
      ground - height * 0.6,
      tipX,
      tipY,
    );
    ctx.stroke();
    ctx.fillStyle = '#c99a4e';
    ctx.globalAlpha = 0.9 * alpha;
    for (let d = 0; d < 4; d++)
      dot(ctx, tipX + d * 0.8 * k, tipY + d * 3 * k, (2.2 - d * 0.35) * k);
  }
}

// Reeds and small rocks along the beach and the path's end. They follow the
// shoreline in the world, so they scroll in with it instead of popping up.
export function renderBridgeForeground(s: BridgeScenery, frame: Frame): void {
  const { ctx, w, h, X } = frame,
    fade = bridgeVisibility(X) * (s.character.mode === 'swimming' ? 0 : 1);
  if (fade <= 0.01) return;
  const k = Math.max(0.7, Math.min(1.3, h / 800)),
    gy = frame.SY(terrainHeight(s.character.x, X)) + 2,
    { at } = bankGeometry(frame, gy);
  for (let n = 0; n < 7; n++) {
    const t = 0.05 + n * 0.14 + seededRandom(n + 9640) * 0.05,
      p = at(t);
    if (p.x < -120 || p.x > w + 120) continue;
    if (n % 2 === 0)
      dotDome(
        ctx,
        p.x - 10 * k,
        p.y + 4,
        16 * k,
        9 * k,
        9600 + n,
        ['#7c7c78', '#9a9a95'],
        [0.75 * fade, 0.6 * fade],
        0.4,
        3,
        1.3,
      );
    renderReeds(
      ctx,
      p.x - 4 * k,
      p.y,
      k * (0.55 + seededRandom(n + 9660) * 0.25),
      9650 + n * 7,
      fade,
    );
  }
  ctx.globalAlpha = 1;
}
