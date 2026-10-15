import { smoothStep } from './math';
export function terrainHeight(playerX: number, x: number): number {
  let y = Math.sin(x * 0.0018) * 10 + Math.sin(x * 0.0007 + 1) * 14;
  y *= 1 - (smoothStep(6850, 7000, x) - smoothStep(8300, 8360, x));
  y += 260 * smoothStep(8300, 8420, x);
  // A shallow shore replaces the abrupt wall at the river's far edge.
  y -= 180 * smoothStep(9950, 10300, x) * (1 - smoothStep(10300, 10900, x));
  y -= 560 * smoothStep(11000, 12100, x);
  y -= 900 * smoothStep(13900, 13940, x);
  if (x > 7000 && x < 8300 && playerX > 7000 && playerX < 8300) {
    const ends =
      smoothStep(7000, 7200, x) *
      (1 - smoothStep(8100, 8300, x)) *
      smoothStep(7000, 7150, playerX) *
      (1 - smoothStep(8150, 8300, playerX));
    y += ends * 2.5 * Math.exp(-Math.pow((x - playerX) / 40, 2));
  }
  return y;
}

export function darknessAt(x: number): number {
  return smoothStep(13900, 14300, x);
}
