import type { CharacterState, Movement, SceneEvent } from './character';
import { placeCharacter } from './character';
import { WORLD } from './config';
import type { Frame } from './frame';
import { seededRandom, smoothStep } from './math';
import type { RenderState } from './state';
import { terrainHeight } from './terrain';

const VISUAL_START = 6800;
const SURFACE_POSE_Y = WORLD.waterY + 65;

export function riverBedY(x: number): number {
  return Math.max(WORLD.waterY + 135, terrainHeight(x, x));
}

export function enterWater(c: CharacterState): void {
  c.mode = 'swimming';
  c.y = Math.max(WORLD.waterY + 8, c.y);
  c.velocityX *= 0.55;
  c.velocityY = Math.min(145, Math.max(45, c.velocityY * 0.35));
  c.sitting = 0;
  c.idleTime = 0;
}

export function updateSwimming(
  c: CharacterState,
  input: Movement,
  dt: number,
): SceneEvent[] {
  const horizontalTarget = input.direction * (input.run ? 155 : 110);
  const verticalInput = input.verticalDirection ?? 0;
  const verticalTarget =
    verticalInput * 115 + (!verticalInput && c.y < SURFACE_POSE_Y ? 35 : 0);
  c.velocityX += (horizontalTarget - c.velocityX) * (1 - Math.exp(-4.5 * dt));
  c.velocityY += (verticalTarget - c.velocityY) * (1 - Math.exp(-5.5 * dt));
  c.x += c.velocityX * dt;
  c.y += c.velocityY * dt;
  if (input.direction) c.facing = input.direction;

  const bed = riverBedY(c.x) - 12;
  if (c.y >= bed) {
    c.y = bed;
    c.velocityY = Math.min(0, c.velocityY);
  }
  if (c.y <= SURFACE_POSE_Y && c.velocityY < 0) {
    c.y = SURFACE_POSE_Y;
    c.velocityY = 0;
  }
  c.gaitPhase += dt * (2.5 + Math.hypot(c.velocityX, c.velocityY) * 0.035);
  c.idleTime = 0;
  c.sitting = 0;

  if (c.x >= WORLD.waterEnd && c.velocityX >= 0) {
    placeCharacter(c, WORLD.waterEnd + 18);
    c.facing = 1;
    return [{ type: 'landing', x: c.x, y: c.y }];
  }
  if (c.x <= WORLD.waterStart && c.velocityX <= 0) {
    placeCharacter(c, WORLD.waterStart - 18);
    c.facing = -1;
    return [{ type: 'landing', x: c.x, y: c.y }];
  }
  c.x = Math.max(WORLD.waterStart, Math.min(WORLD.waterEnd, c.x));
  return [];
}

export function renderWater(
  s: Pick<RenderState, 'character' | 'time' | 'waterColor'>,
  frame: Frame,
): void {
  const { ctx, cam, SY, w, h, D } = frame;
  if (cam + w <= VISUAL_START || cam >= WORLD.waterEnd) return;
  const left = Math.max(0, VISUAL_START - cam);
  const right = Math.min(w, WORLD.waterEnd - cam);
  const surface = SY(WORLD.waterY);
  ctx.save();
  ctx.beginPath();
  ctx.rect(left, surface, Math.max(0, right - left), h - surface);
  ctx.clip();

  const water = ctx.createLinearGradient(0, surface, 0, h);
  water.addColorStop(0, 'rgba(120, 184, 229, 0.48)');
  water.addColorStop(0.45, 'rgba(53, 133, 196, 0.58)');
  water.addColorStop(1, 'rgba(24, 83, 146, 0.7)');
  ctx.fillStyle = water;
  ctx.fillRect(left, surface, right - left, h - surface);

  for (let wx = 8330; wx < WORLD.waterEnd - 25; wx += 48) {
    const seed = seededRandom(wx * 0.17);
    if (seed < 0.22) continue;
    const baseY = SY(riverBedY(wx));
    const height = 22 + seed * 42;
    const sway = Math.sin(s.time * 1.1 + wx * 0.025) * (4 + seed * 4);
    ctx.strokeStyle = seed > 0.6 ? '#3f866f' : '#5a9975';
    ctx.lineWidth = 1.4;
    ctx.globalAlpha = 0.55 + seed * 0.3;
    ctx.beginPath();
    ctx.moveTo(wx - cam, baseY);
    ctx.quadraticCurveTo(
      wx - cam + sway * 0.35,
      baseY - height * 0.55,
      wx - cam + sway,
      baseY - height,
    );
    ctx.stroke();
    for (let leaf = 0; leaf < 3; leaf++) {
      const y = baseY - height * (0.35 + leaf * 0.2);
      ctx.beginPath();
      ctx.ellipse(
        wx - cam + sway * (0.25 + leaf * 0.22) + (leaf % 2 ? -4 : 4),
        y,
        4.5,
        1.8,
        leaf % 2 ? -0.45 : 0.45,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    }
  }

  const span = WORLD.waterEnd - WORLD.waterStart - 80;
  for (let index = 0; index < 14; index++) {
    const seed = seededRandom(4100 + index * 19);
    const direction = index % 2 ? -1 : 1;
    const travel =
      (s.time * (18 + seed * 18) * direction + seed * span * 2) % span;
    const wx = WORLD.waterStart + 40 + ((travel + span) % span);
    const bed = riverBedY(wx);
    const wy =
      WORLD.waterY + 38 + seededRandom(index * 41) * (bed - WORLD.waterY - 70);
    const sx = wx - cam;
    if (sx < left - 20 || sx > right + 20) continue;
    const size = 3 + seededRandom(index * 73) * 3;
    ctx.save();
    ctx.translate(sx, SY(wy));
    ctx.scale(direction, 1);
    ctx.globalAlpha = 0.58 * (1 - D * 0.2);
    ctx.fillStyle = index % 3 === 0 ? '#d7a75c' : '#e5edf2';
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.8, size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-size * 1.5, 0);
    ctx.lineTo(-size * 2.7, -size);
    ctx.lineTo(-size * 2.7, size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  ctx.fillStyle = s.waterColor;
  for (
    let wx = Math.max(VISUAL_START, Math.floor(cam / 7) * 7);
    wx < Math.min(WORLD.waterEnd, cam + w);
    wx += 7
  ) {
    const edge =
      smoothStep(VISUAL_START, 6920, wx) *
      (1 - smoothStep(WORLD.waterEnd - 120, WORLD.waterEnd, wx));
    ctx.globalAlpha = edge * 0.85 * (1 - D * 0.35);
    ctx.beginPath();
    ctx.arc(
      wx - cam + Math.sin(s.time * 0.6 + wx) * 3,
      SY(WORLD.waterY + Math.sin(s.time * 1.4 + wx * 0.02) * 2.5),
      1.8 + seededRandom(wx * 3) * 2.2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function renderWaterOverlay(
  s: Pick<RenderState, 'character' | 'time'>,
  frame: Frame,
): void {
  if (s.character.mode !== 'swimming') return;
  const { ctx, cam, SY, w, h } = frame;
  const left = Math.max(0, VISUAL_START - cam);
  const right = Math.min(w, WORLD.waterEnd - cam);
  const surface = SY(WORLD.waterY);
  ctx.save();
  ctx.fillStyle = 'rgba(36, 125, 194, 0.2)';
  ctx.fillRect(left, surface, Math.max(0, right - left), h - surface);
  ctx.fillStyle = 'rgba(225, 244, 255, 0.72)';
  for (let index = 0; index < 5; index++) {
    const phase = (s.time * (0.35 + index * 0.05) + index * 0.21) % 1;
    ctx.globalAlpha = 1 - phase;
    ctx.beginPath();
    ctx.arc(
      s.character.x - cam + 12 + Math.sin(index * 3.1) * 8,
      SY(s.character.y - 25 - phase * 42),
      1.2 + index * 0.22,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}

export function waterCrossing(
  previousX: number,
  previousY: number,
  x: number,
  y: number,
): SceneEvent | null {
  if (previousY >= WORLD.waterY || y < WORLD.waterY) return null;
  const fraction = (WORLD.waterY - previousY) / (y - previousY);
  const crossingX = previousX + (x - previousX) * fraction;
  return crossingX > WORLD.waterStart && crossingX < WORLD.waterEnd
    ? { type: 'splash', x: crossingX, y: WORLD.waterY }
    : null;
}
