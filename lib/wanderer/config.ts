export const WORLD = {
  width: 16000,
  minX: 30,
  maxX: 15940,
  startX: 70,
  bridgeEnd: 8300,
  waterY: 75,
  waterStart: 8250,
  waterEnd: 10300,
  wreckX: 9300,
  launchX: 13800,
  islandStart: 13950,
  roadStart: 450,
  roadEnd: 6670,
} as const;
export const MOTION = {
  gravity: 950,
  walk: 170,
  run: 420,
  bridgeJump: -280,
  launch: -1500,
  launchSpeed: 160,
} as const;
export const STEP = 1 / 60;
export const PARTICLE_LIMIT = 1200;
