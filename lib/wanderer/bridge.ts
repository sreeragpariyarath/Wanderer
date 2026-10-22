import { WORLD } from './config';
import { dot, dotLine, withAlpha } from './dots';
import type { Frame } from './frame';
import { seededRandom } from './math';
import type { RenderState } from './state';
import { terrainHeight } from './terrain';

const PIER_GAP = 200;

// A dotted arched footbridge like the design: deck and railing with lamp
// posts, arches between stone piers, and the piers' shimmering reflections.
// The deck stays on the walking surface, so movement is unchanged.
export function renderBridge(
  s: Pick<RenderState, 'character' | 'reducedMotion' | 'time'>,
  frame: Frame,
): void {
  const { ctx, cam, SY, w, col } = frame;
  if (cam + w <= WORLD.bridgeStart || cam >= WORLD.bridgeEnd) return;
  const deckAt = (wx: number) => SY(terrainHeight(s.character.x, wx)),
    water = SY(WORLD.waterY),
    time = s.reducedMotion ? 0 : s.time,
    first = Math.max(WORLD.bridgeStart, Math.floor(cam / 4) * 4),
    last = Math.min(WORLD.bridgeEnd, cam + w + 4);
  // Deck: two dark rails with a fine lattice between them.
  ctx.fillStyle = col.ink;
  for (let wx = first; wx <= last; wx += 4) {
    const sx = wx - cam,
      y = deckAt(wx),
      r = seededRandom(wx * 0.37);
    ctx.globalAlpha = 0.8;
    dot(ctx, sx, y + 1, 1.5 + r * 0.4);
    ctx.globalAlpha = 0.6;
    dot(ctx, sx, y + 9, 1.2);
    if ((wx / 4) % 2 === 0) {
      ctx.globalAlpha = 0.3;
      dot(ctx, sx + 1, y + 5, 0.8);
    }
  }
  // Piers, arches and lamp posts at each pier.
  for (let px = WORLD.bridgeStart; px <= WORLD.bridgeEnd; px += PIER_GAP) {
    const sx = px - cam;
    if (sx < -PIER_GAP - 20 || sx > w + 20) continue;
    const deck = deckAt(px),
      // Piers stand in the water below the deck so the arches keep their shape.
      foot = Math.max(water + 4, deck + 66);
    // Arch to the next pier.
    if (px + PIER_GAP <= WORLD.bridgeEnd) {
      const spring = foot - 10,
        rise = spring - deck - 14;
      ctx.fillStyle = col.mut;
      for (let i = 0; i <= 50; i++) {
        const t = i / 50,
          ax = sx + 8 + t * (PIER_GAP - 16),
          ay = spring - rise * Math.sin(Math.PI * t);
        ctx.globalAlpha = 0.7;
        dot(ctx, ax, ay, 1.2);
        ctx.globalAlpha = 0.35;
        dot(ctx, ax, ay + 6, 0.9);
        // Spandrel posts from the arch up to the deck.
        if (i % 5 === 0 && i > 0 && i < 50)
          dotLine(ctx, ax, ay - 2, ax, deck + 10, 4, 0.7, px + i);
      }
    }
    // The first pier stands on the sandy bank, so it needs no column,
    // stone footing or reflection in the water.
    if (px > WORLD.bridgeStart) {
      // Pier: a tapered dotted column with stone blocks near the water.
      ctx.fillStyle = col.ink;
      ctx.globalAlpha = 0.65;
      dotLine(ctx, sx - 6, deck + 10, sx - 8, foot, 4, 1.2, px);
      dotLine(ctx, sx + 6, deck + 10, sx + 8, foot, 4, 1.2, px + 1);
      ctx.globalAlpha = 0.5;
      for (let row = 0; row < 4; row++)
        for (let col2 = 0; col2 < 4; col2++)
          dot(ctx, sx - 6 + col2 * 4 + (row % 2) * 2, foot - 16 + row * 4, 1);
      // Reflection: the pier repeated below the surface in shimmering strips.
      ctx.fillStyle = withAlpha('#5b7f9f', 1);
      for (let yy = 4; yy < 48; yy += 4) {
        const shift = Math.sin(time * 1.6 + yy * 0.4 + px) * 2;
        ctx.globalAlpha = 0.22 * (1 - yy / 48);
        ctx.fillRect(sx - 8 + shift, foot + yy, 16, 1.6);
      }
    }
    // Lamp post with an amber bulb.
    ctx.fillStyle = col.ink;
    ctx.globalAlpha = 0.75;
    dotLine(ctx, sx, deck - 2, sx, deck - 36, 3, 0.9, px + 7);
    const glow = ctx.createRadialGradient(sx, deck - 40, 1, sx, deck - 40, 16);
    glow.addColorStop(0, withAlpha('#f6cf7d', 0.5));
    glow.addColorStop(1, withAlpha('#f6cf7d', 0));
    ctx.globalAlpha = 1;
    ctx.fillStyle = glow;
    ctx.fillRect(sx - 16, deck - 56, 32, 32);
    ctx.fillStyle = '#d9a35b';
    ctx.globalAlpha = 0.95;
    dot(ctx, sx, deck - 40, 2.4);
    // Railing: a gently sagging top rail and balusters to the next lamp.
    if (px + PIER_GAP <= WORLD.bridgeEnd) {
      ctx.fillStyle = col.ink;
      for (let i = 0; i <= 50; i++) {
        const t = i / 50,
          rx = sx + t * PIER_GAP,
          ry = deckAt(px + t * PIER_GAP) - 24 + Math.sin(Math.PI * t) * 4;
        ctx.globalAlpha = 0.6;
        dot(ctx, rx, ry, 1);
        if (i % 4 === 0) {
          ctx.globalAlpha = 0.35;
          dotLine(
            ctx,
            rx,
            ry + 3,
            rx,
            deckAt(px + t * PIER_GAP) - 2,
            4,
            0.6,
            px + i * 3,
          );
        }
      }
    }
  }
  ctx.globalAlpha = 1;
}
