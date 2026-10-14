import type WandererEngine from '../WandererEngine';
import type { RenderPalette, ScreenY } from './types';

export function renderIntro(this: WandererEngine, ctx: CanvasRenderingContext2D, cam: number, SY: ScreenY, w: number, col: RenderPalette): void {
  const I = this.intro;
  const fade = I.landT == null ? 1 : 1 - Math.min(1, Math.max(0, (this.t - I.landT - 0.2) / 1.1));
  if (fade <= 0) return;
  if (fade >= 1) return this.drawIntroInner(ctx, cam, SY, w, col);
  const main = ctx.canvas, oc = this._oc || (this._oc = document.createElement('canvas'));
  if (oc.width !== main.width || oc.height !== main.height) { oc.width = main.width; oc.height = main.height; }
  const o = oc.getContext('2d');
  if (!o) return;
  o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, oc.width, oc.height); o.setTransform(ctx.getTransform());
  this.drawIntroInner(o, cam, SY, w, col);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = fade; ctx.drawImage(oc, 0, 0); ctx.restore();
}

export function renderIntroLayer(this: WandererEngine, ctx: CanvasRenderingContext2D, cam: number, SY: ScreenY, w: number, col: RenderPalette): void {
  const I = this.intro, SWX = -330, LEDGE = -150, PIV = LEDGE - 215, Lr = 165, p = this.loadP;
  if (cam > 40) return;
  if (!this.itree) {
    this.itree = [];
    for (let i = 0; i < 60; i++) { const u = this.rand(i + 4000); this.itree.push({ x: SWX - 110 + (this.rand(i + 4100) - .5) * 9, y: LEDGE - u * (LEDGE - PIV) * -1 * -1 - 0, yy: PIV + u * (LEDGE - PIV), r: 1.3 + this.rand(i + 4200) * 2, t: 1, c: 0 }); }
    for (let i = 0; i < 30; i++) { const u = i / 29; this.itree.push({ x: SWX - 110 + u * 150, yy: PIV - Math.sin(u * 3) * 5 + (this.rand(i + 4300) - .5) * 3, r: 1.2 + this.rand(i + 4400) * 1.5, t: 1, c: 0 }); }
    for (let i = 0; i < 320; i++) { const an = this.rand(i + 4500) * 6.28, rr = Math.sqrt(this.rand(i + 4600)); this.itree.push({ x: SWX - 50 + Math.cos(an) * rr * 120, yy: PIV - 18 + Math.sin(an) * rr * 40, r: 1.3 + this.rand(i + 4700) * 2.6, t: 0, c: this.rand(i + 4800) }); }
  }
  // ledge (arrives with loading progress) + cliff face
  for (let wx = Math.max(-999, Math.floor(cam / 9) * 9); wx <= Math.min(0, cam + w); wx += 9) {
    const i = Math.round(wx / 9), d = this.ldots[((i % 70) + 70) % 70], u = (wx + 1000) / 1000;
    const arrive = Math.max(0, Math.min(1, (p * 1.25 - u * 0.95) / 0.3)), e = 1 - Math.pow(1 - arrive, 3);
    const fx = wx - cam, fy = SY(LEDGE + (this.rand(i * 7) - .5) * 3);
    const sc = (1 - e) * (60 + d.s * 120), an = d.a + this.t * .6;
    ctx.globalAlpha = 0.2 + e * 0.75; ctx.fillStyle = d.c;
    ctx.beginPath(); ctx.arc(fx + Math.cos(an) * sc, fy + Math.sin(an) * sc * .6 - (1 - e) * 40, 1.3 + d.s * 2.2 * (0.5 + e * 0.5), 0, 7); ctx.fill();
  }
  if (p >= 1) for (let k = 1; k < 17; k++) { const yy = LEDGE + k * 9.4, jx = (this.rand(k + 5000) - .5) * 8 - k * 0.6; ctx.globalAlpha = 0.55; ctx.fillStyle = col.dot; ctx.beginPath(); ctx.arc(-cam + jx, SY(yy), 1.4 + this.rand(k + 5100) * 1.6, 0, 7); ctx.fill(); }
  // tree
  for (const d of this.itree) {
    const sway = d.t ? 0 : Math.sin(this.t * 1.2 + d.x * .05) * 1.5;
    ctx.globalAlpha = d.t ? 0.75 : 0.45 + d.c * 0.45;
    ctx.fillStyle = d.t ? '#7a6250' : (d.c > .66 ? '#2c5236' : d.c > .33 ? '#3d6e48' : '#4f8a5b');
    ctx.beginPath(); ctx.arc(d.x - cam + sway, SY(d.yy), d.r, 0, 7); ctx.fill();
  }
  // swing
  const th = I.A * Math.sin(I.st * 2.4), px = SWX - cam, py = SY(PIV);
  const sx = px + Lr * Math.sin(th), sy = py + Lr * Math.cos(th);
  ctx.globalAlpha = 0.85; ctx.fillStyle = '#7a6250';
  const rn = Math.floor(Lr / 7);
  for (let i = 0; i <= rn; i++) { const u = i / rn; ctx.beginPath(); ctx.arc(px + (sx - px) * u, py + (sy - py) * u, 1.1, 0, 7); ctx.fill(); }
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(-th);
  if (I.onSwing) { const sv = [this.sit, this.v, this.vy]; this.sit = 1; this.v = 0; this.vy = 0; this.face = 1; this.drawFigure(ctx, -8, 12, col); [this.sit, this.v, this.vy] = sv; }
  ctx.globalAlpha = 1; ctx.strokeStyle = '#7a6250'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(16, 0); ctx.stroke();
  ctx.restore();
  for (const d of I.dust) { ctx.globalAlpha = Math.max(0, d.life); ctx.fillStyle = d.c; ctx.beginPath(); ctx.arc(d.x - cam, SY(d.y), 1.8, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
}
