import type { CharacterState, Movement, SceneEvent } from './character';
import { placeCharacter } from './character';
import { WORLD } from './config';
import type { Frame } from './frame';
import { seededRandom, smoothStep } from './math';
import { renderRiverPlants, renderRiverSand } from './riverbed';
import type { RenderState } from './state';
import { terrainHeight } from './terrain';

const VISUAL_START = WORLD.bridgeStart;
const SURFACE_POSE_Y = WORLD.waterY + 38;
const BRIDGE_BED_START_DEPTH = 16;
const BRIDGE_BED_END_DEPTH = 190;
const BRIDGE_BED_BLEND_DISTANCE = 120;

export function riverBedY(x: number): number {
  const terrainBed = Math.max(WORLD.waterY + 10, terrainHeight(x, x));
  if (x < WORLD.bridgeStart || x > WORLD.bridgeEnd + BRIDGE_BED_BLEND_DISTANCE)
    return terrainBed;

  const progress = smoothStep(WORLD.bridgeStart, WORLD.bridgeEnd, x);
  const slopedBridgeBed =
    WORLD.waterY +
    BRIDGE_BED_START_DEPTH +
    (BRIDGE_BED_END_DEPTH - BRIDGE_BED_START_DEPTH) * progress;
  return Math.max(terrainBed, slopedBridgeBed);
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

  const bed = riverBedY(c.x) - 8;
  const ceiling = Math.min(SURFACE_POSE_Y, bed);
  if (c.y >= bed) {
    c.y = bed;
    c.velocityY = Math.min(0, c.velocityY);
  }
  if (c.y <= ceiling && c.velocityY < 0) {
    c.y = ceiling;
    c.velocityY = 0;
  }
  c.gaitPhase += dt * (2.5 + Math.hypot(c.velocityX, c.velocityY) * 0.035);
  c.idleTime = 0;
  c.sitting = 0;

  if (c.x >= WORLD.waterEnd && c.velocityX >= 0) {
    placeCharacter(c, WORLD.waterEnd + 20);
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
  s: Pick<RenderState, 'character' | 'reducedMotion' | 'time' | 'waterColor'>,
  frame: Frame,
): void {
  const { ctx, cam, SY, w, h, D } = frame;
  if (cam + w <= VISUAL_START || cam >= WORLD.waterEnd) return;
  const left = Math.max(0, VISUAL_START - cam);
  const right = Math.min(w, WORLD.waterEnd - cam);
  const surface = SY(WORLD.waterY);
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  // Close the water against the rising riverbed so the shore has a natural
  // outline instead of the old rectangular edge.
  ctx.moveTo(left, surface);
  ctx.lineTo(right, surface);
  for (let sx = right; sx >= left; sx -= 8)
    ctx.lineTo(sx, SY(riverBedY(sx + cam)));
  ctx.lineTo(left, SY(riverBedY(left + cam)));
  ctx.closePath();
  ctx.clip();

  // Pale like a calm lake while crossing the bridge, deepening at the river.
  const depth = 0.25 + 0.75 * smoothStep(8050, 8350, s.character.x),
    water = ctx.createLinearGradient(0, surface, 0, SY(290));
  water.addColorStop(0, `rgba(186, 224, 244, ${0.6 + 0.15 * depth})`);
  water.addColorStop(0.35, `rgba(120, 190, 232, ${0.55 + 0.25 * depth})`);
  water.addColorStop(0.75, `rgba(72, 150, 212, ${0.6 * depth + 0.2})`);
  water.addColorStop(1, `rgba(52, 124, 196, ${0.7 * depth + 0.2})`);
  ctx.fillStyle = water;
  ctx.fillRect(left, surface, right - left, h - surface);
  renderLightRays(
    ctx,
    cam,
    left,
    right,
    surface,
    SY(290),
    depth,
    s.reducedMotion ? 0 : s.time,
  );
  renderWreck(ctx, cam, SY);
  renderLakeSurface(
    ctx,
    cam,
    left,
    right,
    surface,
    s.reducedMotion ? 0 : s.time,
  );

  const span = WORLD.waterEnd - WORLD.waterStart - 80;
  for (let index = 0; index < 14; index++) {
    const seed = seededRandom(4100 + index * 19);
    const direction = index % 2 ? -1 : 1;
    const travel =
      (s.time * (18 + seed * 18) * direction + seed * span * 2) % span;
    const wx = WORLD.waterStart + 40 + ((travel + span) % span);
    const bed = riverBedY(wx);
    const wy =
      WORLD.waterY +
      10 +
      seededRandom(index * 41) * Math.max(0, bed - WORLD.waterY - 24);
    const sx = wx - cam;
    if (sx < left - 20 || sx > right + 20) continue;
    const size = 3.6 + seededRandom(index * 73) * 3.4;
    ctx.save();
    ctx.translate(sx, SY(wy));
    ctx.scale(direction, 1);
    ctx.globalAlpha = 0.8 * (1 - D * 0.2);
    ctx.fillStyle = ['#5b8fc7', '#f4f7f9', '#e8c46a'][index % 3];
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
  // The earth cross-section only shows once you are in the river, not while
  // the calm lake is seen from the bridge.
  const below = smoothStep(8150, 8400, s.character.x);
  if (below > 0.01) {
    ctx.save();
    ctx.globalAlpha = below;
    renderRiverSand(ctx, cam, SY, riverBedY, left, right, h, below);
    renderRiverPlants(
      ctx,
      cam,
      SY,
      riverBedY,
      left,
      right,
      s.reducedMotion ? 0 : s.time,
    );
    ctx.restore();
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
  ctx.beginPath();
  ctx.moveTo(left, surface);
  ctx.lineTo(right, surface);
  for (let sx = right; sx >= left; sx -= 8)
    ctx.lineTo(sx, SY(riverBedY(sx + cam)));
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = 'rgba(120, 190, 232, 0.12)';
  ctx.fillRect(left, surface, Math.max(0, right - left), h - surface);
  ctx.fillStyle = 'rgba(225, 244, 255, 0.72)';
  for (let index = 0; index < 5; index++) {
    const phase = (s.time * (0.35 + index * 0.05) + index * 0.21) % 1;
    ctx.globalAlpha = 1 - phase;
    ctx.beginPath();
    ctx.arc(
      s.character.x - cam + s.character.facing * 38 + Math.sin(index * 3.1) * 4,
      SY(s.character.y - 28 - phase * 42),
      1.2 + index * 0.22,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}

// Soft beams of light slanting down from the surface, stronger in deep water.
function renderLightRays(
  ctx: CanvasRenderingContext2D,
  cam: number,
  left: number,
  right: number,
  surface: number,
  floor: number,
  depth: number,
  time: number,
): void {
  for (let i = 0; i < 9; i++) {
    const wx =
        WORLD.bridgeStart + 300 + i * 320 + Math.sin(time * 0.3 + i) * 20,
      x = wx - cam;
    if (x < left - 200 || x > right + 60) continue;
    const width = 40 + seededRandom(i + 9900) * 50,
      beam = ctx.createLinearGradient(0, surface, 0, floor);
    beam.addColorStop(0, `rgba(255, 255, 255, ${0.12 + 0.06 * depth})`);
    beam.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(x, surface);
    ctx.lineTo(x + width, surface);
    ctx.lineTo(x + width - 90, floor);
    ctx.lineTo(x - 130, floor);
    ctx.closePath();
    ctx.fill();
  }
}

// Light shimmer just under the surface and a few small fish, as in the design.
function renderLakeSurface(
  ctx: CanvasRenderingContext2D,
  cam: number,
  left: number,
  right: number,
  surface: number,
  time: number,
): void {
  const light = ctx.createLinearGradient(0, surface, 0, surface + 70);
  light.addColorStop(0, 'rgba(214, 232, 244, 0.55)');
  light.addColorStop(1, 'rgba(214, 232, 244, 0)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = light;
  ctx.fillRect(left, surface, right - left, 70);
  const band = ctx.createLinearGradient(0, surface, 0, surface + 10);
  band.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
  band.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = band;
  ctx.fillRect(left, surface, right - left, 10);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 160; i++) {
    const wx =
        WORLD.bridgeStart +
        seededRandom(i + 9800) * 3000 +
        ((time * (i % 2 ? 6 : -4)) % 60) +
        Math.sin(time * 0.4 + i) * 6,
      sx = wx - cam;
    if (sx < left - 40 || sx > right) continue;
    ctx.globalAlpha =
      (0.35 + seededRandom(i + 9810) * 0.35) *
      (0.7 + 0.3 * Math.sin(time * 1.5 + i));
    ctx.fillRect(
      sx,
      surface + 3 + Math.pow(seededRandom(i + 9820), 1.6) * 60,
      8 + seededRandom(i + 9830) * 26,
      1.2,
    );
  }
  for (let i = 0; i < 70; i++) {
    const wx = WORLD.bridgeStart + seededRandom(i + 9890) * 3000,
      sx = wx - cam;
    if (sx < left || sx > right) continue;
    ctx.globalAlpha = Math.max(0, Math.sin(time * 2 + i * 1.7)) * 0.9;
    ctx.fillRect(sx, surface + 2 + seededRandom(i + 9895) * 14, 2, 2);
  }
  for (let i = 0; i < 5; i++) {
    const speed = 14 + seededRandom(i + 9850) * 12,
      wx =
        WORLD.bridgeStart +
        ((seededRandom(i + 9860) * 1800 + time * speed) % 1800),
      sx = wx - cam,
      sy = surface + 30 + seededRandom(i + 9870) * 50 + Math.sin(time + i) * 3;
    if (sx < left - 20 || sx > right + 20) continue;
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#6f9fc7';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 9, 3.4, 0, 0, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sx - 8, sy);
    ctx.lineTo(sx - 14, sy - 4);
    ctx.lineTo(sx - 14, sy + 4);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function renderWreck(
  ctx: CanvasRenderingContext2D,
  cam: number,
  screenY: (y: number) => number,
): void {
  ctx.save();
  ctx.translate(WORLD.wreckX - cam, screenY(riverBedY(WORLD.wreckX) - 3));
  ctx.rotate(-0.09);
  ctx.strokeStyle = '#765d43';
  ctx.fillStyle = '#a48b65';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(-105, -42);
  ctx.lineTo(-65, -8);
  ctx.quadraticCurveTo(-5, 13, 90, -7);
  ctx.lineTo(115, -47);
  ctx.lineTo(45, -35);
  ctx.lineTo(27, -43);
  ctx.lineTo(8, -29);
  ctx.lineTo(-6, -40);
  ctx.lineTo(-26, -31);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (let plank = 0; plank < 3; plank++) {
    ctx.beginPath();
    ctx.moveTo(-80 + plank * 10, -31 + plank * 10);
    ctx.quadraticCurveTo(0, -14 + plank * 7, 91 - plank * 6, -32 + plank * 10);
    ctx.stroke();
  }
  for (let rib = -55; rib < 80; rib += 27) {
    ctx.beginPath();
    ctx.moveTo(rib, -33);
    ctx.lineTo(rib + 8, -7);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-15, -34);
  ctx.lineTo(-27, -113);
  ctx.lineTo(-13, -105);
  ctx.lineTo(-4, -36);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-23, -97);
  ctx.lineTo(29, -57);
  ctx.lineTo(-14, -62);
  ctx.stroke();
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
