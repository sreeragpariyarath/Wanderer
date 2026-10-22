import { seededRandom } from './math';
import { SceneState } from './state';
import { createTreePoints } from './trees';
export function createScene(): SceneState {
  const s = new SceneState();
  // Medium trees with room between them, and one large tree, as in the design.
  s.trees = [
    [3800, 270, 0],
    [4090, 300, 3],
    [4380, 250, 0],
    [4680, 310, 3],
    [5050, 420, 0],
    [5420, 260, 3],
    [5720, 300, 0],
    [6020, 240, 3],
    [6310, 290, 0],
    [6580, 260, 3],
  ].map(([x, h, t], i) => ({
    x,
    h,
    pts: createTreePoints(50 + i * 400, h, t),
  }));

  s.vehicle = {
    x: 760,
    v: 0,
    rot: 0,
    in: false,
    endT: 0,
    startX: 760,
    arrived: false,
  };
  s.puffs = [];
  const bc = [
    '#a4553d',
    '#c9a25a',
    '#6f7d8c',
    '#d9c4a0',
    '#8fa3b5',
    '#7d3f30',
    '#b7b2a8',
    '#c06a4a',
    '#e3d6bd',
    '#5d6b5e',
  ];
  s.buildings = [];
  let bx = 650,
    bi = 0;
  while (bx < 3500) {
    const bw = 90 + seededRandom(bi * 7 + 1) * 90,
      bh = 150 + seededRandom(bi * 7 + 2) * 190;
    s.buildings.push({
      x: bx,
      w: bw,
      h: bh,
      c: bc[Math.floor(seededRandom(bi * 7 + 3) * bc.length)],
      roof: Math.floor(seededRandom(bi * 7 + 4) * 4),
      shop: seededRandom(bi * 7 + 5) > 0.5,
      aw: bc[Math.floor(seededRandom(bi * 7 + 6) * bc.length)],
      seed: bi * 31,
    });
    bx += bw + 8 + seededRandom(bi * 7 + 7) * 26;
    bi++;
  }
  s.seeds = Array.from({ length: 22 }, (_, i) => ({
    x: 3700 + seededRandom(i + 70) * 900,
    off: seededRandom(i + 90),
    sp: 0.3 + seededRandom(i + 110) * 0.5,
  }));
  s.rain = Array.from({ length: 220 }, (_, i) => ({
    x: seededRandom(i + 300),
    y: seededRandom(i + 400),
    sp: 0.5 + seededRandom(i + 500),
  }));
  s.stars = Array.from({ length: 160 }, (_, i) => ({
    x: seededRandom(i + 1000),
    y: seededRandom(i + 1100),
    s: seededRandom(i + 1200),
  }));
  s.villageColors = ['#5f8fa0', '#c0725e', '#9a9a9a', '#d9a35b', '#7fa9a0'];

  const SWX = -330,
    LEDGE = -150,
    PIV = LEDGE - 215;
  // The intro tree, as in the design: a thick pebbled trunk that leans and
  // curves to the right, a long limb out to the swing, and a wide, loose
  // crown spreading over both.
  s.introTree = [];
  const baseX = SWX - 210,
    forkX = SWX - 150,
    forkY = LEDGE - 230;
  // Trunk: tidy rows of round pebbles across a smooth curve, tapering up.
  for (let i = 0; i <= 46; i++) {
    const t = i / 46,
      cx =
        (1 - t) * (1 - t) * baseX +
        2 * (1 - t) * t * (baseX - 10) +
        t * t * forkX,
      cy = LEDGE + (forkY - LEDGE) * t,
      half = 13 * (1 - t) + 5,
      lanes = Math.max(2, Math.round(half / 3.4)),
      shift = i % 2 ? 0.5 : 0;
    for (let k = 0; k < lanes; k++) {
      const u = (k + shift) / lanes - 0.5;
      s.introTree.push({
        x: cx + u * half * 2,
        yy: cy + (seededRandom(i * 7 + k + 4100) - 0.5) * 1.5,
        r: 2.6 + seededRandom(i * 7 + k + 4200) * 0.9 - t * 0.6,
        t: 1,
        c: 0,
      });
    }
  }
  // Limbs: one long arm to the swing pivot, a few shorter ones into the crown.
  for (const [n, [tx, ty, w]] of [
    [SWX, PIV, 7],
    [SWX - 330, LEDGE - 300, 3.5],
    [SWX - 150, LEDGE - 340, 3.5],
    [SWX - 30, LEDGE - 320, 3],
  ].entries())
    for (let i = 0; i <= 50; i++) {
      const u = i / 50,
        bow = Math.sin(u * Math.PI) * (n === 0 ? -26 : -14);
      s.introTree.push({
        x:
          forkX +
          (tx - forkX) * u +
          (seededRandom(i + n * 97 + 4300) - 0.5) * 2,
        yy: forkY + (ty - forkY) * u + bow,
        r: w * (1 - u * 0.6) * (0.5 + seededRandom(i + n * 97 + 4400) * 0.3),
        t: 1,
        c: 0,
      });
    }
  // Wide, loose crown: dense in the middle and scattered at the edges.
  const crownX = SWX - 160,
    crownY = LEDGE - 330;
  for (let i = 0; i < 1500; i++) {
    const a = seededRandom(i + 4500) * Math.PI * 2,
      rr = Math.pow(seededRandom(i + 4600), 0.62),
      x = crownX + Math.cos(a) * rr * 250,
      y = crownY + Math.sin(a) * rr * 120 + (Math.cos(a) * rr > 0 ? 10 : 0);
    s.introTree.push({
      x,
      yy: y,
      r: 1.2 + seededRandom(i + 4700) * 3.4 * (1 - rr * 0.5),
      t: 0,
      c: seededRandom(i + 4800) * 0.5 + (y - (crownY - 120)) / 480,
    });
  }
  s.introDots = Array.from({ length: 70 }, (_, i) => ({
    u: i / 69,
    a: seededRandom(i + 3000) * 6.28,
    s: seededRandom(i + 3100),
    c: [s.accent, '#4f8a5b', '#5b8fc7', '#c0725e', s.villageColors[0]][
      Math.floor(seededRandom(i + 3200) * 5)
    ],
  }));

  return s;
}
