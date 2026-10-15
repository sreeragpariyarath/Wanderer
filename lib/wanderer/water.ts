import type { Frame } from './frame';
import { seededRandom, smoothStep } from './math';
import type { RenderState } from './state';

export function renderWater(
  s: Pick<RenderState, 'time' | 'waterColor'>,
  frame: Frame,
): void {
  const { ctx, cam, SY, w, D } = frame;
  // water
  if (cam + w > 6800 && cam < 8600) {
    ctx.fillStyle = s.waterColor;
    for (
      let wx = Math.max(6800, Math.floor(cam / 7) * 7);
      wx < Math.min(8560, cam + w);
      wx += 7
    ) {
      const edge =
        smoothStep(6800, 6920, wx) * (1 - smoothStep(8440, 8560, wx));
      for (let k = 0; k < 16; k++) {
        const i = Math.round(wx / 7) + k * 131,
          rr = seededRandom(i);
        if (rr < 0.15 + k * 0.03) continue;
        const dep =
          k === 0 ? 0 : Math.pow(k / 16, 1.3) * 150 + seededRandom(i * 7) * 8;
        const y = SY(
          76 +
            dep +
            Math.sin(s.time * 1.4 + wx * 0.02 + k) * (k === 0 ? 2.5 : 1.2),
        );
        ctx.globalAlpha =
          edge * (k === 0 ? 0.85 : 0.65 - k * 0.032) * (1 - D * 0.4);
        const r =
          (k === 0 ? 1.8 : 1.2) + seededRandom(i * 3) * (k === 0 ? 2.4 : 3);
        const sh = seededRandom(i * 5 + 1);
        ctx.fillStyle =
          sh > 0.7
            ? '#3d6fa8'
            : sh > 0.4
              ? '#5b8fc7'
              : sh > 0.15
                ? '#86b0dc'
                : '#b5d0ec';
        ctx.beginPath();
        ctx.arc(wx - cam + Math.sin(s.time * 0.6 + k + wx) * 3, y, r, 0, 7);
        ctx.fill();
      }
    }
  }
}

import type { SceneEvent } from './character';
import { WORLD } from './config';
/** A crossing event does not alter motion; swimming is intentionally absent. */
export function waterCrossing(
  previousX: number,
  previousY: number,
  x: number,
  y: number,
): SceneEvent | null {
  if (previousY >= WORLD.waterY || y < WORLD.waterY) return null;
  const fraction = (WORLD.waterY - previousY) / (y - previousY);
  const crossingX = previousX + (x - previousX) * fraction;
  return crossingX > WORLD.waterStart && crossingX < WORLD.waterEnd
    ? { type: 'splash', x: crossingX, y: WORLD.waterY }
    : null;
}
