import type WandererEngine from '../WandererEngine';
import type { NumericPalette, RenderPalette, RGB, ScreenY } from './types';

export function renderCity(this: WandererEngine, ctx: CanvasRenderingContext2D, cam: number, SY: ScreenY, w: number, col: RenderPalette): void {
  const X = this.x, rv = this.introDone ? 1 : Math.min(1, (this.intro.reveal || 0) / 700);
  if (rv <= 0 || cam > 3900) return;
  const cityA = 1 - this.ss(3300, 3900, X), gyB = SY(this.g(X)) + 2;
  const dl = (x1: number, y1: number, x2: number, y2: number, step: number, r: number, seed: number, cols?: string[]) => { const d = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.floor(d / step)); for (let i = 0; i <= n; i++) { const t = i / n, q = this.rand(seed + i * 1.7); if (cols) ctx.fillStyle = cols[Math.floor(q * cols.length)]; ctx.beginPath(); ctx.arc(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, r * (0.75 + q * 0.5), 0, 7); ctx.fill(); } };
  if (cityA > 0) { ctx.fillStyle = col.dot;
    for (const b of this.back) {
      const sx = b.x - cam * 0.55; if (sx > w + 10 || sx + b.w < -10) continue;
      const H = Math.min(b.h, gyB - 130), top = gyB - H;
      ctx.globalAlpha = 0.28 * cityA * rv;
      dl(sx, gyB, sx, top, 9, 1.3, b.seed); dl(sx, top, sx + b.w, top, 9, 1.3, b.seed + 50); dl(sx + b.w, top, sx + b.w, gyB, 9, 1.3, b.seed + 99);
    } }
  for (const b of this.blds) {
    const sx = b.x - cam; if (sx > w + 20 || sx + b.w < -40) continue;
    const gy = SY(this.g(b.x + b.w / 2));
    const rise = this.ss(w + 40, w - 260, sx + b.w * 0.5), e = 1 - Math.pow(1 - rise, 3);
    const fullH = Math.min(b.h, gy - 130), H = fullH * e; if (H < 4) continue;
    const top = gy - H, hue = this.vcol[b.seed % 5], cols = [hue, hue, col.mut];
    ctx.globalAlpha = 0.8 * rv;
    dl(sx, gy, sx, top, 7, 1.6, b.seed, cols); dl(sx + b.w, gy, sx + b.w, top, 7, 1.6, b.seed + 40, cols);
    dl(sx - 4, top, sx + b.w + 4, top, 7, 1.6, b.seed + 80, cols);
    if (b.roof === 2) { dl(sx + b.w * .25, top, sx + b.w * .25, top - 16, 7, 1.4, b.seed + 120, cols); dl(sx + b.w * .25, top - 16, sx + b.w * .75, top - 16, 7, 1.4, b.seed + 130, cols); dl(sx + b.w * .75, top - 16, sx + b.w * .75, top, 7, 1.4, b.seed + 140, cols); }
    if (b.roof === 1 && e > .97) { ctx.fillStyle = col.mut; dl(sx + b.w * .3, top, sx + b.w * .3, top - 34, 6, 1.1, b.seed + 150); ctx.globalAlpha = rv * (Math.sin(this.t * 3 + b.seed) > 0 ? 1 : .3); ctx.fillStyle = '#c0725e'; ctx.beginPath(); ctx.arc(sx + b.w * .3, top - 38, 2.4, 0, 7); ctx.fill(); ctx.globalAlpha = 0.8 * rv; }
    const colsN = Math.max(2, Math.floor((b.w - 16) / 24)), cw = (b.w - 16) / colsN;
    for (let rr = 0; ; rr++) {
      const wy = top + 18 + rr * 30; if (wy + 12 > gy - 40) break;
      for (let c = 0; c < colsN; c++) {
        const wx = sx + 8 + c * cw + cw / 2, id = b.seed + rr * 13 + c;
        const lit = Math.abs(b.x + 8 + c * cw - X) < 100 || this.rand(id + Math.floor(this.t * 0.25 + this.rand(id) * 4)) > 0.84 - 0.5 * (this.nightV || 0);
        if (lit && this.nightV > 0.02) { ctx.globalAlpha = 0.22 * this.nightV * rv; ctx.fillStyle = '#f2d27a'; ctx.fillRect(wx - 7, wy - 5, 14, 17); }
        ctx.fillStyle = lit ? this.acc : col.dot; ctx.globalAlpha = (lit ? 0.9 : 0.55) * rv;
        for (const [ox, oy] of [[-3, 0], [3, 0], [-3, 7], [3, 7]]) { ctx.beginPath(); ctx.arc(wx + ox, wy + oy, 1.5, 0, 7); ctx.fill(); }
      }
    }
    if (H > 50) { ctx.globalAlpha = 0.8 * rv; ctx.fillStyle = col.mut; const dx = sx + b.w / 2; dl(dx - 8, gy, dx - 8, gy - 26, 6, 1.3, b.seed + 200); dl(dx - 8, gy - 26, dx + 8, gy - 26, 6, 1.3, b.seed + 210); dl(dx + 8, gy - 26, dx + 8, gy, 6, 1.3, b.seed + 220);
      if (b.shop) { ctx.fillStyle = b.aw === '#f1ebe0' ? this.acc : hue; dl(sx + 4, gy - 38, sx + b.w - 4, gy - 38, 6, 1.6, b.seed + 230, [hue, this.acc]); } }
  }
  ctx.globalAlpha = 1;
}

export function renderRoad(this: WandererEngine): void {}

export function renderDotLine(this: WandererEngine, ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, step: number, r: number): void { const d = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.floor(d / step)); for (let i = 0; i <= n; i++) { const t = i / n; ctx.fillRect(x1 + (x2 - x1) * t - r / 2, y1 + (y2 - y1) * t - r / 2, r, r); } }

export function renderScene(this: WandererEngine): void {
  const cv = this.canvasRef.current; if (!cv) return;
  const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
  const pixelWidth = Math.round(w * dpr), pixelHeight = Math.round(h * dpr);
  if (cv.width !== pixelWidth || cv.height !== pixelHeight) { cv.width = pixelWidth; cv.height = pixelHeight; }
  const ctx = cv.getContext('2d'); if (!ctx) return; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
  const D = this.dark(this.x), L = this.L, K = this.D, N = this.nightV || 0, NK = this.NK;
  const lp = (p: RGB, q: RGB, t: number): RGB => p.map((v, i) => v + (q[i] - v) * t) as RGB;
  const m = (key: keyof NumericPalette): RGB => lp(lp(L[key], K[key], D), NK[key], N);
  const str = (color: RGB): string => `rgb(${color.map(Math.round).join(',')})`;
  const col = { bg: str(m('bg')), ink: str(m('ink')), dot: str(m('dot')), mut: str(m('mut')) };
  const root = this.rootRef.current, key = D + N * 7;
  if (root && Math.abs((this._lastD ?? -1) - key) > 0.004) {
    this._lastD = key;
    root.style.setProperty('--color-bg', col.bg); root.style.setProperty('--color-text', col.ink);
    root.style.setProperty('--color-neutral-500', col.mut); root.style.setProperty('--color-divider', str(m('div')));
    root.style.setProperty('--sub', str(m('sub')));
  }
  if (this.camX == null) this.camX = this.x;
  this.camX += (this.x - this.camX) * 0.12;
  const cam = this.camX - w * 0.45, baseY = h * 0.72, camY = this.camY;
  const SY = (wy: number) => baseY + wy - camY;
  const X = this.x;
  this.drawIntro(ctx, cam, SY, w, col);
  // meadow clouds
  const cloudA = 1 - this.ss(6400, 6900, X);
  if (cloudA > 0) for (const cl of this.clouds) {
    const sx = cl.x - cam * 0.5 + Math.sin(this.t * 0.1 + cl.x) * 20; if (sx < -200 || sx > w + 200) continue;
    ctx.fillStyle = col.dot;
    for (const p of cl.pts) { ctx.globalAlpha = (0.18 + p.c * 0.25) * cloudA; ctx.beginPath(); ctx.arc(sx + p.x, h * cl.y + p.y, p.r, 0, 7); ctx.fill(); }
  }
  if (N > 0.01) {
    const mx = w * 0.76, my = h * 0.17 + (1 - N) * 70;
    const gl = ctx.createRadialGradient(mx, my, 20, mx, my, 120); gl.addColorStop(0, `rgba(241,230,200,${0.2 * N})`); gl.addColorStop(1, 'rgba(241,230,200,0)');
    ctx.globalAlpha = 1; ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(mx, my, 120, 0, 7); ctx.fill();
    ctx.globalAlpha = N; ctx.fillStyle = '#efe4c6'; ctx.beginPath(); ctx.arc(mx, my, 32, 0, 7); ctx.fill();
    ctx.fillStyle = '#d9cba3'; for (const [cx, cy, cr] of [[-10, -8, 6], [9, 6, 4.5], [-4, 13, 3], [12, -12, 2.5]]) { ctx.beginPath(); ctx.arc(mx + cx, my + cy, cr, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#efe4c6'; for (let k = 0; k < 28; k++) { const an = k / 28 * 6.283 + this.t * 0.03; ctx.globalAlpha = N * 0.35; ctx.beginPath(); ctx.arc(mx + Math.cos(an) * 48, my + Math.sin(an) * 48, 1.3, 0, 7); ctx.fill(); }
    ctx.lineCap = 'round';
    for (const s of this.shoot) { const x = s.x * w, y = s.y * h, gr = ctx.createLinearGradient(x, y, x - s.vx * 0.15, y - s.vy * 0.15); gr.addColorStop(0, 'rgba(255,250,235,1)'); gr.addColorStop(1, 'rgba(255,250,235,0)'); ctx.globalAlpha = N * Math.min(1, s.life * 2); ctx.strokeStyle = gr; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s.vx * 0.15, y - s.vy * 0.15); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
  const sunA = (this.car && this.car.started ? 1 : 0) * this.ss(6550, 6800, X) * (1 - this.ss(7100, 7450, X));
  if (sunA > 0.01) {
    const mx = w * 0.76, my = h * 0.17 + (1 - sunA) * 70;
    ctx.globalAlpha = sunA; ctx.fillStyle = '#e9b45a'; ctx.beginPath(); ctx.arc(mx, my, 26, 0, 7); ctx.fill();
    for (let k = 0; k < 36; k++) { const an = k / 36 * 6.283 + this.t * 0.15, rr = 40 + (k % 2) * 7; ctx.globalAlpha = sunA * 0.7; ctx.beginPath(); ctx.arc(mx + Math.cos(an) * rr, my + Math.sin(an) * rr, 1.5, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  { const mA = this.ss(3000, 3600, X) * (1 - this.ss(6400, 6900, X));
    if (mA > 0.01) { const base = SY(this.g(X)) + 4;
      this.mtn.forEach((pts, L) => {
        const par = L ? 0.3 : 0.42, colr = L ? (N > .5 ? '#5d6b85' : '#9fb0b8') : (N > .5 ? '#4f6b5e' : '#7fa9a0');
        ctx.fillStyle = colr;
        for (let k = 0; k < pts.length - 1; k++) {
          const x1 = pts[k][0] - cam * par, x2 = pts[k + 1][0] - cam * par; if (x2 < -20 || x1 > w + 20) continue;
          const y1 = base - pts[k][1], y2 = base - pts[k + 1][1], d = Math.hypot(x2 - x1, y2 - y1), n = Math.floor(d / 8);
          for (let i = 0; i <= n; i++) { const t = i / n, q = this.rand(k * 97 + i + L * 13); ctx.globalAlpha = mA * (L ? 0.35 : 0.5) * (0.6 + q * 0.4); ctx.beginPath(); ctx.arc(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, 1.3 + q * 1.2, 0, 7); ctx.fill(); }
          if (pts[k][1] > pts[k + 1][1]) for (let i = 0; i < 10; i++) { const q = this.rand(k * 31 + i + L * 7), q2 = this.rand(k * 37 + i + L * 9); const px = x1 + (x2 - x1) * q2, top = y1 + (y2 - y1) * q2; const py = top + q * (base - top); ctx.globalAlpha = mA * 0.18; ctx.beginPath(); ctx.arc(px, py, 1.2, 0, 7); ctx.fill(); }
        }
      });
      ctx.globalAlpha = 1; } }
  this.drawCity(ctx, cam, SY, w, col);
  // night stars
  const nightA = Math.max(this.ss(13900, 14400, X), N);
  const darkA = this.ss(8360, 8600, X) * (1 - this.ss(11000, 11600, X));
  if (nightA > 0) for (const s of this.stars) {
    const sx = ((s.x * w * 1.5 - cam * 0.15) % w + w) % w, sy = s.y * h;
    ctx.globalAlpha = nightA * (0.3 + 0.5 * Math.abs(Math.sin(this.t * (0.5 + s.s) + s.s * 20)));
    ctx.fillStyle = s.s > .7 ? this.pal[1] : s.s > .4 ? this.pal[2] : this.pal[0];
    const r = 1 + s.s * 2.5; ctx.fillRect(sx, sy, r, r);
  }
  // dark zone circuit rows
  if (darkA > 0) for (const row of this.rows) {
    const ry = SY(row.y);
    ctx.fillStyle = this.pal[row.ci];
    for (let wx = Math.max(8500, Math.floor(cam / 14) * 14); wx < Math.min(11200, cam + w); wx += 14) {
      const i = wx / 14, seg = this.rand(Math.floor(i / 10) + row.ph);
      if (seg < .3 || this.rand(i + row.ph) < .3) continue;
      const sx = wx - cam;
      ctx.globalAlpha = darkA * (0.35 + 0.45 * Math.abs(Math.sin(this.t * 1.5 + i * 0.3)));
      const r = 2.5 + this.rand(i * 7 + row.ph) * 2;
      ctx.fillRect(sx, ry, r, r);
    }
  }
  // trees
  for (const tr of this.trees) {
    const sx = tr.x - cam; if (sx < -200 || sx > w + 200) continue;
    const gy = SY(this.g(tr.x)), ts = Math.min(1, (gy - 100) / tr.h);
    ctx.save(); ctx.translate(sx, gy); ctx.scale(ts, ts); ctx.translate(-sx, -gy);
    for (const p of tr.pts) {
      const sway = p.trunk ? 0 : Math.sin(this.t * 0.8 + p.y * 0.02) * (-p.y / 300) * 4;
      const k = p.k ?? (p.k = this.rand(p.x * 13.1 + p.y * 7.7)), fm = this.form, vis = p.trunk ? 0.5 + fm * 0.5 : Math.max(0, Math.min(1, (fm - k * 0.85) / 0.15));
      if (vis <= 0.01) continue;
      const sc = (1 - fm) * (p.trunk ? 4 : 18), ang = k * 40;
      const ox = Math.cos(ang) * sc, oy = Math.sin(ang) * sc * 0.6 + (1 - fm) * k * 8;
      ctx.globalAlpha = p.trunk ? 0.6 + p.c * 0.3 : 0.45 + p.c * 0.45;
      const shade = p.shade ?? 0.5;
      ctx.fillStyle = p.trunk ? (p.c > .5 ? '#6b5544' : '#8a7462') : (shade + (p.c - .5) * .5 < 0.35 ? '#4f8a5b' : shade + (p.c - .5) * .5 < 0.7 ? '#3d6e48' : '#2c5236');
      ctx.globalAlpha *= vis * (1 - 0.35 * N); ctx.beginPath(); ctx.arc(sx + p.x + sway + ox, gy + p.y + oy, p.r * (0.6 + 0.4 * vis), 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  // seeds
  for (const s of this.seeds) {
    const life = ((this.t * s.sp * 0.08 + s.off) % 1);
    const sx = s.x - cam + Math.sin(this.t + s.off * 9) * 18 + life * 60; if (sx < -20 || sx > w + 20) continue;
    const sy = SY(this.g(s.x)) - 20 - life * h * 0.55;
    ctx.globalAlpha = Math.sin(life * Math.PI) * 0.8; ctx.strokeStyle = col.mut; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - 2, sy + 10); ctx.stroke();
    for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.38; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(a) * 6, sy + Math.sin(a) * 6); ctx.stroke(); }
  }
  // rain over river
  const rainA = this.ss(7200, 7500, X) * (1 - this.ss(8250, 8400, X));
  if (rainA > 0) {
    ctx.strokeStyle = this.rainCol; ctx.lineWidth = 1.2;
    const n = Math.floor(this.rain.length * rainA);
    for (let j = 0; j < n; j++) { const r = this.rain[j]; const y = ((r.y + this.t * (0.9 + r.sp * 0.6)) % 1) * (h + 40) - 20, x = ((r.x * (w + 80) - y * 0.12 - this.x * 0.15) % (w + 80) + w + 80) % (w + 80) - 40; ctx.globalAlpha = rainA * (0.35 + r.sp * 0.35); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2.5, y + 12 + r.sp * 8); ctx.stroke(); }
    ctx.lineWidth = 1;
    for (let j = 0; j < 14 * rainA; j++) { const life = (this.t * 1.3 + j * 0.37) % 1, wx = 6850 + this.rand(j * 11 + Math.floor(this.t * 1.3 + j * 0.37)) * 1550, sx = wx - cam; if (sx < -20 || sx > w + 20) continue; ctx.globalAlpha = rainA * (1 - life) * 0.7; ctx.beginPath(); ctx.ellipse(sx, SY(76), 2 + life * 12, 1 + life * 3, 0, 0, 7); ctx.stroke(); }
  }
  // water
  if (cam + w > 6800 && cam < 8600) {
    ctx.fillStyle = this.water;
    for (let wx = Math.max(6800, Math.floor(cam / 7) * 7); wx < Math.min(8560, cam + w); wx += 7) {
      const edge = this.ss(6800, 6920, wx) * (1 - this.ss(8440, 8560, wx));
      for (let k = 0; k < 16; k++) {
        const i = Math.round(wx / 7) + k * 131, rr = this.rand(i);
        if (rr < 0.15 + k * 0.03) continue;
        const dep = k === 0 ? 0 : Math.pow(k / 16, 1.3) * 150 + this.rand(i * 7) * 8;
        const y = SY(76 + dep + Math.sin(this.t * 1.4 + wx * 0.02 + k) * (k === 0 ? 2.5 : 1.2));
        ctx.globalAlpha = edge * (k === 0 ? 0.85 : 0.65 - k * 0.032) * (1 - D * .4);
        const r = (k === 0 ? 1.8 : 1.2) + this.rand(i * 3) * (k === 0 ? 2.4 : 3);
        const sh = this.rand(i * 5 + 1); ctx.fillStyle = sh > .7 ? '#3d6fa8' : sh > .4 ? '#5b8fc7' : sh > .15 ? '#86b0dc' : '#b5d0ec';
        ctx.beginPath(); ctx.arc(wx - cam + Math.sin(this.t * 0.6 + k + wx) * 3, y, r, 0, 7); ctx.fill();
      }
    }
  }
  // bridge
  if (cam + w > 7000 && cam < 8300) {
    const spd = Math.min(1, Math.abs(this.v) / 170), onB = X > 7000 && X < 8300;
    ctx.fillStyle = col.mut;
    for (let wx = 7000; wx <= 8300; wx += 6) {
      const sx = wx - cam; if (sx < -10 || sx > w + 10) continue;
      const i = wx / 6, near = onB ? Math.exp(-Math.pow((wx - X) / 140, 2)) : 0;
      const y = SY(this.g(wx));
      for (let rail = 0; rail < 2; rail++) {
        const rv = this.rand(i * 3 + rail * 77), jx = 0, jy = 0;
        ctx.globalAlpha = 0.55 + rv * 0.4;
        ctx.beginPath(); ctx.arc(sx + jx, y + 1 + rail * 12 + jy, 1 + rv * 1.4, 0, 7); ctx.fill();
      }
    }
    for (let wx = 7030; wx <= 8280; wx += 140) {
      const sx = wx - cam, y = SY(0);
      ctx.globalAlpha = 0.8;
      for (let yy = y + 14; yy < SY(80); yy += 6) { ctx.beginPath(); ctx.arc(sx, yy, 1.3, 0, 7); ctx.fill(); }
      for (let k = 0; k < 6; k++) { const t = k / 5; ctx.beginPath(); ctx.arc(sx + 30 + t * 4, y - t * 28, 1.2, 0, 7); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }
  // mountains + houses (village)
  const vilA = this.ss(11800, 12200, X) * (1 - this.ss(13800, 14100, X));
  if (vilA > 0) {
    const mv = Math.min(1, Math.abs(this.v) / 170);
    this.ridges.forEach((rid, L) => {
      const par = L ? 0.3 : 0.5, oy = baseY - 560 * 0 - (L ? 150 : 90) - (camY - (-560)) * 0.3;
      for (let k = 0; k < rid.length - 1; k++) {
        const x1 = rid[k][0] - (cam - 11600) * par, y1 = oy + rid[k][1], x2 = x1 + 150, y2 = oy + rid[k + 1][1];
        if (x2 < -20 || x1 > w + 20) continue;
        const n = 16;
        for (let i = 0; i <= n; i++) { const t = i / n, seed = k * 31 + i + L * 999, rv = this.rand(seed); if (rv < .35) continue; ctx.globalAlpha = vilA * (L ? .25 : .4) * (.5 + rv * .5); ctx.fillStyle = this.vcol[Math.floor(this.rand(seed * 3) * 4)]; ctx.fillRect(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t + Math.sin(this.t + seed) * mv, 7, 1.6); }
      }
    });
    for (const hs of this.houses) {
      const sx = hs.x - cam; if (sx < -200 || sx > w + 200) continue;
      const gy = SY(this.g(hs.x));
      const asm = this.ss(hs.x - 950, hs.x - 380, X);
      if (asm <= 0.01) continue;
      for (const p of hs.pts) {
        const sc = (1 - asm) * (140 + p.s * 220), lift = (1 - asm) * p.s * 120;
        const shimmer = mv * Math.sin(this.t * 4 + p.a * 3) * 1.4;
        const px = sx + p.x + Math.cos(p.a) * sc, py = gy + p.y + Math.sin(p.a) * sc * .6 - lift + shimmer;
        ctx.globalAlpha = vilA * Math.min(1, asm * 1.4) * (.55 + p.s * .35); ctx.fillStyle = p.c;
        if (p.horiz) ctx.fillRect(px - p.len / 2, py, p.len, 1.8); else { ctx.save(); ctx.translate(px, py); ctx.rotate(p.a * (1 - asm)); ctx.fillRect(-p.len / 2, -1, p.len, 2); ctx.restore(); }
      }
      hs.wins.forEach((wn, wi) => {
        const a2 = this.ss(.6, 1, asm); if (a2 <= 0) return;
        const wx = sx + wn[0], wy = gy + wn[1], pulse = 1 + Math.sin(this.t * 2 + wi + hs.x) * .06;
        ctx.globalAlpha = vilA * a2 * .7;
        if (wn[2]) { ctx.strokeStyle = this.vcol[3]; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(wx, wy, 13 * pulse, 0, 7); ctx.stroke(); }
        else { ctx.fillStyle = this.vcol[(wi + Math.round(hs.x / 100)) % 2 ? 1 : 0]; ctx.beginPath(); ctx.ellipse(wx, wy, 9 * pulse, 6 * pulse, 0, 0, 7); ctx.fill(); }
      });
    }
  }
  // floating island underside
  if (cam + w > 13900) {
    const top = SY(-900);
    for (let wx = Math.max(13950, Math.floor(cam / 10) * 10); wx < Math.min(this.W, cam + w + 10); wx += 10) {
      const sx = wx - cam, u = (wx - 13950) / (this.W - 13950), depth = Math.sin(Math.PI * Math.min(1, u * 1.6)) * 260;
      for (let k = 1; k <= 4; k++) { const rv = this.rand(wx * .37 + k * 71); if (rv < .4) continue; ctx.globalAlpha = (.25 + rv * .35) * nightA * (1 - k * .15); ctx.fillStyle = this.pal[Math.floor(rv * 2)]; ctx.beginPath(); ctx.arc(sx, top + depth * (k / 4) + Math.sin(this.t * .7 + wx * .01) * 2, 1 + rv * 1.6, 0, 7); ctx.fill(); }
    }
  }
  ctx.globalAlpha = 1;
  this.drawRoad();
  // ground
  const start = Math.floor(cam / 9) - 1, end = Math.ceil((cam + w) / 9) + 1;
  for (let i = start; i <= end; i++) {
    const wx = i * 9; if ((!this.introDone && (!this.intro.reveal || Math.abs(wx - this.intro.landX) > this.intro.reveal))) continue; if ((wx > 6990 && wx < 8440) || (wx > 13810 && wx < 13950)) continue;
    const sx = wx - cam, r = this.rand(i), gy = SY(this.g(wx) + (r - .5) * 3);
    if (gy < -20 || gy > h + 20) continue;
    const dz = this.dark(wx);
    const near = Math.abs(wx - X) < 90 && this.sit < 0.5 && Math.abs(this.v) > 10;
    ctx.globalAlpha = 0.35 + r * 0.45;
    if (dz > 0.5 || (wx > 11000 && wx < 12200)) ctx.fillStyle = this.pal[Math.floor(this.rand(i * 3) * 4)];
    else if (wx >= 12200 && wx <= 13810) ctx.fillStyle = (near && r > .55) ? this.acc : this.vcol[Math.floor(this.rand(i * 3) * 5)];
    else if (near && r > 0.55) ctx.fillStyle = this.acc;
    else { const gz = this.ss(3550, 3750, wx) * (1 - this.ss(6600, 6850, wx)); const gr = this.rand(i * 5 + 2); ctx.fillStyle = gz > gr ? (gr > .66 ? '#7fa9a0' : gr > .33 ? '#5f8f6c' : '#8fb39a') : col.dot; }
    ctx.beginPath(); ctx.arc(sx, gy, 1.2 + r * 2.2, 0, 7); ctx.fill();
  }
  // flakes
  if (darkA > 0) { ctx.fillStyle = col.ink; for (const f of this.flakes) { const y = ((f.y + this.t * f.sp * 0.12) % 1) * h, x = ((f.x * w - this.v * 0 + Math.sin(this.t * .5 + f.rot) * 30) % w + w) % w; ctx.save(); ctx.translate(x, y); ctx.rotate(f.rot + this.t * f.sp); ctx.globalAlpha = darkA * 0.75; ctx.fillRect(-4, -1.5, 8, 3); ctx.restore(); } }
  // splash
  for (const p of this.parts) {
    const fade = Math.min(1, p.life / Math.max(.01, (p.max || 1) * .4)), sx = p.x - cam, sy = SY(p.y);
    if (sx < -20 || sx > w + 20) continue;
    ctx.globalAlpha = fade * .85;
    if (p.k === 'drop') { ctx.fillStyle = p.c ?? col.dot; ctx.beginPath(); ctx.arc(sx, sy, p.r ?? 1, 0, 7); ctx.fill(); }
    else if (p.k === 'rect') { const width = p.w ?? 0; ctx.fillStyle = col.ink; ctx.save(); ctx.translate(sx, sy); ctx.rotate(p.rot ?? 0); ctx.fillRect(-width / 2, -1.6, width, 3.2); ctx.restore(); }
    else if (p.k === 'petal') { ctx.fillStyle = p.c ?? col.dot; ctx.save(); ctx.translate(sx, sy); ctx.rotate((p.rot ?? 0) + this.t); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 4, 0, Math.PI * .6); ctx.closePath(); ctx.fill(); ctx.restore(); }
  }
  // captions
  const lang = this.state.lang;
  for (const c of this.captions) {
    const d = Math.abs(X - c.x); if (d > 600) continue;
    ctx.globalAlpha = Math.max(0, 1 - d / 500) * (1 - Math.min(1, (this.cardOp || 0) * 1.5)); ctx.fillStyle = col.ink; ctx.textAlign = 'center';
    ctx.font = `italic 400 ${Math.max(22, Math.min(34, w / 40))}px ${this.head}`;
    const ct = lang === 'ja' ? c.ja : c.en, cy = h * (c.x < 2100 ? 0.2 : 0.3);
    ctx.save(); ctx.strokeStyle = col.bg; ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.strokeText(ct, w / 2, cy); ctx.restore();
    ctx.fillText(ct, w / 2, cy);
  }
  ctx.globalAlpha = 1;
  if (!this.car.in) this.drawCar(ctx, cam, SY, w, col);
  if (!this.intro.onSwing && !this.car.in) this.drawFigure(ctx, this.x - cam, SY(this.figY), col);
  if (this.car.in) this.drawCar(ctx, cam, SY, w, col);
  const pr = this.promptRef.current;
  if (pr) { const C = this.car; pr.style.transform = `translate(${C.x - cam - pr.offsetWidth / 2}px, ${SY(this.g(C.x)) - 175}px)`; pr.style.opacity = this.state.carPrompt ? '1' : '0'; }
  // card position
  const cr = this.cardRef.current;
  if (cr) {
    const ci = this.state.card, c = this.cards[ci];
    let op = 0;
    if (c) {
      op = Math.max(0, Math.min(1, 1.4 - Math.abs(X - c.x) / 500));
      const cx = Math.min(w - cr.offsetWidth - 16, Math.max(16, c.x - cam + 80));
      const cy = Math.max(90, SY(this.g(c.x)) - cr.offsetHeight - 120);
      cr.style.transform = `translate(${cx}px, ${cy}px)`;
    }
    this.cardOp = op; cr.style.opacity = String(op); cr.style.pointerEvents = op > .5 ? 'auto' : 'none';
  }
  // progress
  if (!this.introDone) return;
  const pw = 240, ppx = w / 2 - pw / 2, ppy = h * 0.91 + 28, prog = X / this.W;
  for (let i = 0; i <= 40; i++) { const f = i / 40; ctx.fillStyle = f <= prog ? this.acc : col.dot; ctx.globalAlpha = f <= prog ? 0.9 : 0.4; ctx.beginPath(); ctx.arc(ppx + f * pw, ppy, 1, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
}
