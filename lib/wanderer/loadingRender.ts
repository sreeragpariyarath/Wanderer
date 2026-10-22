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
  renderIntroSky(s, ctx, w, ctx.canvas.clientHeight || 800);
  renderIntroFlowers(s, ctx, cam, SY);
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
    ctx.globalAlpha = d.t ? 0.92 : 0.45 + d.c * 0.45;
    ctx.fillStyle = d.t
      ? (d.x * 7.3 + d.yy) % 3 < 1
        ? '#9b7c64'
        : (d.x * 7.3 + d.yy) % 3 < 2
          ? '#b3957a'
          : '#c9ae92'
      : d.c < 0.18
        ? '#d9c08a'
        : d.c < 0.38
          ? '#b9c9a8'
          : d.c < 0.6
            ? '#8fa77f'
            : d.c < 0.8
              ? '#6f8c5f'
              : '#55704a';
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
  const rn = Math.floor(Lr / 7),
    cosT = Math.cos(th),
    sinT = Math.sin(th);
  // Two ropes, one at each end of the seat.
  for (const off of [-13, 14])
    for (let i = 0; i <= rn; i++) {
      const u = i / rn;
      ctx.beginPath();
      ctx.arc(
        px + off * cosT * 0.6 + (sx + off * cosT - (px + off * cosT * 0.6)) * u,
        py + (sy - off * sinT - py) * u,
        1.1,
        0,
        7,
      );
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

// A soft peach sun, a dotted cloud, birds and drifting specks, as in the design.
function renderIntroSky(
  s: RenderState,
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  const sunX = w * 0.25,
    sunY = h * 0.3,
    r = Math.max(48, w * 0.04),
    glow = ctx.createRadialGradient(sunX, sunY, r * 0.4, sunX, sunY, r * 2.2);
  glow.addColorStop(0, 'rgba(255, 214, 160, 0.35)');
  glow.addColorStop(1, 'rgba(255, 214, 160, 0)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - r * 2.2, sunY - r * 2.2, r * 4.4, r * 4.4);
  const disc = ctx.createLinearGradient(0, sunY - r, 0, sunY + r);
  disc.addColorStop(0, 'rgba(255, 218, 170, 0.85)');
  disc.addColorStop(1, 'rgba(255, 232, 205, 0.25)');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(sunX, sunY, r, 0, 7);
  ctx.fill();
  // Dotted cloud drifting over the left of the sun.
  for (let row = 0; row < 7; row++)
    for (let c = -16 + row; c <= 16 - row; c++) {
      const x = sunX - r * 0.9 + c * 9,
        y = sunY + r * 0.15 - row * 8;
      ctx.globalAlpha = 0.3 + seededRandom(row * 41 + c) * 0.4;
      ctx.fillStyle = seededRandom(row * 17 + c) > 0.5 ? '#d7b98f' : '#c9c2b6';
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, 7);
      ctx.fill();
    }
  const time = s.reducedMotion ? 0 : s.time;
  ctx.strokeStyle = '#6d5a4c';
  ctx.lineWidth = 1.3;
  for (let i = 0; i < 3; i++) {
    const bx = w * (0.32 + i * 0.12) + Math.sin(time * 0.4 + i) * 14,
      by = h * (0.34 + (i % 2) * 0.08) + Math.cos(time * 0.5 + i) * 6,
      flap = 3 + Math.sin(time * 4 + i * 2) * 2.5;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(bx - 7, by - flap);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + 7, by - flap);
    ctx.stroke();
  }
  for (let i = 0; i < 14; i++) {
    const x = w * seededRandom(i + 5300),
      y =
        h * (0.15 + seededRandom(i + 5310) * 0.5) +
        Math.sin(time * 0.6 + i) * 6;
    ctx.globalAlpha = 0.35 + seededRandom(i + 5320) * 0.45;
    ctx.fillStyle = i % 3 ? '#d9a35b' : '#7f9a6a';
    ctx.beginPath();
    ctx.arc(x, y, 1.5 + seededRandom(i + 5330) * 1.6, 0, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Little wildflower tufts along the ledge.
function renderIntroFlowers(
  s: RenderState,
  ctx: CanvasRenderingContext2D,
  cam: number,
  SY: ScreenY,
): void {
  const p = s.introProgress;
  for (let i = 0; i < 9; i++) {
    const wx = -900 + i * 105 + seededRandom(i + 5400) * 40,
      appear = Math.max(0, Math.min(1, (p * 1.3 - (wx + 1000) / 1100) / 0.25));
    if (appear <= 0) continue;
    const x = wx - cam,
      ground = SY(-150);
    for (let st = 0; st < 4; st++) {
      const lean = (st - 1.5) * 0.25,
        height = (14 + seededRandom(i * 9 + st) * 16) * appear;
      ctx.globalAlpha = 0.75 * appear;
      ctx.fillStyle = '#8a7a5c';
      for (let k = 0; k < height; k += 3) {
        ctx.beginPath();
        ctx.arc(x + st * 4 + Math.sin(lean) * k, ground - k, 0.8, 0, 7);
        ctx.fill();
      }
      ctx.fillStyle = st % 2 ? '#d9a35b' : '#c47a4f';
      ctx.beginPath();
      ctx.arc(x + st * 4 + Math.sin(lean) * height, ground - height, 2.2, 0, 7);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
