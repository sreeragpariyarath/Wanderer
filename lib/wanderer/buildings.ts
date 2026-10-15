import { seededRandom, smoothStep } from './math';
import type { RenderState } from './state';
import { terrainHeight } from './terrain';
import type { RenderPalette, ScreenY } from './types';
export function renderCity(
  s: Pick<
    RenderState,
    | 'accent'
    | 'backgroundBuildings'
    | 'buildings'
    | 'character'
    | 'intro'
    | 'introDone'
    | 'nightIntensity'
    | 'time'
    | 'villageColors'
  >,
  ctx: CanvasRenderingContext2D,
  cam: number,
  SY: ScreenY,
  w: number,
  col: RenderPalette,
): void {
  const X = s.character.x,
    rv = s.introDone ? 1 : Math.min(1, (s.intro.reveal || 0) / 700);
  if (rv <= 0 || cam > 3900) return;
  const cityA = 1 - smoothStep(3300, 3900, X),
    gyB = SY(terrainHeight(s.character.x, X)) + 2;
  const dl = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    step: number,
    r: number,
    seed: number,
    cols?: string[],
  ) => {
    const d = Math.hypot(x2 - x1, y2 - y1),
      n = Math.max(1, Math.floor(d / step));
    for (let i = 0; i <= n; i++) {
      const t = i / n,
        q = seededRandom(seed + i * 1.7);
      if (cols) ctx.fillStyle = cols[Math.floor(q * cols.length)];
      ctx.beginPath();
      ctx.arc(
        x1 + (x2 - x1) * t,
        y1 + (y2 - y1) * t,
        r * (0.75 + q * 0.5),
        0,
        7,
      );
      ctx.fill();
    }
  };
  if (cityA > 0) {
    ctx.fillStyle = col.dot;
    for (const b of s.backgroundBuildings) {
      const sx = b.x - cam * 0.55;
      if (sx > w + 10 || sx + b.w < -10) continue;
      const H = Math.min(b.h, gyB - 130),
        top = gyB - H;
      ctx.globalAlpha = 0.28 * cityA * rv;
      dl(sx, gyB, sx, top, 9, 1.3, b.seed);
      dl(sx, top, sx + b.w, top, 9, 1.3, b.seed + 50);
      dl(sx + b.w, top, sx + b.w, gyB, 9, 1.3, b.seed + 99);
    }
  }
  for (const b of s.buildings) {
    const sx = b.x - cam;
    if (sx > w + 20 || sx + b.w < -40) continue;
    const gy = SY(terrainHeight(s.character.x, b.x + b.w / 2));
    const rise = smoothStep(w + 40, w - 260, sx + b.w * 0.5),
      e = 1 - Math.pow(1 - rise, 3);
    const fullH = Math.min(b.h, gy - 130),
      H = fullH * e;
    if (H < 4) continue;
    const top = gy - H,
      hue = s.villageColors[b.seed % 5],
      cols = [hue, hue, col.mut];
    ctx.globalAlpha = 0.8 * rv;
    dl(sx, gy, sx, top, 7, 1.6, b.seed, cols);
    dl(sx + b.w, gy, sx + b.w, top, 7, 1.6, b.seed + 40, cols);
    dl(sx - 4, top, sx + b.w + 4, top, 7, 1.6, b.seed + 80, cols);
    if (b.roof === 2) {
      dl(
        sx + b.w * 0.25,
        top,
        sx + b.w * 0.25,
        top - 16,
        7,
        1.4,
        b.seed + 120,
        cols,
      );
      dl(
        sx + b.w * 0.25,
        top - 16,
        sx + b.w * 0.75,
        top - 16,
        7,
        1.4,
        b.seed + 130,
        cols,
      );
      dl(
        sx + b.w * 0.75,
        top - 16,
        sx + b.w * 0.75,
        top,
        7,
        1.4,
        b.seed + 140,
        cols,
      );
    }
    if (b.roof === 1 && e > 0.97) {
      ctx.fillStyle = col.mut;
      dl(sx + b.w * 0.3, top, sx + b.w * 0.3, top - 34, 6, 1.1, b.seed + 150);
      ctx.globalAlpha = rv * (Math.sin(s.time * 3 + b.seed) > 0 ? 1 : 0.3);
      ctx.fillStyle = '#c0725e';
      ctx.beginPath();
      ctx.arc(sx + b.w * 0.3, top - 38, 2.4, 0, 7);
      ctx.fill();
      ctx.globalAlpha = 0.8 * rv;
    }
    const colsN = Math.max(2, Math.floor((b.w - 16) / 24)),
      cw = (b.w - 16) / colsN;
    for (let rr = 0; ; rr++) {
      const wy = top + 18 + rr * 30;
      if (wy + 12 > gy - 40) break;
      for (let c = 0; c < colsN; c++) {
        const wx = sx + 8 + c * cw + cw / 2,
          id = b.seed + rr * 13 + c;
        const lit =
          Math.abs(b.x + 8 + c * cw - X) < 100 ||
          seededRandom(id + Math.floor(s.time * 0.25 + seededRandom(id) * 4)) >
            0.84 - 0.5 * (s.nightIntensity || 0);
        if (lit && s.nightIntensity > 0.02) {
          ctx.globalAlpha = 0.22 * s.nightIntensity * rv;
          ctx.fillStyle = '#f2d27a';
          ctx.fillRect(wx - 7, wy - 5, 14, 17);
        }
        ctx.fillStyle = lit ? s.accent : col.dot;
        ctx.globalAlpha = (lit ? 0.9 : 0.55) * rv;
        for (const [ox, oy] of [
          [-3, 0],
          [3, 0],
          [-3, 7],
          [3, 7],
        ]) {
          ctx.beginPath();
          ctx.arc(wx + ox, wy + oy, 1.5, 0, 7);
          ctx.fill();
        }
      }
    }
    if (H > 50) {
      ctx.globalAlpha = 0.8 * rv;
      ctx.fillStyle = col.mut;
      const dx = sx + b.w / 2;
      dl(dx - 8, gy, dx - 8, gy - 26, 6, 1.3, b.seed + 200);
      dl(dx - 8, gy - 26, dx + 8, gy - 26, 6, 1.3, b.seed + 210);
      dl(dx + 8, gy - 26, dx + 8, gy, 6, 1.3, b.seed + 220);
      if (b.shop) {
        ctx.fillStyle = b.aw === '#f1ebe0' ? s.accent : hue;
        dl(sx + 4, gy - 38, sx + b.w - 4, gy - 38, 6, 1.6, b.seed + 230, [
          hue,
          s.accent,
        ]);
      }
    }
  }
  ctx.globalAlpha = 1;
}
