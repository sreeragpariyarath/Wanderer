import { seededRandom } from './math';

// Small drawing helpers shared by the dotted scenery renderers.
export function withAlpha(color: string, alpha: number): string {
  if (color.startsWith('#') && color.length === 7) {
    const value = parseInt(color.slice(1), 16);
    return `rgba(${value >> 16},${(value >> 8) & 255},${value & 255},${alpha})`;
  }
  return color.replace('rgb(', 'rgba(').replace(')', `,${alpha})`);
}

export function dot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 7);
  ctx.fill();
}

export function dotLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  step: number,
  r: number,
  seed: number,
): void {
  const count = Math.max(1, Math.floor(Math.hypot(x2 - x1, y2 - y1) / step));
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    dot(
      ctx,
      x1 + (x2 - x1) * t,
      y1 + (y2 - y1) * t,
      r * (0.75 + seededRandom(seed + i * 1.7) * 0.5),
    );
  }
}

// A dome built from a grid of dots, used for clouds and distant hills.
export function dotDome(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  rx: number,
  ry: number,
  seed: number,
  colors: readonly [string, string],
  alphas: readonly [number, number],
  warmShare: number,
  gap = 9,
  size = 1.3,
): void {
  for (let row = 0; row * gap < ry; row++) {
    const y = baseY - row * gap,
      reach = rx * Math.sqrt(1 - Math.pow((row * gap) / ry, 2));
    for (let x = -reach; x <= reach; x += gap) {
      const warm = seededRandom(seed + row * 61 + x) < warmShare;
      ctx.globalAlpha = warm ? alphas[1] : alphas[0];
      ctx.fillStyle = warm ? colors[1] : colors[0];
      dot(ctx, cx + x, y, size);
    }
  }
}
