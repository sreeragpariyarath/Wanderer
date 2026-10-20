import { WORLD } from './config';
import type { Frame } from './frame';
import { seededRandom, smoothStep } from './math';
import type { RenderState } from './state';
export function renderSky(
  s: Pick<RenderState, 'shootingStars' | 'time' | 'vehicle'>,
  frame: Frame,
): void {
  const { ctx, w, h, X, N } = frame;
  if (N > 0.01) {
    const mx = w * 0.76,
      my = h * 0.17 + (1 - N) * 70;
    const gl = ctx.createRadialGradient(mx, my, 20, mx, my, 120);
    gl.addColorStop(0, `rgba(241,230,200,${0.2 * N})`);
    gl.addColorStop(1, 'rgba(241,230,200,0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.arc(mx, my, 120, 0, 7);
    ctx.fill();
    ctx.globalAlpha = N;
    ctx.fillStyle = '#efe4c6';
    ctx.beginPath();
    ctx.arc(mx, my, 32, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#d9cba3';
    for (const [cx, cy, cr] of [
      [-10, -8, 6],
      [9, 6, 4.5],
      [-4, 13, 3],
      [12, -12, 2.5],
    ]) {
      ctx.beginPath();
      ctx.arc(mx + cx, my + cy, cr, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = '#efe4c6';
    for (let k = 0; k < 28; k++) {
      const an = (k / 28) * 6.283 + s.time * 0.03;
      ctx.globalAlpha = N * 0.35;
      ctx.beginPath();
      ctx.arc(mx + Math.cos(an) * 48, my + Math.sin(an) * 48, 1.3, 0, 7);
      ctx.fill();
    }
    ctx.lineCap = 'round';
    for (const shooting of s.shootingStars) {
      const x = shooting.x * w,
        y = shooting.y * h,
        gr = ctx.createLinearGradient(
          x,
          y,
          x - shooting.vx * 0.15,
          y - shooting.vy * 0.15,
        );
      gr.addColorStop(0, 'rgba(255,250,235,1)');
      gr.addColorStop(1, 'rgba(255,250,235,0)');
      ctx.globalAlpha = N * Math.min(1, shooting.life * 2);
      ctx.strokeStyle = gr;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - shooting.vx * 0.15, y - shooting.vy * 0.15);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  const sunA =
    (s.vehicle && s.vehicle.started ? 1 : 0) *
    smoothStep(6550, 6800, X) *
    (1 - smoothStep(7100, 7450, X));
  if (sunA > 0.01) {
    const mx = w * 0.76,
      my = h * 0.17 + (1 - sunA) * 70;
    ctx.globalAlpha = sunA;
    ctx.fillStyle = '#e9b45a';
    ctx.beginPath();
    ctx.arc(mx, my, 26, 0, 7);
    ctx.fill();
    for (let k = 0; k < 36; k++) {
      const an = (k / 36) * 6.283 + s.time * 0.15,
        rr = 40 + (k % 2) * 7;
      ctx.globalAlpha = sunA * 0.7;
      ctx.beginPath();
      ctx.arc(mx + Math.cos(an) * rr, my + Math.sin(an) * rr, 1.5, 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
export function renderStars(
  s: Pick<RenderState, 'particleColors' | 'stars' | 'time'>,
  frame: Frame,
): void {
  const { ctx, cam, w, h, nightA } = frame;
  // night stars
  if (nightA > 0)
    for (const star of s.stars) {
      const sx = (((star.x * w * 1.5 - cam * 0.15) % w) + w) % w,
        sy = star.y * h;
      ctx.globalAlpha =
        nightA *
        (0.3 + 0.5 * Math.abs(Math.sin(s.time * (0.5 + star.s) + star.s * 20)));
      ctx.fillStyle =
        star.s > 0.7
          ? s.particleColors[1]
          : star.s > 0.4
            ? s.particleColors[2]
            : s.particleColors[0];
      const r = 1 + star.s * 2.5;
      ctx.fillRect(sx, sy, r, r);
    }
}
export function renderRain(
  s: Pick<RenderState, 'character' | 'rain' | 'rainColor' | 'time'>,
  frame: Frame,
): void {
  const { ctx, cam, SY, w, h, X } = frame;
  // rain over river
  const rainA =
    smoothStep(WORLD.bridgeStart + 200, WORLD.bridgeStart + 500, X) *
    (1 - smoothStep(WORLD.waterStart, WORLD.waterStart + 150, X));
  if (rainA > 0) {
    ctx.save();
    ctx.strokeStyle = s.rainColor;
    ctx.lineWidth = 1;
    const n = Math.floor(s.rain.length * rainA);
    for (let j = 0; j < n; j++) {
      const r = s.rain[j];
      const y = ((r.y + s.time * (0.9 + r.sp * 0.6)) % 1) * (h + 40) - 20,
        x =
          ((((r.x * (w + 80) - y * 0.12 - s.character.x * 0.15) % (w + 80)) +
            w +
            80) %
            (w + 80)) -
          40;
      ctx.globalAlpha = rainA * (0.25 + r.sp * 0.25);
      ctx.beginPath();
      ctx.moveTo(x, y);
      // Long, softly slanted streaks like the design's rain.
      ctx.lineTo(x - 5, y + 16 + r.sp * 12);
      ctx.stroke();
    }
    ctx.lineWidth = 1;
    for (let j = 0; j < 14 * rainA; j++) {
      const life = (s.time * 1.3 + j * 0.37) % 1,
        wx =
          6850 +
          seededRandom(j * 11 + Math.floor(s.time * 1.3 + j * 0.37)) * 1550,
        sx = wx - cam;
      if (sx < -20 || sx > w + 20) continue;
      ctx.globalAlpha = rainA * (1 - life) * 0.7;
      ctx.beginPath();
      ctx.ellipse(
        sx,
        SY(WORLD.waterY + 1),
        2 + life * 12,
        1 + life * 3,
        0,
        0,
        7,
      );
      ctx.stroke();
      ctx.globalAlpha = rainA * (1 - life) * 0.35;
      ctx.beginPath();
      ctx.ellipse(
        sx,
        SY(WORLD.waterY + 1),
        1 + life * 6,
        0.5 + life * 1.5,
        0,
        0,
        7,
      );
      ctx.stroke();
    }
    ctx.restore();
  }
}
