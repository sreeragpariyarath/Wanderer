import { WORLD } from './config';
import { dot, dotDome } from './dots';
import { seededRandom } from './math';

type ScreenY = (y: number) => number;

// Visual-only bumps on the sand line. Swimming still uses riverBedY, so these
// only soften the edge and never change where the swimmer can go.
function bump(wx: number): number {
  return (
    Math.sin(wx * 0.011) * 3 +
    Math.sin(wx * 0.037 + 1.3) * 1.6 +
    Math.sin(wx * 0.0047 + 0.4) * 2.4
  );
}

// Pale sand floor under the river: a soft rim along the bed, grains that
// thin out with depth, and half-buried rocks, as in the design.
export function renderRiverSand(
  ctx: CanvasRenderingContext2D,
  cam: number,
  SY: ScreenY,
  bedY: (x: number) => number,
  left: number,
  right: number,
  h: number,
  alpha: number,
): void {
  if (right <= left) return;
  const sandTop = (wx: number) => SY(bedY(wx)) - 4 - bump(wx);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(left, h);
  for (let sx = left; sx <= right; sx += 6) ctx.lineTo(sx, sandTop(sx + cam));
  ctx.lineTo(right, sandTop(right + cam));
  ctx.lineTo(right, h);
  ctx.closePath();
  const top = SY(WORLD.waterY + 150),
    sand = ctx.createLinearGradient(0, top, 0, h);
  sand.addColorStop(0, '#f8f2e6');
  sand.addColorStop(0.35, '#f1e6cf');
  sand.addColorStop(1, '#e8d6b4');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = sand;
  ctx.fill();
  ctx.clip();
  // Light rim where the water meets the sand.
  ctx.strokeStyle = '#fbf7ee';
  ctx.lineWidth = 5;
  ctx.globalAlpha = 0.8 * alpha;
  ctx.beginPath();
  for (let sx = left; sx <= right; sx += 6) {
    const y = sandTop(sx + cam) + 2;
    if (sx === left) ctx.moveTo(sx, y);
    else ctx.lineTo(sx, y);
  }
  ctx.stroke();
  // Grains: dense near the surface of the sand, thinning deeper down.
  const colors = ['#c9a35e', '#9a958c', '#6f6a63', '#d8bf8f'];
  const first = Math.max(WORLD.bridgeStart, Math.floor((cam + left) / 3) * 3),
    last = Math.min(WORLD.waterEnd + 200, cam + right);
  for (let wx = first; wx < last; wx += 3) {
    const r = seededRandom(wx * 0.731);
    if (r < 0.45) continue;
    const depth = Math.pow(seededRandom(wx * 1.37 + 5), 2.4),
      base = sandTop(wx),
      y = base + 4 + depth * (h - base);
    ctx.fillStyle = colors[Math.floor(seededRandom(wx * 2.11) * 4)];
    ctx.globalAlpha = (0.25 + (1 - depth) * 0.45) * alpha;
    ctx.fillRect(wx - cam, y, 1.4 + r, 1.4 + r);
  }
  // Fade the sand out just past the far bank so it meets the shore softly.
  const end = WORLD.waterEnd - cam,
    fadeOut = ctx.createLinearGradient(end, 0, end + 320, 0);
  fadeOut.addColorStop(0, 'rgba(0,0,0,0)');
  fadeOut.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = 1;
  ctx.fillStyle = fadeOut;
  ctx.fillRect(end, 0, 340, h);
  ctx.restore();
  // Half-buried grey rocks along the bed.
  for (let i = 0; i < 11; i++) {
    const wx = WORLD.waterStart + 80 + i * 190 + seededRandom(i + 10100) * 110,
      x = wx - cam;
    if (x < left - 40 || x > right + 40) continue;
    const size = 9 + seededRandom(i + 10110) * 12;
    dotDome(
      ctx,
      x,
      sandTop(wx) + 4,
      size * 1.4,
      size,
      10120 + i,
      ['#8d8a85', '#a9a6a0'],
      [0.85 * alpha, 0.7 * alpha],
      0.35,
      3,
      1.4,
    );
  }
  ctx.globalAlpha = 1;
}

// Grass tufts and flowering stalks rooted in the sand, swaying gently.
export function renderRiverPlants(
  ctx: CanvasRenderingContext2D,
  cam: number,
  SY: ScreenY,
  bedY: (x: number) => number,
  left: number,
  right: number,
  time: number,
): void {
  const greens = ['#3f866f', '#5a9975', '#7fae7a', '#4c7f5c'];
  for (let wx = WORLD.waterStart + 20; wx < WORLD.waterEnd - 10; wx += 46) {
    const x = wx - cam;
    if (x < left - 40 || x > right + 40) continue;
    const seed = seededRandom(wx * 0.17);
    if (seed < 0.18) continue;
    const base = SY(bedY(wx)) - 2 - bump(wx),
      blades = 6 + Math.floor(seed * 5);
    ctx.lineWidth = 1.2;
    for (let b = 0; b < blades; b++) {
      const lean = (b / (blades - 1) - 0.5) * 1.1,
        height = 14 + seededRandom(wx + b * 7) * 26,
        sway = Math.sin(time * 1.1 + wx * 0.03 + b) * 3,
        bx = x + (b - blades / 2) * 2.2,
        tipX = bx + Math.sin(lean) * height + sway,
        tipY = base - Math.cos(lean) * height;
      ctx.strokeStyle = greens[(b + Math.floor(seed * 4)) % 4];
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(bx, base);
      ctx.quadraticCurveTo(bx + sway * 0.4, base - height * 0.55, tipX, tipY);
      ctx.stroke();
    }
    // Every few tufts, a taller flowering stalk with yellow blossoms.
    if (seed > 0.62) {
      const height = 40 + seed * 34,
        sway = Math.sin(time * 0.9 + wx * 0.02) * 4,
        tipX = x + 4 + sway,
        tipY = base - height;
      ctx.strokeStyle = '#4c7f5c';
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(x + 2, base);
      ctx.quadraticCurveTo(x + 3 + sway * 0.4, base - height * 0.5, tipX, tipY);
      ctx.stroke();
      ctx.fillStyle = seed > 0.8 ? '#e8b84a' : '#f0cf5e';
      for (let f = 0; f < 3; f++) {
        ctx.globalAlpha = 0.95;
        dot(ctx, tipX + (f - 1) * 4, tipY + f * 6, 2.6 - f * 0.4);
      }
    }
  }
  ctx.globalAlpha = 1;
}
