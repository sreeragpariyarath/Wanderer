import type { Frame } from './frame';
import { seededRandom } from './math';
import type { RenderState } from './state';
import { terrainHeight } from './terrain';
import type { TreePoint } from './types';
// An organic tree like the design: a trunk that forks and forks again with
// gently curving limbs, under a lumpy crown built from overlapping clumps.
// Leaves are spread with dart throwing, so they look natural, not gridded.
export function createTreePoints(
  seed: number,
  h: number,
  type: number,
): TreePoint[] {
  let next = seed * 7.31;
  const rand = () => seededRandom((next += 1.618));
  const pts: TreePoint[] = [],
    wide = type % 2 === 0,
    R = h * (wide ? 0.34 : 0.3),
    stretch = wide ? 1.12 : 1,
    lean = (rand() - 0.5) * 0.1,
    cx = lean * h * 0.5,
    cy = -h + R * 0.9;
  // Crown clumps: [x, y, radius] in crown units, jittered per tree.
  const clumps = [
    [0, -0.4, 0.6],
    [-0.45, -0.12, 0.6],
    [0.45, -0.14, 0.6],
    [-0.86, 0.22, 0.48],
    [0.88, 0.18, 0.5],
    [-0.32, 0.36, 0.52],
    [0.32, 0.38, 0.52],
    [0, 0.02, 0.68],
  ].map(([x, y, r]) => ({
    x: cx + (x + (rand() - 0.5) * 0.16) * R * stretch,
    y: cy + (y + (rand() - 0.5) * 0.14) * R,
    r: r * R * (0.88 + rand() * 0.24),
    tone: rand(),
  }));

  const insideCrown = (x: number, y: number) =>
    clumps.some((c) => Math.hypot((x - c.x) / stretch, y - c.y) < c.r * 0.92);

  // Trunk and branches: recursive forks with a slight drift in angle.
  const limb = (
    x: number,
    y: number,
    angle: number,
    length: number,
    width: number,
    depth: number,
  ): void => {
    const steps = Math.max(3, Math.round(length / 5));
    let px = x,
      py = y,
      a = angle;
    for (let i = 0; i < steps; i++) {
      a += (rand() - 0.5) * 0.12;
      px += Math.cos(a) * 5;
      py += Math.sin(a) * 5;
      if (depth > 1 && !insideCrown(px, py)) return;
      const t = i / steps,
        lanes = Math.max(1, Math.round(width * (1 - t * 0.4)));
      for (let k = 0; k < lanes; k++)
        pts.push({
          x: px + (k - (lanes - 1) / 2) * 2.2,
          y: py,
          r: 1 + width * 0.32 * (1 - t * 0.3) + rand() * 0.3,
          trunk: true,
          c: rand(),
        });
    }
    if (depth >= 3) return;
    const forks = depth === 0 ? 3 : 2;
    for (let f = 0; f < forks; f++) {
      const spread =
        forks === 3
          ? [-0.62, 0.05, 0.58][f]
          : (f === 0 ? -1 : 1) * (0.38 + rand() * 0.28);
      limb(
        px,
        py,
        a + spread + (rand() - 0.5) * 0.15,
        depth === 0
          ? R * (0.68 + rand() * 0.14)
          : length * (0.55 + rand() * 0.12),
        Math.max(1, width - 1),
        depth + 1,
      );
    }
  };
  const forkHeight = h * (0.42 + rand() * 0.06);
  limb(0, 0, -Math.PI / 2 + lean, forkHeight, h > 380 ? 4 : 3, 0);

  // Leaves: dart throwing inside the clumps, looser at the edges.
  const minDist = Math.max(4.2, h * 0.016),
    cell = minDist,
    grid = new Map<string, Array<[number, number]>>(),
    left = cx - R * stretch * 1.35,
    top = cy - R * 1.15,
    width = R * stretch * 2.7,
    height = R * 2.15,
    tries = Math.round(((width * height) / (minDist * minDist)) * 4.5);
  for (let i = 0; i < tries; i++) {
    const x = left + rand() * width,
      y = top + rand() * height;
    let best = Infinity,
      tone = 0.5;
    for (const c of clumps) {
      const d = Math.hypot((x - c.x) / stretch, y - c.y) / c.r;
      if (d < best) {
        best = d;
        tone = c.tone;
      }
    }
    // Inside a clump, or a sparse scatter just beyond its edge.
    if (best > 1.12 || (best > 0.86 && rand() > (1.12 - best) / 0.26)) continue;
    // Fewer leaves low in the crown so the branches show through.
    if (y > cy + R * 0.3 && rand() < 0.25) continue;
    const gx = Math.floor(x / cell),
      gy = Math.floor(y / cell);
    let crowded = false;
    for (let ox = -1; ox <= 1 && !crowded; ox++)
      for (let oy = -1; oy <= 1 && !crowded; oy++)
        for (const [qx, qy] of grid.get(`${gx + ox},${gy + oy}`) ?? [])
          if (Math.hypot(qx - x, qy - y) < minDist) {
            crowded = true;
            break;
          }
    if (crowded) continue;
    const key = `${gx},${gy}`;
    grid.set(key, [...(grid.get(key) ?? []), [x, y]]);
    const c = rand();
    pts.push({
      x,
      y,
      r: minDist * (0.26 + c * 0.26),
      trunk: false,
      c,
      shade: 0.15 + ((y - top) / height) * 0.45 + (tone - 0.5) * 0.45,
    });
  }
  return pts;
}

export function renderTrees(
  s: Pick<RenderState, 'character' | 'time' | 'trees'>,
  frame: Frame,
): void {
  const { ctx, cam, SY, w, N } = frame;
  // trees
  for (const tr of s.trees) {
    const sx = tr.x - cam;
    if (sx < -200 || sx > w + 200) continue;
    const gy = SY(terrainHeight(s.character.x, tr.x)),
      ts = Math.min(1, (gy - 100) / tr.h);
    ctx.save();
    ctx.translate(sx, gy);
    ctx.scale(ts, ts);
    ctx.translate(-sx, -gy);
    for (const p of tr.pts) {
      const sway = p.trunk
        ? 0
        : Math.sin(s.time * 0.8 + p.y * 0.02) * (-p.y / 300) * 4;
      const k = seededRandom(p.x * 13.1 + p.y * 7.7),
        fm = s.character.treeVisibility,
        vis = p.trunk
          ? 0.5 + fm * 0.5
          : Math.max(0, Math.min(1, (fm - k * 0.85) / 0.15));
      if (vis <= 0.01) continue;
      const sc = (1 - fm) * (p.trunk ? 4 : 18),
        ang = k * 40;
      const ox = Math.cos(ang) * sc,
        oy = Math.sin(ang) * sc * 0.6 + (1 - fm) * k * 8;
      ctx.globalAlpha = p.trunk ? 0.78 + p.c * 0.2 : 0.45 + p.c * 0.45;
      const shade = p.shade ?? 0.5;
      const tone = shade + (p.c - 0.5) * 0.6;
      ctx.fillStyle = p.trunk
        ? p.c > 0.5
          ? '#4a3828'
          : '#5a4535'
        : tone < 0.2
          ? '#8fb39a'
          : tone < 0.42
            ? '#5f8f6c'
            : tone < 0.7
              ? '#3d6e48'
              : '#2c5236';
      ctx.globalAlpha *= vis * (1 - 0.35 * N);
      ctx.beginPath();
      ctx.arc(
        sx + p.x + sway + ox,
        gy + p.y + oy,
        p.r * (0.6 + 0.4 * vis),
        0,
        7,
      );
      ctx.fill();
    }
    ctx.restore();
  }
}
