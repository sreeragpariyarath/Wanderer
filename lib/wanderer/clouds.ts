import type { Frame } from './frame';
import { seededRandom, smoothStep } from './math';
import type { RenderState } from './state';
import type { CloudPoint } from './types';
export function createCloudPoints(seed: number): CloudPoint[] {
  const pts: CloudPoint[] = [];
  for (let i = 0; i < 90; i++) {
    const a = seededRandom(seed + i * 3),
      b = seededRandom(seed + i * 3 + 1),
      c = seededRandom(seed + i * 3 + 2);
    pts.push({
      x: (a - 0.5) * 240,
      y: (b - 0.5) * 60 * (1 - Math.abs(a - 0.5) * 1.4),
      r: 0.8 + c * 2.2,
      c,
    });
  }
  return pts;
}

export function renderClouds(
  s: Pick<RenderState, 'clouds' | 'time'>,
  frame: Frame,
): void {
  const { ctx, cam, w, h, col, X } = frame;
  // meadow clouds
  const cloudA = 1 - smoothStep(6400, 6900, X);
  if (cloudA > 0)
    for (const cl of s.clouds) {
      const sx = cl.x - cam * 0.5 + Math.sin(s.time * 0.1 + cl.x) * 20;
      if (sx < -200 || sx > w + 200) continue;
      ctx.fillStyle = col.dot;
      for (const p of cl.pts) {
        ctx.globalAlpha = (0.18 + p.c * 0.25) * cloudA;
        ctx.beginPath();
        ctx.arc(sx + p.x, h * cl.y + p.y, p.r, 0, 7);
        ctx.fill();
      }
    }
}
