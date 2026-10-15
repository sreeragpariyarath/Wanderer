import type { Frame } from './frame';
import type { RenderState } from './state';

export function renderParticleRender(
  s: Pick<RenderState, 'parts' | 'time'>,
  frame: Frame,
): void {
  const { ctx, cam, SY, w, col } = frame;
  // splash
  for (const p of s.parts) {
    const fade = Math.min(1, p.life / Math.max(0.01, (p.max || 1) * 0.4)),
      sx = p.x - cam,
      sy = SY(p.y);
    if (sx < -20 || sx > w + 20) continue;
    ctx.globalAlpha = fade * 0.85;
    if (p.k === 'drop') {
      ctx.fillStyle = p.c ?? col.dot;
      ctx.beginPath();
      ctx.arc(sx, sy, p.r ?? 1, 0, 7);
      ctx.fill();
    } else if (p.k === 'rect') {
      const width = p.w ?? 0;
      ctx.fillStyle = col.ink;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(p.rot ?? 0);
      ctx.fillRect(-width / 2, -1.6, width, 3.2);
      ctx.restore();
    } else if (p.k === 'petal') {
      ctx.fillStyle = p.c ?? col.dot;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate((p.rot ?? 0) + s.time);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 4, 0, Math.PI * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}
