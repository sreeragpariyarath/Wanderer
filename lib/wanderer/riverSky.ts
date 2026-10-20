import { dot, dotDome, withAlpha } from './dots';
import type { Frame } from './frame';
import { seededRandom, smoothStep } from './math';
import type { RenderState } from './state';

type RiverScenery = Pick<RenderState, 'reducedMotion' | 'time'>;

function riverVisibility(X: number): number {
  return smoothStep(8250, 8600, X) * (1 - smoothStep(10100, 10500, X));
}

// Still parts of the river sky: a soft blue wash and dotted clouds.
function renderStillSky(frame: Frame): void {
  const { ctx, w, h, col } = frame,
    wash = ctx.createLinearGradient(0, 0, 0, h * 0.5);
  wash.addColorStop(0, withAlpha('#bcd8ee', 0.55));
  wash.addColorStop(0.6, withAlpha('#d9e8f3', 0.3));
  wash.addColorStop(1, withAlpha(col.bg, 0));
  ctx.globalAlpha = 1;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h * 0.5);
  for (const [n, [cx, cy, rx, ry]] of [
    [0.16, 0.24, 0.09, 0.05],
    [0.42, 0.14, 0.06, 0.035],
    [0.7, 0.27, 0.1, 0.055],
    [0.9, 0.12, 0.05, 0.03],
  ].entries())
    dotDome(
      ctx,
      w * cx,
      h * cy,
      w * rx,
      h * ry,
      10400 + n * 29,
      ['#ffffff', '#cfe0ec'],
      [0.9, 0.75],
      0.4,
      7,
      1.6,
    );
}

// A little sky above the river: blue wash, clouds, soft sun and a few birds.
export function renderRiverSky(s: RiverScenery, frame: Frame): void {
  const { ctx, w, h, X, col } = frame,
    fade = riverVisibility(X);
  if (fade <= 0.01) return;
  if (frame.layer)
    frame.layer(
      'river-sky',
      (o) => renderStillSky({ ...frame, ctx: o }),
      fade,
      0,
    );
  else {
    ctx.save();
    ctx.globalAlpha = fade;
    renderStillSky(frame);
    ctx.restore();
  }
  const sunX = w * 0.82,
    sunY = h * 0.16,
    glow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 110);
  glow.addColorStop(0, withAlpha('#f6d58a', 0.4 * fade));
  glow.addColorStop(1, withAlpha('#f6d58a', 0));
  ctx.globalAlpha = 1;
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 110, sunY - 110, 220, 220);
  ctx.fillStyle = withAlpha('#f6d58a', 0.45 * fade);
  dot(ctx, sunX, sunY, 34);
  const time = s.reducedMotion ? 0 : s.time;
  ctx.strokeStyle = col.mut;
  ctx.lineWidth = 1.1;
  ctx.globalAlpha = 0.5 * fade;
  for (let i = 0; i < 3; i++) {
    const span = w + 240,
      bx = ((seededRandom(i + 10450) * span + time * (6 + i * 2)) % span) - 120,
      by = h * (0.18 + seededRandom(i + 10460) * 0.14) + Math.sin(time + i) * 4,
      flap = 3 + Math.sin(time * 4 + i * 2) * 2;
    ctx.beginPath();
    ctx.moveTo(bx - 6, by - flap);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + 6, by - flap);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
