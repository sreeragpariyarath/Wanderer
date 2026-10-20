import { dot, dotLine, withAlpha } from './dots';
import type { Frame } from './frame';
import { seededRandom } from './math';

// Misty background trees and fog bands shared by the frozen scene backdrops.

export function renderHaze(
  frame: Frame,
  gy: number,
  strength: number,
  depth = 0.55,
): void {
  const { ctx, w, h, col } = frame,
    top = gy - h * depth,
    haze = ctx.createLinearGradient(0, top, 0, gy);
  haze.addColorStop(0, withAlpha(col.bg, 0));
  haze.addColorStop(1, withAlpha(col.bg, strength));
  ctx.globalAlpha = 1;
  ctx.fillStyle = haze;
  ctx.fillRect(0, top, w, gy - top);
}

export interface MistPalette {
  leaves: readonly string[];
  trunk: string;
}

export interface MistLayer {
  seed: number;
  size: number;
  alpha: number;
  spacing: readonly [number, number];
  lift: number;
  small: boolean;
}

// A soft, natural misty tree on a pale trunk with one fork. Dots follow a
// jittered sunflower spiral: evenly spread, organic, and cheap every frame.
function renderMistTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  ground: number,
  radius: number,
  trunk: number,
  seed: number,
  alpha: number,
  small: boolean,
  palette: MistPalette,
): void {
  const centerY = ground - trunk - radius * 0.75,
    forkY = centerY + radius * 0.55;
  ctx.fillStyle = palette.trunk;
  ctx.globalAlpha = alpha * 0.8;
  dotLine(ctx, x, ground, x, forkY, 5, 1, seed);
  dotLine(ctx, x, forkY, x - radius * 0.35, centerY, 5, 0.8, seed + 1);
  dotLine(
    ctx,
    x,
    forkY,
    x + radius * 0.3,
    centerY - radius * 0.1,
    5,
    0.8,
    seed + 2,
  );
  const spacing = Math.max(4.2, radius / 6.5),
    count = Math.round((radius * radius * 3.4) / (spacing * spacing));
  for (let i = 0; i < count; i++) {
    const reach =
        radius *
        Math.sqrt((i + 0.5) / count) *
        (0.94 + seededRandom(seed + i) * 0.12),
      angle = i * 2.39996 + (seededRandom(seed + i * 3) - 0.5) * 0.5,
      px =
        Math.cos(angle) * reach +
        (seededRandom(seed + i * 3 + 1) - 0.5) * spacing * 0.5,
      py =
        Math.sin(angle) * reach * 1.1 +
        (seededRandom(seed + i * 3 + 2) - 0.5) * spacing * 0.5,
      r = spacing * (0.26 + seededRandom(seed + i * 7) * 0.16);
    ctx.fillStyle = palette.leaves[i % palette.leaves.length];
    ctx.globalAlpha = alpha * (0.6 + seededRandom(seed + i * 5) * 0.4);
    // Far layers use slightly smaller dots so they recede into the fog.
    dot(ctx, x + px, centerY + py, small ? r * 0.8 : r);
  }
}

// One row of misty trees across the screen, between optional x bounds.
export function renderMistLayer(
  frame: Frame,
  gy: number,
  fade: number,
  layer: MistLayer,
  palette: MistPalette,
  from = -40,
  to = frame.w + 60,
): void {
  const { ctx, h } = frame,
    [minGap, maxGap] = layer.spacing;
  let x = from + seededRandom(layer.seed) * 60,
    i = 0;
  while (x < to) {
    const id = layer.seed + i * 11,
      radius = h * layer.size * (0.6 + seededRandom(id)),
      trunk = radius * (0.8 + seededRandom(id + 1) * 1.1),
      ground = gy - h * layer.lift * seededRandom(id + 3);
    renderMistTree(
      ctx,
      x,
      ground,
      radius,
      trunk,
      id,
      layer.alpha * fade,
      layer.small,
      palette,
    );
    x += radius * (minGap + seededRandom(id + 2) * (maxGap - minGap));
    i++;
  }
}
