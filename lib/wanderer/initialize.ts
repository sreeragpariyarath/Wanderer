import { createCloudPoints } from './clouds';
import { seededRandom } from './math';
import { SceneState } from './state';
import { createTreePoints } from './trees';
import type { HousePoint } from './types';
export function createScene(): SceneState {
  const s = new SceneState();
  s.trees = [
    [3850, 260, 0],
    [4080, 340, 3],
    [4300, 230, 0],
    [4560, 380, 0],
    [4800, 290, 3],
    [5050, 240, 0],
    [5330, 360, 3],
    [5580, 270, 0],
    [5840, 330, 0],
    [6080, 250, 3],
    [6330, 300, 0],
    [6560, 230, 3],
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
  s.mountains = [0, 1].map((L) =>
    Array.from({ length: 24 }, (_, k) => [
      700 + k * 150 + L * 70,
      (k % 2
        ? 150 + seededRandom(k * 3 + L * 40 + 8000) * 130
        : 50 + seededRandom(k * 5 + L * 40 + 8100) * 50) * (L ? 1 : 0.7),
    ]),
  );
  s.clouds = [700, 1600, 2600, 3500, 4400, 5300, 6200].map((x, i) => ({
    x,
    y: 0.16 + seededRandom(i + 9) * 0.1,
    pts: createCloudPoints(900 + i * 200),
  }));
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
  s.houses = [
    [12300, 0],
    [12560, 0],
    [12850, 1],
    [13180, 0],
    [13450, 0],
  ].map(([hx, type], hi) => {
    const pts: HousePoint[] = [],
      wins: [number, number, boolean?][] = [];
    const dashLine = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      step: number,
      horiz: boolean,
    ) => {
      const d = Math.hypot(x2 - x1, y2 - y1),
        n = Math.max(1, Math.floor(d / step));
      for (let i = 0; i <= n; i++) {
        const t = i / n,
          k = pts.length;
        pts.push({
          x: x1 + (x2 - x1) * t,
          y: y1 + (y2 - y1) * t,
          len: horiz ? 9 : 6,
          horiz,
          c: s.villageColors[Math.floor(seededRandom(hi * 997 + k) * 4)],
          s: seededRandom(hi * 331 + k),
          a: seededRandom(hi * 113 + k) * 6.28,
        });
      }
    };
    if (type === 0) {
      const hw = 55 + seededRandom(hi) * 20,
        hh = 70 + seededRandom(hi + 5) * 25,
        rh = 40;
      dashLine(-hw, 0, -hw, -hh, 7, true);
      dashLine(hw, 0, hw, -hh, 7, true);
      dashLine(-hw - 12, -hh, 0, -hh - rh, 8, false);
      dashLine(0, -hh - rh, hw + 12, -hh, 8, false);
      dashLine(-12, 0, -12, -32, 7, true);
      dashLine(12, 0, 12, -32, 7, true);
      wins.push([-hw * 0.6, -hh * 0.55], [hw * 0.6, -hh * 0.55]);
    } else {
      const hw = 30,
        hh = 230;
      dashLine(-hw, 0, -hw, -hh, 7, true);
      dashLine(hw, 0, hw, -hh, 7, true);
      dashLine(-hw - 10, -hh, 0, -hh - 36, 7, false);
      dashLine(0, -hh - 36, hw + 10, -hh, 7, false);
      wins.push([0, -hh + 14, true]);
    }
    return { x: hx, pts, wins };
  });
  s.ridges = [0, 1].map((L) =>
    Array.from({ length: 30 }, (_, k) => [
      k * 150,
      -(k % 2
        ? 140 + seededRandom(k + L * 50) * 90
        : 30 + seededRandom(k + 9 + L * 50) * 40) * (L ? 0.7 : 1),
    ]),
  );

  const SWX = -330,
    LEDGE = -150,
    PIV = LEDGE - 215;
  s.introTree = [];
  for (let i = 0; i < 60; i++) {
    const u = seededRandom(i + 4000);
    s.introTree.push({
      x: SWX - 110 + (seededRandom(i + 4100) - 0.5) * 9,
      yy: PIV + u * (LEDGE - PIV),
      r: 1.3 + seededRandom(i + 4200) * 2,
      t: 1,
      c: 0,
    });
  }
  for (let i = 0; i < 30; i++) {
    const u = i / 29;
    s.introTree.push({
      x: SWX - 110 + u * 150,
      yy: PIV - Math.sin(u * 3) * 5 + (seededRandom(i + 4300) - 0.5) * 3,
      r: 1.2 + seededRandom(i + 4400) * 1.5,
      t: 1,
      c: 0,
    });
  }
  for (let i = 0; i < 320; i++) {
    const an = seededRandom(i + 4500) * 6.28,
      rr = Math.sqrt(seededRandom(i + 4600));
    s.introTree.push({
      x: SWX - 50 + Math.cos(an) * rr * 120,
      yy: PIV - 18 + Math.sin(an) * rr * 40,
      r: 1.3 + seededRandom(i + 4700) * 2.6,
      t: 0,
      c: seededRandom(i + 4800),
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
