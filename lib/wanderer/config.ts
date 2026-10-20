export const WORLD = {
  // The journey ends on a short beach just after the river.
  width: 11000,
  minX: 30,
  maxX: 10880,
  startX: 70,
  bridgeStart: 7500,
  bridgeEnd: 8300,
  // Water surface sits just under the bridge deck, level with the lake.
  waterY: 30,
  waterStart: 8250,
  waterEnd: 10300,
  wreckX: 9300,
  roadStart: 450,
  roadEnd: 6670,
} as const;
export const MOTION = {
  gravity: 950,
  walk: 170,
  run: 420,
  bridgeJump: -280,
} as const;
export const STEP = 1 / 60;
export const PARTICLE_LIMIT = 1200;
