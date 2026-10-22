import { describe, expect, it } from 'vitest';
import {
  CHECKPOINTS,
  checkpointIndex,
  safePosition,
} from '../lib/wanderer/checkpoints';
describe('checkpoints', () => {
  it('are ordered and start at the beginning', () => {
    expect(CHECKPOINTS[0].x).toBe(70);
    expect(CHECKPOINTS.map((c) => c.x)).toEqual(
      [...CHECKPOINTS.map((c) => c.x)].sort((a, b) => a - b),
    );
  });
  it.each([
    [70, 0],
    [5100, 1],
    [6688, 1],
    [7188, 2],
    [8500, 3],
    [10400, 3],
  ])('position %s reaches checkpoint %s', (x, index) =>
    expect(checkpointIndex(x)).toBe(index),
  );
  it('treats the river as the nearest safe bank', () => {
    expect(safePosition(8400)).toBe(8200);
    expect(safePosition(10000)).toBe(10320);
  });
});
