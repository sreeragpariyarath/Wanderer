import type { CharacterState, Movement, SceneEvent } from './character';
import { placeCharacter } from './character';
import { MOTION, WORLD } from './config';
import { terrainHeight } from './terrain';
import type { VehicleState } from './types';

export function canEnterVehicle(
  car: Readonly<VehicleState>,
  c: Readonly<CharacterState>,
): boolean {
  return !car.arrived && c.mode === 'grounded' && Math.abs(c.x - car.x) < 90;
}
export function exitVehicle(
  car: VehicleState,
  c: CharacterState,
  walkOut = false,
): SceneEvent {
  car.in = false;
  car.v = 0;
  car.endT = 0;
  if (car.x >= WORLD.roadEnd - 1) car.arrived = true;
  placeCharacter(c, Math.min(WORLD.maxX, car.x + (walkOut ? 18 : 125)));
  c.facing = 1;
  if (walkOut) {
    // Continue out of the driver's side on the ground instead of popping ahead
    // of the car in a single frame. The regular character update eases this
    // velocity into the player's current movement input.
    c.velocityX = MOTION.walk * 0.55;
    c.sitting = 1;
  }
  return { type: 'vehicle-exit', x: c.x, y: c.y };
}
export function interactVehicle(
  car: VehicleState,
  c: CharacterState,
): { handled: boolean; events: SceneEvent[] } {
  if (car.in)
    return {
      handled: true,
      events: Math.abs(car.v) < 80 ? [exitVehicle(car, c)] : [],
    };
  if (!canEnterVehicle(car, c)) return { handled: false, events: [] };
  car.in = true;
  car.started = true;
  car.startX = car.x;
  car.endT = 0;
  c.mode = 'seated';
  c.x = car.x;
  c.velocityX = 0;
  c.velocityY = 0;
  c.y = terrainHeight(car.x, car.x);
  return {
    handled: true,
    events: [{ type: 'vehicle-entry', x: car.x, y: c.y }],
  };
}
export function updateVehicle(
  car: VehicleState,
  c: CharacterState,
  input: Movement,
  dt: number,
): SceneEvent[] {
  if (!car.in) return [];
  const target =
    input.direction > 0
      ? input.run
        ? 900
        : 560
      : input.direction < 0
        ? -220
        : 0;
  car.v +=
    (target - car.v) * (1 - Math.exp(-(input.direction ? 1.5 : 2.2) * dt));
  if (car.v > 0)
    car.v = Math.min(
      car.v,
      Math.sqrt(Math.max(0, WORLD.roadEnd - car.x) * 1400),
    );
  car.x = Math.max(
    WORLD.roadStart,
    Math.min(WORLD.roadEnd, car.x + car.v * dt),
  );
  if (car.x >= WORLD.roadEnd - 0.5) {
    car.x = WORLD.roadEnd;
    car.v = Math.min(0, car.v);
  }
  if (car.x <= WORLD.roadStart) car.v = Math.max(0, car.v);
  car.rot += (car.v * dt) / 16;
  c.x = car.x;
  c.velocityX = car.v;
  c.velocityY = 0;
  c.y = terrainHeight(c.x, c.x);
  c.sitting = 0;
  c.idleTime = 0;
  if (!car.arrived && car.x >= WORLD.roadEnd - 1 && Math.abs(car.v) < 5) {
    car.endT += dt;
    if (car.endT > 0.7) return [exitVehicle(car, c, true)];
  } else car.endT = 0;
  return [];
}
