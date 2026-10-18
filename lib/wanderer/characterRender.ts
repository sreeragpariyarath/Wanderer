import type { RenderState } from './state';
import type { RenderPalette } from './types';
export function renderFigure(
  s: Pick<RenderState, 'accent' | 'character' | 'time'>,
  ctx: CanvasRenderingContext2D,
  x: number,
  gy: number,
  C: RenderPalette,
): void {
  if (s.character.mode === 'swimming') {
    renderSwimmer(s, ctx, x, gy, C);
    return;
  }
  const sitting = s.character.sitting,
    ph = s.character.gaitPhase,
    moving = Math.abs(s.character.velocityX) > 4 && s.character.velocityY === 0;
  const amp = moving ? Math.min(1.5, Math.abs(s.character.velocityX) / 170) : 0;
  const lean =
    (Math.max(0, Math.abs(s.character.velocityX) - 170) / 250) * 0.18;
  const bob = Math.abs(Math.sin(ph)) * 2 * amp;
  ctx.save();
  ctx.translate(x, gy);
  ctx.rotate(lean * s.character.facing);
  ctx.scale(s.character.facing, 1);
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const Lg = 22,
    hipY = -2 * Lg + 2 - bob + sitting * 30,
    neckY = hipY - 34,
    headY = neckY - 13;
  const air = s.character.velocityY !== 0;
  const ik = (fx: number, fy: number) => {
    const dx = fx,
      dy = fy - hipY,
      d = Math.min(Lg * 2 - 0.01, Math.hypot(dx, dy));
    const base = Math.atan2(dy, dx),
      off = Math.acos(d / (2 * Lg));
    const ka = base - off;
    const kx = Math.cos(ka) * Lg,
      ky = hipY + Math.sin(ka) * Lg;
    ctx.beginPath();
    ctx.moveTo(0, hipY);
    ctx.lineTo(kx, ky);
    ctx.lineTo(fx, fy);
    ctx.lineTo(fx + 6, fy);
    ctx.stroke();
  };
  const gait = (p: number): [number, number] => {
    const stride = 13 * amp,
      c = Math.cos(p);
    return [Math.sin(p) * stride, -(c > 0 ? c * 7 * amp : 0)];
  };
  if (sitting > 0.5) {
    ik(24, 0);
    ik(28, 0);
  } else if (air) {
    ik(10, hipY + 34);
    ik(-6, hipY + 38);
  } else {
    const a = gait(ph),
      b = gait(ph + Math.PI);
    ik(a[0], a[1]);
    ik(b[0], b[1]);
  }
  ctx.beginPath();
  ctx.moveTo(-3, neckY);
  ctx.quadraticCurveTo(-9, hipY - 10, -8, hipY + 4);
  ctx.lineTo(8, hipY + 4);
  ctx.quadraticCurveTo(9, hipY - 10, 3, neckY);
  ctx.stroke();
  const arm = (a: number) => {
    const ex = Math.sin(a) * 13,
      ey = neckY + 4 + Math.cos(a) * 13;
    ctx.beginPath();
    ctx.moveTo(0, neckY + 4);
    ctx.lineTo(ex, ey);
    ctx.lineTo(ex + Math.sin(a + 0.4) * 12, ey + Math.cos(a + 0.4) * 12);
    ctx.stroke();
  };
  if (sitting > 0.5) {
    ctx.beginPath();
    ctx.moveTo(0, neckY + 4);
    ctx.lineTo(10, neckY + 16);
    ctx.lineTo(18, hipY - 8);
    ctx.stroke();
  } else if (air) {
    arm(2.4);
    arm(-2.2);
  } else if (s.character.waveAmount > 0) {
    arm(0.05);
    const wv = s.character.waveAmount,
      sh = [0, neckY + 4],
      el = [6 + 4 * wv, neckY + 4 - 12 * wv + (1 - wv) * 13];
    const fa = -Math.PI / 2 + Math.sin(s.time * 14) * 0.45 * wv,
      hx = el[0] + Math.cos(fa) * 12 * wv + (1 - wv) * 2,
      hy = el[1] + Math.sin(fa) * 12 * wv + (1 - wv) * 12;
    ctx.beginPath();
    ctx.moveTo(sh[0], sh[1]);
    ctx.lineTo(el[0], el[1]);
    ctx.lineTo(hx, hy);
    ctx.stroke();
  } else {
    arm(Math.sin(ph + Math.PI) * 0.45 * amp);
    arm(Math.sin(ph) * 0.45 * amp);
  }
  ctx.strokeStyle = s.accent;
  const flutter = Math.sin(s.time * 6) * 3 * (0.3 + amp);
  ctx.beginPath();
  ctx.moveTo(-4, neckY);
  ctx.lineTo(4, neckY);
  ctx.moveTo(-3, neckY + 1);
  ctx.quadraticCurveTo(
    -12,
    neckY + 2 + flutter,
    -20 - amp * 6,
    neckY + 6 - flutter,
  );
  ctx.stroke();
  ctx.strokeStyle = C.ink;
  ctx.beginPath();
  ctx.arc(0, headY, 9, 0, 7);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-10, headY - 3);
  ctx.quadraticCurveTo(0, headY - 18, 10, headY - 3);
  ctx.lineTo(16, headY - 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(4, headY + 1, 0.9, 0, 7);
  ctx.fillStyle = C.ink;
  ctx.fill();
  ctx.restore();
}

/** The swimmer is drawn around the torso, horizontally, rather than rotating
 * the walking pose around its feet. Facing mirrors the complete stroke. */
function renderSwimmer(
  s: Pick<RenderState, 'accent' | 'character' | 'time'>,
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  palette: RenderPalette,
): void {
  const phase = s.character.gaitPhase;
  const kick = Math.sin(phase * 1.35);
  const pitch = Math.max(-0.2, Math.min(0.2, s.character.velocityY / 520));
  const bob = Math.sin(s.time * 3.2) * 0.6;
  ctx.save();
  ctx.translate(x, y - 30 + bob);
  ctx.scale(s.character.facing, 1);
  ctx.rotate(pitch);
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = 1.65;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const limb = (points: ReadonlyArray<readonly [number, number]>) => {
    ctx.beginPath();
    points.forEach(([px, py], index) =>
      index === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py),
    );
    ctx.stroke();
  };

  // The rear limbs are drawn first so the body keeps a clean silhouette.
  ctx.globalAlpha = 0.58;
  limb([
    [-16, 1],
    [-33, 3 - kick * 4],
    [-50, 8 - kick * 7],
    [-57, 6 - kick * 7],
  ]);
  const farArmPhase = phase + Math.PI;
  const farReach = Math.cos(farArmPhase);
  limb([
    [8, -2],
    [8 + farReach * 15, -1 + Math.sin(farArmPhase) * 9],
    [9 + farReach * 30, 3 + Math.sin(farArmPhase) * 13],
  ]);

  ctx.globalAlpha = 1;
  limb([
    [-16, 4],
    [-32, 6 + kick * 4],
    [-49, 3 + kick * 7],
    [-57, 1 + kick * 7],
  ]);

  // A low, tapered torso reads clearly at both the surface and underwater.
  ctx.beginPath();
  ctx.moveTo(10, -5);
  ctx.quadraticCurveTo(-3, -9, -18, -3);
  ctx.lineTo(-18, 5);
  ctx.quadraticCurveTo(-2, 9, 10, 3);
  ctx.stroke();

  // The near arm follows an oval crawl stroke without crossing the face.
  const armReach = Math.cos(phase);
  limb([
    [8, 1],
    [8 + armReach * 15, 1 + Math.sin(phase) * 9],
    [9 + armReach * 30, 5 + Math.sin(phase) * 13],
  ]);

  // Lift the head slightly, add a short neck, and keep the face unobstructed.
  limb([
    [9, -4],
    [14, -7],
  ]);
  ctx.beginPath();
  ctx.arc(21, -9, 7.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(28, -9);
  ctx.lineTo(32, -7);
  ctx.stroke();
  limb([
    [15, -15],
    [22, -17],
    [29, -13],
  ]);
  ctx.fillStyle = palette.ink;
  ctx.beginPath();
  ctx.arc(24, -10, 0.9, 0, Math.PI * 2);
  ctx.fill();

  // The scarf trails behind the shoulder instead of cutting through the body.
  ctx.strokeStyle = s.accent;
  ctx.beginPath();
  ctx.moveTo(12, -5);
  ctx.lineTo(9, 2);
  ctx.moveTo(10, 0);
  ctx.quadraticCurveTo(-5, 10 + kick * 2, -27, 5 + Math.sin(s.time * 5) * 2);
  ctx.stroke();
  ctx.restore();
}
