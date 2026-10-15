import type { Frame } from './frame';
import { seededRandom } from './math';
import type { RenderState } from './state';
import { terrainHeight } from './terrain';
import type { TreePoint } from './types';
export function createTreePoints(
  seed: number,
  h: number,
  type: number,
): TreePoint[] {
  const pts: TreePoint[] = [];
  const T = [
    {
      R: 0.32,
      sx: 1,
      sy: 0.9,
      trunk: 0.38,
      blobs: [
        [0, 0, 1],
        [-0.55, 0.35, 0.7],
        [0.55, 0.3, 0.72],
        [-0.2, -0.45, 0.68],
        [0.3, -0.4, 0.62],
      ],
    },
    {
      R: 0.22,
      sx: 0.9,
      sy: 1.6,
      trunk: 0.3,
      blobs: [
        [0, 0, 1],
        [0, -0.7, 0.8],
        [0, 0.7, 0.85],
        [-0.3, 0.2, 0.7],
        [0.3, -0.2, 0.7],
      ],
    },
    {
      R: 0.3,
      sx: 1.6,
      sy: 0.7,
      trunk: 0.5,
      blobs: [
        [0, 0, 1],
        [-1, 0.25, 0.75],
        [1, 0.2, 0.8],
        [-0.5, -0.35, 0.7],
        [0.55, -0.3, 0.65],
      ],
    },
    {
      R: 0.26,
      sx: 1,
      sy: 0.9,
      trunk: 0.45,
      blobs: [
        [-0.6, 0.1, 0.85],
        [0.7, -0.25, 0.9],
        [0.05, -0.75, 0.7],
        [0, 0.3, 0.6],
      ],
    },
    {
      R: 0.4,
      sx: 1.3,
      sy: 0.8,
      trunk: 0.2,
      blobs: [
        [0, 0, 1],
        [-0.6, 0.2, 0.75],
        [0.6, 0.25, 0.7],
      ],
    },
  ][type % 5];
  const R = h * T.R,
    cy = -h + R * T.sy;
  const lean = (seededRandom(seed + 7) - 0.5) * 0.25;
  const tH = h - R * T.sy * (1 - T.trunk);
  for (let i = 0; i < 90; i++) {
    const a = seededRandom(seed + i * 3),
      b = seededRandom(seed + i * 3 + 1),
      c = seededRandom(seed + i * 3 + 2);
    pts.push({
      x: (a - 0.5) * (6 + h * 0.03) * (1 + (1 - b) * 0.4) + lean * b * tH,
      y: -b * tH,
      r: 1 + c * 2,
      trunk: true,
      c,
    });
  }
  if (type % 5 === 2)
    for (let i = 0; i < 40; i++) {
      const b = seededRandom(seed + 300 + i),
        s = i % 2 ? 1 : -1;
      pts.push({
        x: lean * tH * 0.6 + s * b * R * 0.9,
        y: -tH * 0.6 - b * R * 0.5,
        r: 1 + seededRandom(seed + 400 + i) * 1.5,
        trunk: true,
        c: 0.5,
      });
    }
  const n = Math.round(260 + h * 1.1);
  for (let i = 0; i < n; i++) {
    const a = seededRandom(seed + 5000 + i * 3),
      b = seededRandom(seed + 5001 + i * 3),
      c = seededRandom(seed + 5002 + i * 3);
    const bl =
      T.blobs[Math.floor(seededRandom(seed + 9000 + i) * T.blobs.length)];
    const ang = a * Math.PI * 2,
      rr = Math.sqrt(b) * R * bl[2];
    const x = lean * tH + bl[0] * R * T.sx + Math.cos(ang) * rr * T.sx,
      y = cy + bl[1] * R * T.sy + Math.sin(ang) * rr * T.sy * 0.85;
    const shade =
      (y - (cy - R * T.sy)) / (R * T.sy * 2.2) + (x / (R * T.sx)) * 0.15;
    pts.push({ x, y, r: 1.2 + c * 3, trunk: false, c, shade });
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
      ctx.globalAlpha = p.trunk ? 0.6 + p.c * 0.3 : 0.45 + p.c * 0.45;
      const shade = p.shade ?? 0.5;
      ctx.fillStyle = p.trunk
        ? p.c > 0.5
          ? '#6b5544'
          : '#8a7462'
        : shade + (p.c - 0.5) * 0.5 < 0.35
          ? '#4f8a5b'
          : shade + (p.c - 0.5) * 0.5 < 0.7
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
