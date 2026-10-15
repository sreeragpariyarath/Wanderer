import type { RenderState } from './state';
import { terrainHeight } from './terrain';
import type { RenderPalette, ScreenY } from './types';
export function renderCar(
  s: Pick<
    RenderState,
    | 'accent'
    | 'character'
    | 'intro'
    | 'introDone'
    | 'nightIntensity'
    | 'puffs'
    | 'time'
    | 'vehicle'
  >,
  ctx: CanvasRenderingContext2D,
  cam: number,
  SY: ScreenY,
  w: number,
  col: RenderPalette,
): void {
  const C = s.vehicle,
    sx = C.x - cam,
    rv = s.introDone ? 1 : Math.min(1, (s.intro.reveal || 0) / 700);
  if (rv <= 0) return;
  for (const p of s.puffs) {
    ctx.globalAlpha = p.life * 0.5 * rv;
    ctx.fillStyle = col.dot;
    ctx.beginPath();
    ctx.arc(p.x - cam, SY(p.y), p.r * 0.6, 0, 7);
    ctx.fill();
  }
  if (sx < -160 || sx > w + 160) {
    ctx.globalAlpha = 1;
    return;
  }
  const gy = SY(terrainHeight(s.character.x, C.x)),
    ang = Math.atan2(
      terrainHeight(s.character.x, C.x + 50) -
        terrainHeight(s.character.x, C.x - 50),
      100,
    );
  const bump =
    Math.abs(C.v) > 5
      ? Math.sin(s.time * 22) * 0.8 * Math.min(1, Math.abs(C.v) / 400)
      : C.in
        ? Math.sin(s.time * 30) * 0.3
        : 0;
  ctx.save();
  ctx.translate(sx, gy);
  ctx.rotate(ang);
  ctx.scale(1.45, 1.45);
  ctx.globalAlpha = rv;
  ctx.lineWidth = 1.6 / 1.45;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.save();
  ctx.translate(0, bump - 1);
  {
    const N2 = s.nightIntensity || 0;
    if (N2 > 0.02) {
      const gr = ctx.createLinearGradient(68, 0, 270, 0);
      gr.addColorStop(0, `rgba(242,210,122,${0.5 * N2})`);
      gr.addColorStop(1, 'rgba(242,210,122,0)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.moveTo(68, -30);
      ctx.lineTo(270, -56);
      ctx.lineTo(270, 8);
      ctx.lineTo(68, -24);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = `rgba(242,210,122,${0.35 * N2})`;
      ctx.beginPath();
      ctx.arc(67.5, -27, 7, 0, 7);
      ctx.fill();
      ctx.fillStyle = `rgba(224,80,58,${0.35 * N2})`;
      ctx.beginPath();
      ctx.arc(-66, -27, 6, 0, 7);
      ctx.fill();
    }
  }
  ctx.fillStyle = col.bg;
  ctx.strokeStyle = col.ink;
  ctx.beginPath();
  ctx.moveTo(-66, -14);
  ctx.quadraticCurveTo(-69, -24, -66, -31);
  ctx.quadraticCurveTo(-62, -37, -50, -38);
  ctx.lineTo(-44, -39);
  ctx.bezierCurveTo(-38, -58, -26, -62, -10, -62);
  ctx.lineTo(10, -62);
  ctx.bezierCurveTo(20, -62, 26, -54, 34, -42);
  ctx.bezierCurveTo(46, -40, 62, -38, 68, -32);
  ctx.quadraticCurveTo(72, -25, 70, -14);
  ctx.lineTo(59, -14);
  ctx.arc(44, -14, 15, 0, Math.PI, true);
  ctx.lineTo(-27, -14);
  ctx.arc(-42, -14, 15, 0, Math.PI, true);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-39, -41);
  ctx.bezierCurveTo(-34, -54, -26, -57, -13, -57);
  ctx.lineTo(-6, -57);
  ctx.lineTo(-6, -41);
  ctx.closePath();
  ctx.moveTo(-1, -41);
  ctx.lineTo(-1, -57);
  ctx.lineTo(8, -57);
  ctx.bezierCurveTo(16, -57, 22, -51, 28, -42);
  ctx.closePath();
  ctx.stroke();
  ctx.globalAlpha = rv * 0.35;
  ctx.beginPath();
  ctx.moveTo(-28, -44);
  ctx.lineTo(-22, -53);
  ctx.moveTo(14, -44);
  ctx.lineTo(19, -51);
  ctx.stroke();
  ctx.globalAlpha = rv;
  ctx.beginPath();
  ctx.moveTo(-3.5, -41);
  ctx.lineTo(-3.5, -20);
  ctx.quadraticCurveTo(-3.5, -16, 0, -16);
  ctx.moveTo(31, -41);
  ctx.quadraticCurveTo(32, -28, 28, -18);
  ctx.moveTo(2, -35);
  ctx.lineTo(8, -35);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(29, -42);
  ctx.quadraticCurveTo(31, -48, 37, -45);
  ctx.lineTo(35, -42);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = col.mut;
  ctx.beginPath();
  ctx.moveTo(67, -16);
  ctx.lineTo(74, -16);
  ctx.moveTo(-63, -16);
  ctx.lineTo(-70, -16);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = s.accent;
  for (let x = -60; x <= 64; x += 5.5) {
    {
      ctx.globalAlpha = rv * 0.85;
      ctx.beginPath();
      ctx.arc(x, -31.5, 1.1, 0, 7);
      ctx.fill();
    }
  }
  ctx.globalAlpha = rv;
  ctx.fillStyle = '#d9a35b';
  ctx.beginPath();
  ctx.ellipse(67.5, -27, 2, 3.2, 0, 0, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c0725e';
  ctx.beginPath();
  ctx.ellipse(-66, -27, 1.6, 3.4, 0, 0, 7);
  ctx.fill();
  if (C.in) {
    ctx.strokeStyle = col.ink;
    ctx.beginPath();
    ctx.arc(10, -47, 4.5, 0, 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4.5, -49);
    ctx.quadraticCurveTo(10, -56.5, 15.5, -49);
    ctx.lineTo(18.5, -49);
    ctx.stroke();
    ctx.strokeStyle = s.accent;
    ctx.beginPath();
    ctx.moveTo(6, -41.5);
    ctx.lineTo(14, -41.5);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = col.ink;
  for (const wx of [-42, 44]) {
    ctx.fillStyle = col.bg;
    ctx.beginPath();
    ctx.arc(wx, -11, 11, 0, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = col.dot;
    ctx.globalAlpha = rv * 0.5;
    ctx.beginPath();
    ctx.arc(wx, -11, 5, 0, 7);
    ctx.fill();
    ctx.globalAlpha = rv;
    ctx.stroke();
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const an = C.rot + k * 1.2566;
      ctx.moveTo(wx + Math.cos(an) * 5, -11 + Math.sin(an) * 5);
      ctx.lineTo(wx + Math.cos(an) * 8.5, -11 + Math.sin(an) * 8.5);
    }
    ctx.stroke();
    ctx.fillStyle = col.ink;
    ctx.beginPath();
    ctx.arc(wx, -11, 1.2, 0, 7);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}
