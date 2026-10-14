import type WandererEngine from '../WandererEngine';

export function advanceIntro(this: WandererEngine, dt: number): void {
  const I = this.intro, SWX = -330, LEDGE = -150;
  this.t += dt; this.loadT = (performance.now() - this.loadStart) / 1000; I.t += dt; I.st += dt;
  const p = this.loadP = Math.min(1, Math.max(this.loadP, Math.min(1, this.loadT / 3.2)));
  if (this.loadPctRef.current) this.loadPctRef.current.textContent = Math.round(p * 100) + '%';
  if (I.state === 'swing') { I.A = 0.22 + 0.5 * Math.min(1, p * 1.3); if (p >= 1) I.state = 'ready'; }
  else if (I.state === 'ready') {
    const ph = I.st * 2.4, th = I.A * Math.sin(ph), dth = I.A * 2.4 * Math.cos(ph);
    if (th > I.A * 0.45 && dth > 0) {
      const Lr = 165, sx = SWX + Lr * Math.sin(th), sy = LEDGE - 215 + Lr * Math.cos(th);
      I.state = 'leap'; I.onSwing = false;
      this.x = sx + 10; this.figY = sy + 6; this.v = Lr * dth * Math.cos(th); this.vy = -Lr * dth * Math.sin(th) - 170; this.sit = 0; this.face = 1;
      const el = this.loadRef.current; if (el) { el.style.opacity = '0'; el.style.visibility = 'hidden'; }
      if (this.state.sound) this.tick(300, .12);
    }
  } else {
    I.A *= Math.exp(-dt * 0.5);
    if (I.state === 'leap') {
      this.x += this.v * dt; this.vy += 950 * dt; this.figY += this.vy * dt;
      if (this.vy > 0 && this.figY >= LEDGE) {
        this.figY = LEDGE; this.vy = 0; this.v = Math.min(this.v, 150); I.state = 'walk';
        for (let i = 0; i < 14; i++) I.dust.push({ x: this.x + (Math.random() - .5) * 12, y: LEDGE, vx: (Math.random() - .5) * 120, vy: -30 - Math.random() * 80, life: 1, c: this.ldots[i % this.ldots.length].c });
      }
    } else if (I.state === 'walk') {
      this.v += (150 - this.v) * Math.min(1, dt * 5); this.x += this.v * dt; this.phase += dt * Math.abs(this.v) * 0.085;
      if (this.x >= -14) { I.state = 'jump'; this.vy = -330; }
    } else if (I.state === 'jump') {
      this.x += this.v * dt; this.vy += 950 * dt; this.figY += this.vy * dt;
      const tg = this.g(this.x);
      if (this.x > 20 && this.vy > 0 && this.figY >= tg) {
        this.figY = tg; this.vy = 0; this.v = 0; I.state = 'land'; I.t = 0; I.landX = this.x; I.landT = this.t;
        for (let i = 0; i < 26; i++) I.dust.push({ x: this.x + (Math.random() - .5) * 14, y: tg, vx: (Math.random() - .5) * 180, vy: -40 - Math.random() * 120, life: 1, c: this.ldots[i % this.ldots.length].c });
        if (this.state.sound) this.tick(120, .2);
      }
    } else if (I.state === 'land') {
      I.reveal += dt * 1100;
      this.face = 1; this.wave = Math.max(0, Math.min(1, (I.t - 0.3) / 0.2, (1.55 - I.t) / 0.2));
      if (I.t > 1.6) {
        this.wave = 0; this.introDone = true; this.idle = 0;
        if (this.resumeX != null) { this.x = this.resumeX; this.figY = this.g(this.x); this.camX = this.x; this.camY = this.figY; }
        if (this.ctrlRef.current) this.ctrlRef.current.style.opacity = '1';
      }
    }
  }
  I.dust = I.dust.filter(d => { d.vy += 500 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt * 1.4; return d.life > 0; });
  this.camY += (this.figY - this.camY) * Math.min(1, dt * 3);
}

export function syncDirection(this: WandererEngine): void { const d = (this.keys.r ? 1 : 0) - (this.keys.l ? 1 : 0) + this.keys.btn; const dir = Math.max(-1, Math.min(1, d)); if (dir !== this.state.dir) this.setState({ dir }); }

export function advanceWorld(this: WandererEngine, dt: number): void {
  this.t += dt;
  let sp = 0, prevStep = 0;
  if (this.car.in) this.carStep(dt); else {
  const dir = this.state.dir, px = this.x;
  this.v += (dir * (this.keys.run ? 420 : 170) - this.v) * Math.min(1, dt * 6);
  if (px < 13800 && this.x + this.v * dt >= 13800 && this.vy === 0) { this.launch = true; this.vy = -1500; if (this.state.sound) this.tick(320, .5); }
  if (this.launch) this.v = 160;
  this.x = Math.max(60, Math.min(this.W - 60, this.x + this.v * dt));
  if (dir) this.face = dir;
  sp = Math.abs(this.v);
  prevStep = Math.floor(this.phase / Math.PI);
  if (sp > 4) { this.phase += dt * sp * 0.085; this.idle = 0; } else this.idle += dt;
  this.sit += ((this.idle > 3.5 ? 1 : 0) - this.sit) * Math.min(1, dt * 3);
  if (px < 8300 && this.x >= 8300) this.vy = -280;
  const tg = this.g(this.x), py = this.figY;
  if (this.vy < 0 || this.figY < tg - 1) { this.vy += 950 * dt; this.figY += this.vy * dt; if (this.figY >= tg && this.vy > 0) { this.figY = tg; this.vy = 0; this.launch = false; } }
  if (this.launch && this.vy < -150) for (let i = 0; i < 3; i++) this.parts.push({ k: 'petal', x: this.x + (Math.random() - .5) * 14, y: this.figY + 4, vx: (Math.random() - .5) * 40, vy: 40 + Math.random() * 80, g: 15, drag: .6, life: 2.2 + Math.random() * 1.5, max: 3.7, rot: Math.random() * 6, c: this.vcol[Math.floor(Math.random() * 5)] });
  else { this.figY = tg; this.vy = 0; this.launch = false; }
  if (this.x > 8250 && this.x < 8550 && py < 75 && this.figY >= 75) {
    for (let i = 0; i < 260; i++) { const big = Math.random(); this.parts.push({ k: 'drop', x: this.x + (Math.random() - .5) * 60, y: 75 + Math.random() * 20, vx: (Math.random() - .5) * 520, vy: -150 - Math.pow(Math.random(), .6) * 720, g: 160, drag: 1.4, life: 2.5 + Math.random() * 2.5, max: 5, r: 1 + big * big * 4, c: ['#3d6fa8', '#5b8fc7', '#7fb3c9', '#86b0dc'][Math.floor(Math.random() * 4)] }); }
    for (let i = 0; i < 110; i++) this.parts.push({ k: 'rect', x: this.x + (Math.random() - .5) * 60, y: 75, vx: (Math.random() - .5) * 900, vy: -250 - Math.random() * 700, g: 70, drag: 1.6, life: 3.5 + Math.random() * 2.5, max: 6, rot: Math.random() * 6, vr: (Math.random() - .5) * 4, w: 5 + Math.random() * 8 });
    if (this.state.sound) this.tick(90, .25);
  }
  }
  { const tgt = this.car.started ? this.ss(900, 1250, this.x) * (1 - this.ss(6400, 6680, this.x)) : 0; this.nightV += (tgt - this.nightV) * Math.min(1, dt * 1.2);
    if (this.nightV > 0.5 && Math.random() < dt / 2.2) this.shoot.push({ x: 0.35 + Math.random() * 0.75, y: 0.04 + Math.random() * 0.22, vx: -(480 + Math.random() * 300), vy: 170 + Math.random() * 120, life: 0.9 });
    this.shoot = this.shoot.filter(s => { const W = this.canvasRef.current ? this.canvasRef.current.clientWidth : 1000, H = this.canvasRef.current ? this.canvasRef.current.clientHeight : 800; s.x += s.vx * dt / W; s.y += s.vy * dt / H; s.life -= dt; return s.life > 0; }); }
  this.puffs = this.puffs.filter(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 9; p.life -= dt * 1.1; return p.life > 0; });
  { const C = this.car; let cp: 'drive' | 'enter' | null = null;
    if (C.in) { if (C.x - C.startX < 260 && C.x < this.ROAD_B - 60) cp = 'drive'; }
    else if (!C.arrived && Math.abs(this.x - C.x) < 90 && this.vy === 0) cp = 'enter';
    if (cp !== this.state.carPrompt) this.setState({ carPrompt: cp }); }
  this.parts = this.parts.filter(p => { const dr = Math.exp(-(p.drag || 0) * dt); p.vx *= dr; p.vy = p.vy * dr + (p.g ?? 700) * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.vr) p.rot = (p.rot ?? 0) + p.vr * dt; p.life -= dt; return p.life > 0; });
  this.camY += (this.figY - this.camY) * Math.min(1, dt * (this.launch ? 1.4 : 3));
  this.form = this.form ?? 1; this.form += ((Math.abs(this.v) > 20 ? 0.4 : 1) - this.form) * Math.min(1, dt * (Math.abs(this.v) > 20 ? 4 : 3));
  if (this.state.sound && sp > 20 && this.vy === 0 && Math.floor(this.phase / Math.PI) !== prevStep) this.tick();
  let best = -1, bd = 900;
  this.cards.forEach((c, i) => { const d = Math.abs(this.x - c.x); if (d < bd) { bd = d; best = i; } });
  if (best !== this.state.card) this.setState({ card: best, expanded: false });
  if (Math.floor(this.t * 2) !== this.saved) {
    this.saved = Math.floor(this.t * 2);
    try { localStorage.setItem('wanderer-x2', String(Math.round(this.x))); } catch {}
  }
}

export function handleCarAction(this: WandererEngine): boolean {
  if (!this.introDone) return false;
  const C = this.car;
  if (C.in) { if (Math.abs(C.v) < 80) this.exitCar(); return true; }
  if (!C.arrived && Math.abs(this.x - C.x) < 90 && this.vy === 0) { C.in = true; C.started = true; C.startX = C.x; C.endT = 0; this.v = 0; if (this.state.sound) this.tick(220, .1); return true; }
  return false;
}

export function leaveCar(this: WandererEngine): void {
  const C = this.car; C.in = false; if (C.x >= this.ROAD_B - 1) C.arrived = true;
  C.v = 0; this.x = C.x + 125; this.v = 0; this.face = 1; this.figY = this.g(this.x); this.idle = 0;
  if (this.state.sound) this.tick(260, .1);
}

export function advanceCar(this: WandererEngine, dt: number): void {
  const C = this.car, dir = this.state.dir, RB = this.ROAD_B, RA = this.ROAD_A + 70;
  const tv = dir > 0 ? (this.keys.run ? 900 : 560) : dir < 0 ? -220 : 0;
  C.v += (tv - C.v) * Math.min(1, dt * (dir ? 1.5 : 2.2));
  if (C.v > 0) C.v = Math.min(C.v, Math.sqrt(Math.max(0, RB - C.x) * 1400));
  C.x += C.v * dt;
  if (C.x >= RB - 0.5) { C.x = RB; if (C.v > 0) C.v = 0; }
  if (C.x <= RA) { C.x = RA; if (C.v < 0) C.v = 0; }
  C.rot += C.v * dt / 16;
  this.x = C.x; this.v = C.v; this.vy = 0; this.figY = this.g(C.x); this.idle = 0; this.sit = 0;
  C.pt = (C.pt || 0) + dt;
  if (C.pt > (Math.abs(C.v) > 30 ? 0.05 : 0.2)) { C.pt = 0; this.puffs.push({ x: C.x - 98, y: this.g(C.x) - 24, vx: -30 - Math.random() * 30 - C.v * 0.15, vy: -18 - Math.random() * 18, r: 2 + Math.random() * 2, life: 1 }); }
  if (!C.arrived && C.x >= RB - 1 && Math.abs(C.v) < 5) { C.endT += dt; if (C.endT > 0.7) this.exitCar(); } else C.endT = 0;
}
