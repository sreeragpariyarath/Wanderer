import { WORLD } from './config';
import { smoothStep } from './math';
export function terrainHeight(playerX: number, x: number): number {
  let y = Math.sin(x * 0.0018) * 10 + Math.sin(x * 0.0007 + 1) * 14;
  y *=
    1 -
    (smoothStep(WORLD.bridgeStart - 150, WORLD.bridgeStart, x) -
      smoothStep(WORLD.bridgeEnd, WORLD.bridgeEnd + 60, x));
  y += 260 * smoothStep(WORLD.bridgeEnd, WORLD.bridgeEnd + 120, x);
  // A shallow shore replaces the abrupt wall at the river's far edge.
  y -= 180 * smoothStep(9950, 10300, x) * (1 - smoothStep(10300, 10900, x));
  y -= 560 * smoothStep(11000, 12100, x);
  y -= 900 * smoothStep(13900, 13940, x);
  if (
    x > WORLD.bridgeStart &&
    x < WORLD.bridgeEnd &&
    playerX > WORLD.bridgeStart &&
    playerX < WORLD.bridgeEnd
  ) {
    const ends =
      smoothStep(WORLD.bridgeStart, WORLD.bridgeStart + 200, x) *
      (1 - smoothStep(WORLD.bridgeEnd - 200, WORLD.bridgeEnd, x)) *
      smoothStep(WORLD.bridgeStart, WORLD.bridgeStart + 150, playerX) *
      (1 - smoothStep(WORLD.bridgeEnd - 150, WORLD.bridgeEnd, playerX));
    y += ends * 2.5 * Math.exp(-Math.pow((x - playerX) / 40, 2));
  }
  return y;
}

export function darknessAt(x: number): number {
  return smoothStep(13900, 14300, x);
}
