import type { Frame } from './frame';
import { seededRandom, smoothStep } from './math';
import type { RenderState } from './state';
import { terrainHeight } from './terrain';
export function renderMountains(
  s: Pick<RenderState, 'character' | 'mountains'>,
  frame: Frame,
): void {
  const { ctx, cam, SY, w, X, N } = frame;
  {
    const mA = smoothStep(3000, 3600, X) * (1 - smoothStep(6400, 6900, X));
    if (mA > 0.01) {
      const base = SY(terrainHeight(s.character.x, X)) + 4;
      s.mountains.forEach((pts, L) => {
        const par = L ? 0.3 : 0.42,
          colr = L
            ? N > 0.5
              ? '#5d6b85'
              : '#9fb0b8'
            : N > 0.5
              ? '#4f6b5e'
              : '#7fa9a0';
        ctx.fillStyle = colr;
        for (let k = 0; k < pts.length - 1; k++) {
          const x1 = pts[k][0] - cam * par,
            x2 = pts[k + 1][0] - cam * par;
          if (x2 < -20 || x1 > w + 20) continue;
          const y1 = base - pts[k][1],
            y2 = base - pts[k + 1][1],
            d = Math.hypot(x2 - x1, y2 - y1),
            n = Math.floor(d / 8);
          for (let i = 0; i <= n; i++) {
            const t = i / n,
              q = seededRandom(k * 97 + i + L * 13);
            ctx.globalAlpha = mA * (L ? 0.35 : 0.5) * (0.6 + q * 0.4);
            ctx.beginPath();
            ctx.arc(
              x1 + (x2 - x1) * t,
              y1 + (y2 - y1) * t,
              1.3 + q * 1.2,
              0,
              7,
            );
            ctx.fill();
          }
          if (pts[k][1] > pts[k + 1][1])
            for (let i = 0; i < 10; i++) {
              const q = seededRandom(k * 31 + i + L * 7),
                q2 = seededRandom(k * 37 + i + L * 9);
              const px = x1 + (x2 - x1) * q2,
                top = y1 + (y2 - y1) * q2;
              const py = top + q * (base - top);
              ctx.globalAlpha = mA * 0.18;
              ctx.beginPath();
              ctx.arc(px, py, 1.2, 0, 7);
              ctx.fill();
            }
        }
      });
      ctx.globalAlpha = 1;
    }
  }
}
