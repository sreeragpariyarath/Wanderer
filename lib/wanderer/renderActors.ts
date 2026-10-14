import type WandererEngine from '../WandererEngine';
import type { RenderPalette, ScreenY } from './types';

export function renderCar(this: WandererEngine, ctx: CanvasRenderingContext2D, cam: number, SY: ScreenY, w: number, col: RenderPalette): void {
  const C = this.car, sx = C.x - cam, rv = this.introDone ? 1 : Math.min(1, (this.intro.reveal || 0) / 700);
  if (rv <= 0) return;
  for (const p of this.puffs) { ctx.globalAlpha = p.life * 0.5 * rv; ctx.fillStyle = col.dot; ctx.beginPath(); ctx.arc(p.x - cam, SY(p.y), p.r * 0.6, 0, 7); ctx.fill(); }
  if (sx < -160 || sx > w + 160) { ctx.globalAlpha = 1; return; }
  const gy = SY(this.g(C.x)), ang = Math.atan2(this.g(C.x + 50) - this.g(C.x - 50), 100);
  const bump = Math.abs(C.v) > 5 ? Math.sin(this.t * 22) * 0.8 * Math.min(1, Math.abs(C.v) / 400) : (C.in ? Math.sin(this.t * 30) * 0.3 : 0);
  ctx.save(); ctx.translate(sx, gy); ctx.rotate(ang); ctx.scale(1.45, 1.45);
  ctx.globalAlpha = rv; ctx.lineWidth = 1.6 / 1.45; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.save(); ctx.translate(0, bump - 1);
  { const N2 = this.nightV || 0;
    if (N2 > 0.02) { const gr = ctx.createLinearGradient(68, 0, 270, 0); gr.addColorStop(0, `rgba(242,210,122,${0.5 * N2})`); gr.addColorStop(1, 'rgba(242,210,122,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(68, -30); ctx.lineTo(270, -56); ctx.lineTo(270, 8); ctx.lineTo(68, -24); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgba(242,210,122,${0.35 * N2})`; ctx.beginPath(); ctx.arc(67.5, -27, 7, 0, 7); ctx.fill();
      ctx.fillStyle = `rgba(224,80,58,${0.35 * N2})`; ctx.beginPath(); ctx.arc(-66, -27, 6, 0, 7); ctx.fill(); } }
  ctx.fillStyle = col.bg; ctx.strokeStyle = col.ink;
  ctx.beginPath();
  ctx.moveTo(-66, -14); ctx.quadraticCurveTo(-69, -24, -66, -31); ctx.quadraticCurveTo(-62, -37, -50, -38); ctx.lineTo(-44, -39);
  ctx.bezierCurveTo(-38, -58, -26, -62, -10, -62); ctx.lineTo(10, -62); ctx.bezierCurveTo(20, -62, 26, -54, 34, -42);
  ctx.bezierCurveTo(46, -40, 62, -38, 68, -32); ctx.quadraticCurveTo(72, -25, 70, -14);
  ctx.lineTo(59, -14); ctx.arc(44, -14, 15, 0, Math.PI, true); ctx.lineTo(-27, -14); ctx.arc(-42, -14, 15, 0, Math.PI, true); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-39, -41); ctx.bezierCurveTo(-34, -54, -26, -57, -13, -57); ctx.lineTo(-6, -57); ctx.lineTo(-6, -41); ctx.closePath();
  ctx.moveTo(-1, -41); ctx.lineTo(-1, -57); ctx.lineTo(8, -57); ctx.bezierCurveTo(16, -57, 22, -51, 28, -42); ctx.closePath();
  ctx.stroke();
  ctx.globalAlpha = rv * 0.35; ctx.beginPath(); ctx.moveTo(-28, -44); ctx.lineTo(-22, -53); ctx.moveTo(14, -44); ctx.lineTo(19, -51); ctx.stroke(); ctx.globalAlpha = rv;
  ctx.beginPath(); ctx.moveTo(-3.5, -41); ctx.lineTo(-3.5, -20); ctx.quadraticCurveTo(-3.5, -16, 0, -16);
  ctx.moveTo(31, -41); ctx.quadraticCurveTo(32, -28, 28, -18);
  ctx.moveTo(2, -35); ctx.lineTo(8, -35); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(29, -42); ctx.quadraticCurveTo(31, -48, 37, -45); ctx.lineTo(35, -42); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = col.mut;
  ctx.beginPath(); ctx.moveTo(67, -16); ctx.lineTo(74, -16); ctx.moveTo(-63, -16); ctx.lineTo(-70, -16); ctx.stroke(); ctx.restore();
  ctx.fillStyle = this.acc;
  for (let x = -60; x <= 64; x += 5.5) { if ((x > -58 && x < -26) || (x > 28 && x < 60) || true) { ctx.globalAlpha = rv * 0.85; ctx.beginPath(); ctx.arc(x, -31.5, 1.1, 0, 7); ctx.fill(); } }
  ctx.globalAlpha = rv;
  ctx.fillStyle = '#d9a35b'; ctx.beginPath(); ctx.ellipse(67.5, -27, 2, 3.2, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c0725e'; ctx.beginPath(); ctx.ellipse(-66, -27, 1.6, 3.4, 0, 0, 7); ctx.fill();
  if (C.in) {
    ctx.strokeStyle = col.ink;
    ctx.beginPath(); ctx.arc(10, -47, 4.5, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4.5, -49); ctx.quadraticCurveTo(10, -56.5, 15.5, -49); ctx.lineTo(18.5, -49); ctx.stroke();
    ctx.strokeStyle = this.acc; ctx.beginPath(); ctx.moveTo(6, -41.5); ctx.lineTo(14, -41.5); ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = col.ink;
  for (const wx of [-42, 44]) {
    ctx.fillStyle = col.bg; ctx.beginPath(); ctx.arc(wx, -11, 11, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col.dot; ctx.globalAlpha = rv * 0.5; ctx.beginPath(); ctx.arc(wx, -11, 5, 0, 7); ctx.fill(); ctx.globalAlpha = rv; ctx.stroke();
    ctx.beginPath(); for (let k = 0; k < 5; k++) { const an = C.rot + k * 1.2566; ctx.moveTo(wx + Math.cos(an) * 5, -11 + Math.sin(an) * 5); ctx.lineTo(wx + Math.cos(an) * 8.5, -11 + Math.sin(an) * 8.5); } ctx.stroke();
    ctx.fillStyle = col.ink; ctx.beginPath(); ctx.arc(wx, -11, 1.2, 0, 7); ctx.fill();
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

export function renderFigure(this: WandererEngine, ctx: CanvasRenderingContext2D, x: number, gy: number, C: RenderPalette): void {
  const s = this.sit, ph = this.phase, moving = Math.abs(this.v) > 4 && this.vy === 0;
  const amp = moving ? Math.min(1.5, Math.abs(this.v) / 170) : 0;
  const lean = Math.max(0, Math.abs(this.v) - 170) / 250 * 0.18;
  const bob = Math.abs(Math.sin(ph)) * 2 * amp;
  ctx.save(); ctx.translate(x, gy); ctx.rotate(lean * this.face); ctx.scale(this.face, 1);
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const Lg = 22, hipY = -2 * Lg + 2 - bob + s * 30, neckY = hipY - 34, headY = neckY - 13;
  const air = this.vy !== 0;
  const ik = (fx: number, fy: number) => {
    const dx = fx, dy = fy - hipY, d = Math.min(Lg * 2 - 0.01, Math.hypot(dx, dy));
    const base = Math.atan2(dy, dx), off = Math.acos(d / (2 * Lg));
    const ka = base - off;
    const kx = Math.cos(ka) * Lg, ky = hipY + Math.sin(ka) * Lg;
    ctx.beginPath(); ctx.moveTo(0, hipY); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.lineTo(fx + 6, fy); ctx.stroke();
  };
  const gait = (p: number): [number, number] => { const stride = 13 * amp, c = Math.cos(p); return [Math.sin(p) * stride, -(c > 0 ? c * 7 * amp : 0)]; };
  if (s > 0.5) { ik(24, 0); ik(28, 0); }
  else if (air) { ik(10, hipY + 34); ik(-6, hipY + 38); }
  else { const a = gait(ph), b = gait(ph + Math.PI); ik(a[0], a[1]); ik(b[0], b[1]); }
  ctx.beginPath(); ctx.moveTo(-3, neckY); ctx.quadraticCurveTo(-9, hipY - 10, -8, hipY + 4); ctx.lineTo(8, hipY + 4); ctx.quadraticCurveTo(9, hipY - 10, 3, neckY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(3, neckY); ctx.lineTo(-7, hipY - 6); ctx.stroke();
  ctx.strokeRect(-14, hipY - 10, 8, 9);
  const arm = (a: number) => { const ex = Math.sin(a) * 13, ey = neckY + 4 + Math.cos(a) * 13; ctx.beginPath(); ctx.moveTo(0, neckY + 4); ctx.lineTo(ex, ey); ctx.lineTo(ex + Math.sin(a + 0.4) * 12, ey + Math.cos(a + 0.4) * 12); ctx.stroke(); };
  if (s > 0.5) { ctx.beginPath(); ctx.moveTo(0, neckY + 4); ctx.lineTo(10, neckY + 16); ctx.lineTo(18, hipY - 8); ctx.stroke(); }
  else if (air) { arm(2.4); arm(-2.2); }
  else if (this.wave > 0) {
    arm(0.05);
    const wv = this.wave, sh = [0, neckY + 4], el = [6 + 4 * wv, neckY + 4 - 12 * wv + (1 - wv) * 13];
    const fa = -Math.PI / 2 + Math.sin(this.t * 14) * 0.45 * wv, hx = el[0] + Math.cos(fa) * 12 * wv + (1 - wv) * 2, hy = el[1] + Math.sin(fa) * 12 * wv + (1 - wv) * 12;
    ctx.beginPath(); ctx.moveTo(sh[0], sh[1]); ctx.lineTo(el[0], el[1]); ctx.lineTo(hx, hy); ctx.stroke();
  }
  else { arm(Math.sin(ph + Math.PI) * 0.45 * amp); arm(Math.sin(ph) * 0.45 * amp); }
  ctx.strokeStyle = this.acc;
  const flutter = Math.sin(this.t * 6) * 3 * (0.3 + amp);
  ctx.beginPath(); ctx.moveTo(-4, neckY); ctx.lineTo(4, neckY); ctx.moveTo(-3, neckY + 1); ctx.quadraticCurveTo(-12, neckY + 2 + flutter, -20 - amp * 6, neckY + 6 - flutter); ctx.stroke();
  ctx.strokeStyle = C.ink;
  ctx.beginPath(); ctx.arc(0, headY, 9, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-10, headY - 3); ctx.quadraticCurveTo(0, headY - 18, 10, headY - 3); ctx.lineTo(16, headY - 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(4, headY + 1, 0.9, 0, 7); ctx.fillStyle = C.ink; ctx.fill();
  ctx.restore();
}
