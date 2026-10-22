import { smoothStep } from './math';
import type { RenderState } from './state';
import { darknessAt } from './terrain';
import type { NumericPalette, RenderPalette, ScreenY } from './types';
export interface Frame {
  ctx: CanvasRenderingContext2D;
  cam: number;
  camY: number;
  baseY: number;
  w: number;
  h: number;
  SY: ScreenY;
  col: RenderPalette & { div: string; sub: string };
  X: number;
  D: number;
  N: number;
  nightA: number;
  /**
   * Draws a still layer through the renderer's offscreen cache: drawn once per
   * id and screen size, then composited with an alpha and a vertical offset.
   * Absent outside the browser renderer; callers then draw directly.
   */
  layer?: LayerPainter;
}
export type LayerPainter = (
  id: string,
  draw: (ctx: CanvasRenderingContext2D) => void,
  alpha: number,
  offsetY: number,
) => void;
export function createFrame(
  s: RenderState,
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): Frame {
  const X = s.character.x,
    D = darknessAt(X),
    N = s.nightIntensity;
  const mix = (key: keyof NumericPalette): string =>
    `rgb(${s.dayPalette[key].map((v, i) => Math.round((v + (s.darkPalette[key][i] - v) * D) * (1 - N) + s.nightPalette[key][i] * N)).join(',')})`;
  const col = {
    bg: mix('bg'),
    ink: mix('ink'),
    dot: mix('dot'),
    mut: mix('mut'),
    div: mix('div'),
    sub: mix('sub'),
  };
  const cam = s.camera.x - w * 0.45,
    baseY = h * 0.72,
    camY = s.camera.y;
  return {
    ctx,
    cam,
    baseY,
    camY,
    w,
    h,
    col,
    X,
    D,
    N,
    SY: (wy) => baseY + wy - camY,
    nightA: Math.max(smoothStep(13900, 14400, X), N),
  };
}
