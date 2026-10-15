import { MOTION, WORLD } from './config';
import { crossesForward, integrateVertical } from './physics';
import { terrainHeight } from './terrain';

export type CharacterMode =
  | 'introductory'
  | 'grounded'
  | 'airborne'
  | 'scripted-launch'
  | 'swimming'
  | 'seated';
export interface CharacterState {
  mode: CharacterMode;
  x: number;
  velocityX: number;
  velocityY: number;
  y: number;
  gaitPhase: number;
  facing: number;
  idleTime: number;
  sitting: number;
  waveAmount: number;
  treeVisibility: number;
  safeX: number;
}
export type SceneEvent = {
  type:
    | 'landing'
    | 'launch'
    | 'step'
    | 'splash'
    | 'vehicle-entry'
    | 'vehicle-exit'
    | 'intro-complete';
  x: number;
  y: number;
  automatic?: boolean;
};
export interface Movement {
  direction: -1 | 0 | 1;
  verticalDirection?: -1 | 0 | 1;
  run: boolean;
}
export function createCharacter(): CharacterState {
  return {
    mode: 'introductory',
    x: -330,
    velocityX: 0,
    velocityY: 0,
    y: -150,
    gaitPhase: 0,
    facing: 1,
    idleTime: 0,
    sitting: 0,
    waveAmount: 0,
    treeVisibility: 1,
    safeX: WORLD.startX,
  };
}
export function placeCharacter(c: CharacterState, x: number): void {
  c.x = x;
  c.y = terrainHeight(x, x);
  c.safeX = x;
  c.velocityX = 0;
  c.velocityY = 0;
  c.mode = 'grounded';
  c.waveAmount = 0;
  c.sitting = 0;
  c.idleTime = 0;
  c.gaitPhase = 0;
}
export function updateCharacter(
  c: CharacterState,
  input: Movement,
  dt: number,
): SceneEvent[] {
  if (c.mode === 'introductory' || c.mode === 'seated' || c.mode === 'swimming')
    return [];
  const events: SceneEvent[] = [];
  const previousX = c.x;
  const wasGrounded = c.mode === 'grounded';
  c.velocityX +=
    (input.direction * (input.run ? MOTION.run : MOTION.walk) - c.velocityX) *
    (1 - Math.exp(-6 * dt));
  if (c.mode === 'scripted-launch') c.velocityX = MOTION.launchSpeed;
  c.x = Math.max(WORLD.minX, Math.min(WORLD.maxX, c.x + c.velocityX * dt));
  if (
    (c.x === WORLD.minX && c.velocityX < 0) ||
    (c.x === WORLD.maxX && c.velocityX > 0)
  )
    c.velocityX = 0;
  if (input.direction && c.mode !== 'scripted-launch')
    c.facing = input.direction;
  if (wasGrounded && crossesForward(previousX, c.x, WORLD.bridgeEnd)) {
    c.mode = 'airborne';
    // A runner needs a flatter arc to cross the water before its far bank.
    c.velocityY =
      MOTION.bridgeJump *
      Math.min(1, MOTION.walk / Math.max(MOTION.walk, Math.abs(c.velocityX)));
  }
  if (wasGrounded && crossesForward(previousX, c.x, WORLD.launchX)) {
    c.mode = 'scripted-launch';
    c.velocityY = MOTION.launch;
    c.velocityX = MOTION.launchSpeed;
    c.facing = 1;
    events.push({ type: 'launch', x: c.x, y: c.y });
  }
  const ground = terrainHeight(c.x, c.x);
  // Normal slopes follow the surface; abrupt downward ledges cause a fall.
  if (c.mode === 'grounded' && ground - c.y > 24) c.mode = 'airborne';
  if (c.mode === 'grounded') {
    c.y = ground;
    c.velocityY = 0;
  } else if (
    integrateVertical(
      c,
      ground,
      dt,
      (c.mode !== 'scripted-launch' || c.x >= WORLD.islandStart) &&
        !(c.x > WORLD.bridgeEnd && c.x < WORLD.waterEnd),
    )
  ) {
    c.mode = 'grounded';
    events.push({ type: 'landing', x: c.x, y: c.y });
  }
  if (
    c.mode === 'grounded' &&
    !(c.x >= WORLD.launchX && c.x < WORLD.islandStart)
  )
    c.safeX = c.x;
  const speed = Math.abs(c.velocityX),
    previousStep = Math.floor(c.gaitPhase / Math.PI);
  if (speed > 4) {
    c.gaitPhase += dt * speed * 0.085;
    c.idleTime = 0;
  } else c.idleTime += dt;
  c.sitting +=
    ((c.idleTime > 3.5 && c.mode === 'grounded' ? 1 : 0) - c.sitting) *
    (1 - Math.exp(-3 * dt));
  c.treeVisibility +=
    ((speed > 20 ? 0.4 : 1) - c.treeVisibility) *
    (1 - Math.exp(-(speed > 20 ? 4 : 3) * dt));
  if (
    speed > 20 &&
    c.mode === 'grounded' &&
    Math.floor(c.gaitPhase / Math.PI) !== previousStep
  )
    events.push({ type: 'step', x: c.x, y: c.y });
  return events;
}
