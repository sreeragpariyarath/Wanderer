import { WORLD } from './config';
import type { Frame } from './frame';
import { seededRandom } from './math';
import type { RenderState } from './state';
import { terrainHeight } from './terrain';

export function renderBridge(
  s: Pick<RenderState, 'character'>,
  frame: Frame,
): void {
  const { ctx, cam, SY, w, col } = frame;
  // bridge
  if (cam + w > WORLD.bridgeStart && cam < WORLD.bridgeEnd) {
    ctx.fillStyle = col.mut;
    for (let wx = WORLD.bridgeStart; wx <= WORLD.bridgeEnd; wx += 6) {
      const sx = wx - cam;
      if (sx < -10 || sx > w + 10) continue;
      const i = wx / 6;
      const y = SY(terrainHeight(s.character.x, wx));
      for (let rail = 0; rail < 2; rail++) {
        const rv = seededRandom(i * 3 + rail * 77),
          jx = 0,
          jy = 0;
        ctx.globalAlpha = 0.55 + rv * 0.4;
        ctx.beginPath();
        ctx.arc(sx + jx, y + 1 + rail * 12 + jy, 1 + rv * 1.4, 0, 7);
        ctx.fill();
      }
    }
    for (
      let wx = WORLD.bridgeStart + 30;
      wx <= WORLD.bridgeEnd - 20;
      wx += 140
    ) {
      const sx = wx - cam,
        y = SY(0);
      ctx.globalAlpha = 0.8;
      for (let yy = y + 14; yy < SY(80); yy += 6) {
        ctx.beginPath();
        ctx.arc(sx, yy, 1.3, 0, 7);
        ctx.fill();
      }
      for (let k = 0; k < 6; k++) {
        const t = k / 5;
        ctx.beginPath();
        ctx.arc(sx + 30 + t * 4, y - t * 28, 1.2, 0, 7);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}
