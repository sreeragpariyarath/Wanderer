import { renderFigure } from './characterRender';
import { seededRandom } from './math';
import type { RenderState } from './state';
import type { RenderPalette, ScreenY } from './types';
export function renderIntroLayer(
  s: RenderState,
  ctx: CanvasRenderingContext2D,
  cam: number,
  SY: ScreenY,
  w: number,
  col: RenderPalette,
): void {
  const I = s.intro,
    SWX = -330,
    LEDGE = -150,
    PIV = LEDGE - 215,
    Lr = 165,
    p = s.introProgress;
  if (cam > 40) return;
  // ledge (arrives with loading progress) + cliff face
  for (
    let wx = Math.max(-999, Math.floor(cam / 9) * 9);
    wx <= Math.min(0, cam + w);
    wx += 9
  ) {
    const i = Math.round(wx / 9),
      d = s.introDots[((i % 70) + 70) % 70],
      u = (wx + 1000) / 1000;
    const arrive = Math.max(0, Math.min(1, (p * 1.25 - u * 0.95) / 0.3)),
      e = 1 - Math.pow(1 - arrive, 3);
    const fx = wx - cam,
      fy = SY(LEDGE + (seededRandom(i * 7) - 0.5) * 3);
    const sc = (1 - e) * (60 + d.s * 120),
      an = d.a + s.time * 0.6;
    ctx.globalAlpha = 0.2 + e * 0.75;
    ctx.fillStyle = d.c;
    ctx.beginPath();
    ctx.arc(
      fx + Math.cos(an) * sc,
      fy + Math.sin(an) * sc * 0.6 - (1 - e) * 40,
      1.3 + d.s * 2.2 * (0.5 + e * 0.5),
      0,
      7,
    );
    ctx.fill();
  }
  if (p >= 1)
    for (let k = 1; k < 17; k++) {
      const yy = LEDGE + k * 9.4,
        jx = (seededRandom(k + 5000) - 0.5) * 8 - k * 0.6;
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = col.dot;
      ctx.beginPath();
      ctx.arc(-cam + jx, SY(yy), 1.4 + seededRandom(k + 5100) * 1.6, 0, 7);
      ctx.fill();
    }
  // tree
  for (const d of s.introTree) {
    const sway = d.t ? 0 : Math.sin(s.time * 1.2 + d.x * 0.05) * 1.5;
    ctx.globalAlpha = d.t ? 0.75 : 0.45 + d.c * 0.45;
    ctx.fillStyle = d.t
      ? '#7a6250'
      : d.c > 0.66
        ? '#2c5236'
        : d.c > 0.33
          ? '#3d6e48'
          : '#4f8a5b';
    ctx.beginPath();
    ctx.arc(d.x - cam + sway, SY(d.yy), d.r, 0, 7);
    ctx.fill();
  }
  // swing
  const th = I.A * Math.sin(I.st * 2.4),
    px = SWX - cam,
    py = SY(PIV);
  const sx = px + Lr * Math.sin(th),
    sy = py + Lr * Math.cos(th);
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#7a6250';
  const rn = Math.floor(Lr / 7);
  for (let i = 0; i <= rn; i++) {
    const u = i / rn;
    ctx.beginPath();
    ctx.arc(px + (sx - px) * u, py + (sy - py) * u, 1.1, 0, 7);
    ctx.fill();
  }
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(-th);
  if (I.onSwing)
    renderFigure(
      {
        ...s,
        character: {
          ...s.character,
          sitting: 1,
          velocityX: 0,
          velocityY: 0,
          facing: 1,
        },
      },
      ctx,
      -8,
      12,
      col,
    );
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#7a6250';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(16, 0);
  ctx.stroke();
  ctx.restore();
  for (const d of I.dust) {
    ctx.globalAlpha = Math.max(0, d.life);
    ctx.fillStyle = d.c;
    ctx.beginPath();
    ctx.arc(d.x - cam, SY(d.y), 1.8, 0, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
