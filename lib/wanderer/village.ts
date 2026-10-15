import type { Frame } from './frame';
import { seededRandom, smoothStep } from './math';
import type { RenderState } from './state';
import { terrainHeight } from './terrain';

export function renderVillage(
  s: Pick<
    RenderState,
    'character' | 'houses' | 'ridges' | 'time' | 'villageColors'
  >,
  frame: Frame,
): void {
  const { ctx, cam, SY, w, X, baseY, camY } = frame;
  // mountains + houses (village)
  const vilA = smoothStep(11800, 12200, X) * (1 - smoothStep(13800, 14100, X));
  if (vilA > 0) {
    const mv = Math.min(1, Math.abs(s.character.velocityX) / 170);
    s.ridges.forEach((rid, L) => {
      const par = L ? 0.3 : 0.5,
        oy = baseY - (L ? 150 : 90) - (camY - -560) * 0.3;
      for (let k = 0; k < rid.length - 1; k++) {
        const x1 = rid[k][0] - (cam - 11600) * par,
          y1 = oy + rid[k][1],
          x2 = x1 + 150,
          y2 = oy + rid[k + 1][1];
        if (x2 < -20 || x1 > w + 20) continue;
        const n = 16;
        for (let i = 0; i <= n; i++) {
          const t = i / n,
            seed = k * 31 + i + L * 999,
            rv = seededRandom(seed);
          if (rv < 0.35) continue;
          ctx.globalAlpha = vilA * (L ? 0.25 : 0.4) * (0.5 + rv * 0.5);
          ctx.fillStyle =
            s.villageColors[Math.floor(seededRandom(seed * 3) * 4)];
          ctx.fillRect(
            x1 + (x2 - x1) * t,
            y1 + (y2 - y1) * t + Math.sin(s.time + seed) * mv,
            7,
            1.6,
          );
        }
      }
    });
    for (const hs of s.houses) {
      const sx = hs.x - cam;
      if (sx < -200 || sx > w + 200) continue;
      const gy = SY(terrainHeight(s.character.x, hs.x));
      const asm = smoothStep(hs.x - 950, hs.x - 380, X);
      if (asm <= 0.01) continue;
      for (const p of hs.pts) {
        const sc = (1 - asm) * (140 + p.s * 220),
          lift = (1 - asm) * p.s * 120;
        const shimmer = mv * Math.sin(s.time * 4 + p.a * 3) * 1.4;
        const px = sx + p.x + Math.cos(p.a) * sc,
          py = gy + p.y + Math.sin(p.a) * sc * 0.6 - lift + shimmer;
        ctx.globalAlpha = vilA * Math.min(1, asm * 1.4) * (0.55 + p.s * 0.35);
        ctx.fillStyle = p.c;
        if (p.horiz) ctx.fillRect(px - p.len / 2, py, p.len, 1.8);
        else {
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(p.a * (1 - asm));
          ctx.fillRect(-p.len / 2, -1, p.len, 2);
          ctx.restore();
        }
      }
      hs.wins.forEach((wn, wi) => {
        const a2 = smoothStep(0.6, 1, asm);
        if (a2 <= 0) return;
        const wx = sx + wn[0],
          wy = gy + wn[1],
          pulse = 1 + Math.sin(s.time * 2 + wi + hs.x) * 0.06;
        ctx.globalAlpha = vilA * a2 * 0.7;
        if (wn[2]) {
          ctx.strokeStyle = s.villageColors[3];
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(wx, wy, 13 * pulse, 0, 7);
          ctx.stroke();
        } else {
          ctx.fillStyle =
            s.villageColors[(wi + Math.round(hs.x / 100)) % 2 ? 1 : 0];
          ctx.beginPath();
          ctx.ellipse(wx, wy, 9 * pulse, 6 * pulse, 0, 0, 7);
          ctx.fill();
        }
      });
    }
  }
}
