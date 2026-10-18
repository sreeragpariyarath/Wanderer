import { WORLD } from './config';
import type { Frame } from './frame';
import { seededRandom, smoothStep } from './math';
import type { RenderState } from './state';
import { darknessAt, terrainHeight } from './terrain';

export function renderGround(
  s: Pick<
    RenderState,
    | 'accent'
    | 'character'
    | 'intro'
    | 'introDone'
    | 'particleColors'
    | 'villageColors'
  >,
  frame: Frame,
): void {
  const { ctx, cam, SY, w, h, col, X } = frame;
  // ground
  const start = Math.floor(cam / 9) - 1,
    end = Math.ceil((cam + w) / 9) + 1;
  for (let i = start; i <= end; i++) {
    const wx = i * 9;
    if (
      !s.introDone &&
      (!s.intro.reveal || Math.abs(wx - s.intro.landX) > s.intro.reveal)
    )
      continue;
    if (
      (wx > WORLD.bridgeStart - 10 && wx < WORLD.bridgeEnd + 140) ||
      (wx > 13810 && wx < 13950)
    )
      continue;
    const sx = wx - cam,
      r = seededRandom(i),
      gy = SY(terrainHeight(s.character.x, wx) + (r - 0.5) * 3);
    if (gy < -20 || gy > h + 20) continue;
    const dz = darknessAt(wx);
    const near =
      Math.abs(wx - X) < 90 &&
      s.character.sitting < 0.5 &&
      Math.abs(s.character.velocityX) > 10;
    ctx.globalAlpha = 0.35 + r * 0.45;
    if (dz > 0.5 || (wx > 11000 && wx < 12200))
      ctx.fillStyle = s.particleColors[Math.floor(seededRandom(i * 3) * 4)];
    else if (wx >= 12200 && wx <= 13810)
      ctx.fillStyle =
        near && r > 0.55
          ? s.accent
          : s.villageColors[Math.floor(seededRandom(i * 3) * 5)];
    else if (near && r > 0.55) ctx.fillStyle = s.accent;
    else {
      const gz = smoothStep(3550, 3750, wx) * (1 - smoothStep(6600, 6850, wx));
      const gr = seededRandom(i * 5 + 2);
      ctx.fillStyle =
        gz > gr
          ? gr > 0.66
            ? '#7fa9a0'
            : gr > 0.33
              ? '#5f8f6c'
              : '#8fb39a'
          : col.dot;
    }
    ctx.beginPath();
    ctx.arc(sx, gy, 1.2 + r * 2.2, 0, 7);
    ctx.fill();
  }
}
