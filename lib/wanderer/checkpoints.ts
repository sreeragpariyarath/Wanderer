import { WORLD } from './config';

export interface Checkpoint {
  x: number;
  label: string;
}

// Stable, walkable section starts. Jumping to one never places the character
// inside a transition, jump, or other scripted moment.
export const CHECKPOINTS: readonly Checkpoint[] = [
  { x: 70, label: 'City' },
  { x: 3500, label: 'Forest' },
  { x: 6680, label: 'Bridge' },
  { x: 8200, label: 'River' },
  { x: 10320, label: 'Shore' },
  { x: 11800, label: 'Village' },
  { x: 14000, label: 'Island' },
];

export function safePosition(x: number): number {
  if (x > WORLD.waterStart && x < WORLD.waterEnd)
    return x < (WORLD.waterStart + WORLD.waterEnd) / 2
      ? WORLD.waterStart - 50
      : WORLD.waterEnd + 20;
  return x >= WORLD.launchX && x < WORLD.islandStart ? WORLD.launchX - 10 : x;
}

// Index of the latest checkpoint the given position has reached.
export function checkpointIndex(x: number): number {
  const safe = safePosition(x);
  for (let index = CHECKPOINTS.length - 1; index > 0; index--)
    if (safe >= CHECKPOINTS[index].x) return index;
  return 0;
}
