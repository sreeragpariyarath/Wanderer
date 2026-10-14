import { CAPTIONS, CARDS } from './wanderer/sceneData';
import { seededRandom, smoothStep, terrainHeight, darknessAt, readColor, mixColor, createTreePoints, createCloudPoints } from './wanderer/world';
import {
  advanceIntro,
  syncDirection,
  advanceWorld,
  handleCarAction,
  leaveCar,
  advanceCar
} from './wanderer/simulation';
import { renderIntro, renderIntroLayer } from './wanderer/renderIntro';
import { renderCity, renderRoad, renderDotLine, renderScene } from './wanderer/renderEnvironment';
import { renderCar, renderFigure } from './wanderer/renderActors';
import { playTick, toggleAudio } from './wanderer/audio';
import { changeLanguage, createViewModel } from './wanderer/ui';
import type {
  BackBuilding,
  Building,
  CloudPoint,
  EngineRef,
  EngineState,
  House,
  HousePoint,
  IntroState,
  IntroTreePoint,
  Language,
  NumericPalette,
  Particle,
  Puff,
  RGB,
  RenderPalette,
  ScreenY,
  TreePoint,
  VehicleState
} from './wanderer/types';
// Canvas engine for the Wanderer scene (ported from Wanderer.dc.html)
export default class WandererEngine {
  listeners = new Set<() => void>();
  state: EngineState = { lang: 'en', sound: false, dir: 0, card: -1, expanded: false, run: false, carPrompt: null };
  loadRef: EngineRef<HTMLDivElement> = { current: null };
  ctrlRef: EngineRef<HTMLDivElement> = { current: null };
  promptRef: EngineRef<HTMLDivElement> = { current: null };
  loadCanvasRef: EngineRef<HTMLCanvasElement> = { current: null };
  loadPctRef: EngineRef<HTMLSpanElement> = { current: null };
  loadTextRef: EngineRef<HTMLSpanElement> = { current: null };
  canvasRef: EngineRef<HTMLCanvasElement> = { current: null };
  cardRef: EngineRef<HTMLDivElement> = { current: null };
  rootRef: EngineRef<HTMLDivElement> = { current: null };
  keys = { l: false, r: false, btn: 0, run: false };
  W = 16000;
  captions = CAPTIONS;
  cards = CARDS;
  dead = false;
  x = -330;
  v = 0;
  phase = 0;
  face = 1;
  idle = 0;
  sit = 0;
  vy = 0;
  figY = -150;
  camX: number | null = null;
  camY = -150;
  t = 0;
  last = 0;
  wave = 0;
  form = 1;
  cardOp = 0;
  nightV = 0;
  launch = false;
  introDone = false;
  intro: IntroState = { state: 'swing', t: 0, st: 0, A: 0.22, reveal: 0, landX: 0, onSwing: true, dust: [] };
  trees: Array<{ x: number; h: number; pts: TreePoint[] }> = [];
  ROAD_A = 380;
  ROAD_B = 6670;
  ROAD_END = 6790;
  car: VehicleState = { x: 760, v: 0, rot: 0, in: false, endT: 0, startX: 760, arrived: false };
  puffs: Puff[] = [];
  parts: Particle[] = [];
  blds: Building[] = [];
  back: BackBuilding[] = [];
  mtn: [number, number][][] = [];
  clouds: Array<{ x: number; y: number; pts: CloudPoint[] }> = [];
  seeds: Array<{ x: number; off: number; sp: number }> = [];
  rain: Array<{ x: number; y: number; sp: number }> = [];
  flakes: Array<{ x: number; y: number; sp: number; rot: number }> = [];
  stars: Array<{ x: number; y: number; s: number }> = [];
  rows: Array<{ y: number; ci: number; ph: number }> = [];
  vcol: string[] = [];
  houses: House[] = [];
  ridges: [number, number][][] = [];
  L!: NumericPalette;
  D!: NumericPalette;
  NK!: NumericPalette;
  shoot: Array<{ x: number; y: number; vx: number; vy: number; life: number }> = [];
  acc = '#b68235';
  pal: string[] = [];
  water = '#5b8fc7';
  rainCol = '#7aa6d6';
  head = 'serif';
  loadP = 0;
  loadT = 0;
  loadStart = 0;
  loadDone = false;
  ldots: Array<{ u: number; a: number; s: number; c: string }> = [];
  resumeX: number | null = null;
  saved?: number;
  raf = 0;
  to: ReturnType<typeof setTimeout> | undefined;
  ac: AudioContext | null = null;
  kd: (event: KeyboardEvent) => void = () => {};
  ku: (event: KeyboardEvent) => void = () => {};
  blur: () => void = () => {};
  _c: CanvasRenderingContext2D | null = null;
  _oc: HTMLCanvasElement | null = null;
  _lastD?: number;
  itree: IntroTreePoint[] | null = null;

  setState(update: Partial<EngineState> | ((state: EngineState) => Partial<EngineState>)): void { const patch = typeof update === 'function' ? update(this.state) : update; this.state = { ...this.state, ...patch }; this.listeners.forEach(listener => listener()); }
  subscribe(listener: () => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  rand(i: number): number { return seededRandom(i); }
  ss(a: number, b: number, x: number): number { return smoothStep(a, b, x); }
  g(x: number): number { return terrainHeight.call(this, x); }
  dark(x: number): number { return darknessAt.call(this, x); }
  rgb(value: string): RGB { return readColor.call(this, value); }
  mix(a: RGB, b: RGB, t: number): string { return mixColor(a, b, t); }
  treePts(seed: number, height: number, type: number): TreePoint[] { return createTreePoints.call(this, seed, height, type); }
  cloud(seed: number): CloudPoint[] { return createCloudPoints.call(this, seed); }
  componentDidMount(): void {
    this.dead = false;
    this.x = -330;
    this.v = 0; this.phase = 0; this.face = 1; this.idle = 0; this.sit = 0; this.vy = 0;
    this.figY = -150; this.camY = -150; this.parts = []; this.introDone = false; this.intro = { state: 'swing', t: 0, st: 0, A: 0.22, reveal: 0, landX: 0, onSwing: true, dust: [] };
    this.trees = [[3850, 260, 0], [4080, 340, 3], [4300, 230, 0], [4560, 380, 0], [4800, 290, 3], [5050, 240, 0], [5330, 360, 3], [5580, 270, 0], [5840, 330, 0], [6080, 250, 3], [6330, 300, 0], [6560, 230, 3]].map(([x, h, t], i) => ({ x, h, pts: this.treePts(50 + i * 400, h, t) }));
    this.ROAD_A = 380; this.ROAD_B = 6670; this.ROAD_END = 6790;
    this.car = { x: 760, v: 0, rot: 0, in: false, endT: 0, startX: 760, arrived: false }; this.puffs = [];
    const bc = ['#a4553d', '#c9a25a', '#6f7d8c', '#d9c4a0', '#8fa3b5', '#7d3f30', '#b7b2a8', '#c06a4a', '#e3d6bd', '#5d6b5e'];
    this.blds = []; let bx = 150, bi = 0;
    while (bx < 3500) { const bw = 90 + this.rand(bi * 7 + 1) * 90, bh = 150 + this.rand(bi * 7 + 2) * 190; this.blds.push({ x: bx, w: bw, h: bh, c: bc[Math.floor(this.rand(bi * 7 + 3) * bc.length)], roof: Math.floor(this.rand(bi * 7 + 4) * 4), shop: this.rand(bi * 7 + 5) > .5, aw: bc[Math.floor(this.rand(bi * 7 + 6) * bc.length)], seed: bi * 31 }); bx += bw + 8 + this.rand(bi * 7 + 7) * 26; bi++; }
    this.back = []; bx = -300; bi = 0;
    while (bx < 4600) { const bw = 70 + this.rand(bi * 5 + 500) * 110, bh = 230 + this.rand(bi * 5 + 501) * 240; this.back.push({ x: bx, w: bw, h: bh, c: ['#c3c8ce', '#d0cac0', '#b8c1c9', '#cbc2b4'][bi % 4], seed: bi * 17 + 900 }); bx += bw + this.rand(bi * 5 + 502) * 22; bi++; }
    this.mtn = [0, 1].map(L => Array.from({ length: 24 }, (_, k) => [700 + k * 150 + L * 70, (k % 2 ? 150 + this.rand(k * 3 + L * 40 + 8000) * 130 : 50 + this.rand(k * 5 + L * 40 + 8100) * 50) * (L ? 1 : 0.7)]));
    this.clouds = [700, 1600, 2600, 3500, 4400, 5300, 6200].map((x, i) => ({ x, y: 0.16 + this.rand(i + 9) * 0.1, pts: this.cloud(900 + i * 200) }));
    this.seeds = Array.from({ length: 22 }, (_, i) => ({ x: 3700 + this.rand(i + 70) * 900, off: this.rand(i + 90), sp: 0.3 + this.rand(i + 110) * 0.5 }));
    this.rain = Array.from({ length: 220 }, (_, i) => ({ x: this.rand(i + 300), y: this.rand(i + 400), sp: .5 + this.rand(i + 500) }));
    this.flakes = Array.from({ length: 55 }, (_, i) => ({ x: this.rand(i + 600), y: this.rand(i + 700), sp: .3 + this.rand(i + 800) * .6, rot: this.rand(i + 900) * 6 }));
    this.stars = Array.from({ length: 160 }, (_, i) => ({ x: this.rand(i + 1000), y: this.rand(i + 1100), s: this.rand(i + 1200) }));
    this.rows = Array.from({ length: 8 }, (_, k) => ({ y: 220 - k * 46, ci: k % 4, ph: this.rand(k + 40) * 100 }));
    this.vcol = ['#5f8fa0', '#c0725e', '#9a9a9a', '#d9a35b', '#7fa9a0'];
    this.houses = [[12300, 0], [12560, 0], [12850, 1], [13180, 0], [13450, 0]].map(([hx, type], hi) => {
      const pts: HousePoint[] = [], wins: [number, number, boolean?][] = [];
      const dashLine = (x1: number, y1: number, x2: number, y2: number, step: number, horiz: boolean) => { const d = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.floor(d / step)); for (let i = 0; i <= n; i++) { const t = i / n, k = pts.length; pts.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t, len: horiz ? 9 : 6, horiz, c: this.vcol[Math.floor(this.rand(hi * 997 + k) * 4)], s: this.rand(hi * 331 + k), a: this.rand(hi * 113 + k) * 6.28 }); } };
      if (type === 0) {
        const hw = 55 + this.rand(hi) * 20, hh = 70 + this.rand(hi + 5) * 25, rh = 40;
        dashLine(-hw, 0, -hw, -hh, 7, true); dashLine(hw, 0, hw, -hh, 7, true);
        dashLine(-hw - 12, -hh, 0, -hh - rh, 8, false); dashLine(0, -hh - rh, hw + 12, -hh, 8, false);
        dashLine(-12, 0, -12, -32, 7, true); dashLine(12, 0, 12, -32, 7, true);
        wins.push([-hw * 0.6, -hh * 0.55], [hw * 0.6, -hh * 0.55]);
      } else {
        const hw = 30, hh = 230;
        dashLine(-hw, 0, -hw, -hh, 7, true); dashLine(hw, 0, hw, -hh, 7, true);
        dashLine(-hw - 10, -hh, 0, -hh - 36, 7, false); dashLine(0, -hh - 36, hw + 10, -hh, 7, false);
        wins.push([0, -hh + 14, true]);
      }
      return { x: hx, pts, wins };
    });
    this.ridges = [0, 1].map(L => Array.from({ length: 30 }, (_, k) => [k * 150, -(k % 2 ? 140 + this.rand(k + L * 50) * 90 : 30 + this.rand(k + 9 + L * 50) * 40) * (L ? 0.7 : 1)]));
    const cs = getComputedStyle(document.documentElement), v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
    const n9 = this.rgb(v('--color-neutral-900', '#201f1d'));
    this.L = { bg: this.rgb(v('--color-bg', '#f3f2f2')), ink: this.rgb(v('--color-text', '#201f1d')), dot: this.rgb(v('--color-neutral-400', '#aaa')), mut: this.rgb(v('--color-neutral-500', '#888')), div: this.rgb(v('--color-divider', '#ddd')), sub: this.rgb(v('--color-accent-700', '#7a5420')) };
    this.D = { bg: n9.map(c => Math.round(c * 0.45)) as RGB, ink: this.L.bg, dot: this.rgb(v('--color-neutral-600', '#666')), mut: this.rgb(v('--color-neutral-400', '#aaa')), div: this.rgb(v('--color-neutral-700', '#444')), sub: this.rgb(v('--color-accent-300', '#e0c08a')) };
    this.NK = { bg: [18, 24, 38], ink: this.L.bg, dot: [84, 96, 118], mut: [150, 160, 180], div: [48, 58, 78], sub: this.rgb(v('--color-accent-300', '#e0c08a')) };
    this.shoot = []; this.nightV = 0;
    this.acc = v('--color-accent', '#b68235');
    this.pal = [v('--color-accent', '#b68235'), v('--color-accent-300', '#e0c08a'), v('--color-neutral-300', '#ccc'), v('--color-accent-2-400', '#9a9')];
    this.water = '#5b8fc7'; this.rainCol = '#7aa6d6';
    this.head = v('--font-heading', 'serif');
    try {
      const storedX = localStorage.getItem('wanderer-x2');
      const savedX = storedX === null ? NaN : Number.parseFloat(storedX);
      if (Number.isFinite(savedX) && savedX >= 60 && savedX <= this.W - 60) this.resumeX = savedX;
    } catch { this.resumeX = null; }
    this.kd = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') this.keys.l = true;
      if (k === 'd' || k === 'arrowright') this.keys.r = true;
      if (k === 'shift' && !this.keys.run) { this.keys.run = true; this.setState({ run: true }); }
      if (k === ' ') { e.preventDefault(); if (this.spaceCar()) {} else if (this.state.card >= 0 && this.cardOp > .6) this.setState(s => ({ expanded: !s.expanded })); }
      this.syncDir();
    };
    this.ku = (e: KeyboardEvent) => { const k = e.key.toLowerCase(); if (k === 'a' || k === 'arrowleft') this.keys.l = false; if (k === 'd' || k === 'arrowright') this.keys.r = false; if (k === 'shift') { this.keys.run = false; this.setState({ run: false }); } this.syncDir(); };
    this.blur = () => { this.keys.l = false; this.keys.r = false; this.keys.btn = 0; this.keys.run = false; this.setState({ run: false }); this.syncDir(); };
    window.addEventListener('keydown', this.kd); window.addEventListener('keyup', this.ku); window.addEventListener('blur', this.blur);
    this.last = performance.now(); this.t = 0;
    this.loadP = 0; this.loadT = 0; this.loadStart = performance.now(); this.loadDone = false;
    this.ldots = Array.from({ length: 70 }, (_, i) => ({ u: i / 69, a: this.rand(i + 3000) * 6.28, s: this.rand(i + 3100), c: [this.acc, '#4f8a5b', '#5b8fc7', '#c0725e', this.vcol[0]][Math.floor(this.rand(i + 3200) * 5)] }));
    const schedule = () => { this.raf = requestAnimationFrame(loop); this.to = setTimeout(() => { cancelAnimationFrame(this.raf); loop(performance.now()); }, 40); };
    const loop = (now: number) => { clearTimeout(this.to); cancelAnimationFrame(this.raf); if (this.dead) return; const dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000)); this.last = now; if (!this.introDone) this.introStep(dt); else this.step(dt); this.draw(); schedule(); };
    schedule();
  }
  introStep(dt: number): void { advanceIntro.call(this, dt); }
  drawIntro(ctx: CanvasRenderingContext2D, cam: number, screenY: ScreenY, width: number, palette: RenderPalette): void { renderIntro.call(this, ctx, cam, screenY, width, palette); }
  drawIntroInner(ctx: CanvasRenderingContext2D, cam: number, screenY: ScreenY, width: number, palette: RenderPalette): void { renderIntroLayer.call(this, ctx, cam, screenY, width, palette); }
  componentWillUnmount(): void {
    this.dead = true; clearTimeout(this.to); cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.kd); window.removeEventListener('keyup', this.ku); window.removeEventListener('blur', this.blur);
    if (this.ac && this.ac.state !== 'closed') {
      const ac = this.ac; this.ac = null; ac.close().catch(() => {});
    }
  }
  syncDir(): void { syncDirection.call(this); }
  step(dt: number): void { advanceWorld.call(this, dt); }
  spaceCar(): boolean { return handleCarAction.call(this); }
  exitCar(): void { leaveCar.call(this); }
  carStep(dt: number): void { advanceCar.call(this, dt); }
  drawCity(ctx: CanvasRenderingContext2D, cam: number, screenY: ScreenY, width: number, palette: RenderPalette): void { renderCity.call(this, ctx, cam, screenY, width, palette); }
  drawRoad(): void { renderRoad.call(this); }
  drawCar(ctx: CanvasRenderingContext2D, cam: number, screenY: ScreenY, width: number, palette: RenderPalette): void { renderCar.call(this, ctx, cam, screenY, width, palette); }
  tick(frequency?: number, length?: number): void { playTick.call(this, frequency, length); }
  toggleSound(): void { toggleAudio.call(this); }
  setLanguage(language: Language): void { changeLanguage.call(this, language); }
  dotLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, stepSize: number, radius: number): void { renderDotLine.call(this, ctx, x1, y1, x2, y2, stepSize, radius); }
  draw(): void { renderScene.call(this); }
  drawFigure(ctx: CanvasRenderingContext2D, x: number, groundY: number, palette: RenderPalette): void { renderFigure.call(this, ctx, x, groundY, palette); }
  renderVals(): ReturnType<typeof createViewModel> { return createViewModel.call(this); }
}
