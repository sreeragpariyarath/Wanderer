import { describe, expect, it } from 'vitest';
import { placeCharacter } from '../lib/wanderer/character';
import { createScene } from '../lib/wanderer/initialize';
import {
  captureJourney,
  JourneyWriter,
  LEGACY_KEY,
  parseSave,
  readJourney,
  SAVE_KEY,
  type StoragePort,
} from '../lib/wanderer/persistence';
class MemoryStorage implements StoragePort {
  data = new Map<string, string>();
  writes = 0;
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.writes++;
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}
function save() {
  const s = createScene();
  placeCharacter(s.character, 5100);
  return captureJourney(s.character, s.vehicle, true);
}
describe('journey saves', () => {
  it('restores previously Japanese saves in English without losing progress', () => {
    const previous = {
      ...save(),
      lang: 'ja',
      vehicle: { x: 2000, in: true, started: true, arrived: false },
    };
    expect(parseSave(JSON.stringify(previous))).toEqual({
      ...previous,
      lang: 'en',
    });
  });
  it('round trips preferences and vehicle state', () => {
    const v = save();
    v.vehicle = { x: 2000, in: true, started: true, arrived: false };
    expect(parseSave(JSON.stringify(v))).toEqual(v);
  });
  it.each([
    '{',
    'null',
    '[]',
    '{}',
    JSON.stringify({ ...save(), version: 99 }),
    JSON.stringify({ ...save(), x: '5100' }),
    JSON.stringify({ ...save(), x: Infinity }),
    JSON.stringify({ ...save(), lang: 'de' }),
    JSON.stringify({
      ...save(),
      vehicle: { x: 99999, in: false, started: false, arrived: false },
    }),
  ])('rejects invalid save %s', (raw) => expect(parseSave(raw)).toBeNull());
  it('normalizes launch-gap coordinates', () =>
    expect(parseSave(JSON.stringify({ ...save(), x: 13850 }))?.x).toBe(13790));
  it('normalizes older saves inside the river to a safe bank', () => {
    expect(parseSave(JSON.stringify({ ...save(), x: 8400 }))?.x).toBe(8200);
    expect(parseSave(JSON.stringify({ ...save(), x: 9000 }))?.x).toBe(9120);
  });
  it.each([
    [120, 120],
    [5100, 3500],
    [6688, 6680],
    [8500, 8200],
    [10000, 9120],
    [13000, 11800],
    [14500, 14000],
  ])('saves section checkpoint %s as %s', (x, checkpoint) => {
    const scene = createScene();
    placeCharacter(scene.character, x);
    expect(captureJourney(scene.character, scene.vehicle, false).x).toBe(
      checkpoint,
    );
  });
  it('migrates legacy only after a successful write', () => {
    const storage = new MemoryStorage();
    storage.setItem(LEGACY_KEY, '7550');
    expect(readJourney(storage)?.x).toBe(6680);
    expect(storage.getItem(LEGACY_KEY)).toBeNull();
    expect(storage.getItem(SAVE_KEY)).not.toBeNull();
  });
  it('retains legacy saves when writes fail', () => {
    const storage = new MemoryStorage();
    storage.setItem(LEGACY_KEY, '7550');
    storage.setItem = () => {
      throw Error('blocked');
    };
    expect(readJourney(storage)?.x).toBe(6680);
    expect(storage.getItem(LEGACY_KEY)).toBe('7550');
  });
  it('handles storage access errors', () =>
    expect(
      readJourney({
        getItem() {
          throw Error('blocked');
        },
        setItem() {},
        removeItem() {},
      }),
    ).toBeNull());
  it('saves the safe ground position while airborne, never velocity', () => {
    const s = createScene();
    placeCharacter(s.character, 13790);
    s.character.mode = 'scripted-launch';
    s.character.x = 14000;
    s.character.velocityY = -500;
    const saved = captureJourney(s.character, s.vehicle, false);
    expect(saved.x).toBe(11800);
    expect(saved).not.toHaveProperty('vy');
  });
  it('throttles changed writes and flushes once', () => {
    const storage = new MemoryStorage(),
      writer = new JourneyWriter(storage),
      v = save();
    for (let i = 0; i < 10; i++) writer.write(v, 0.05);
    expect(storage.writes).toBeLessThanOrEqual(1);
    writer.write(v, 0.01);
    expect(storage.writes).toBe(1);
    writer.write(v, 1);
    expect(storage.writes).toBe(1);
    v.x++;
    writer.write(v, 0, true);
    expect(storage.writes).toBe(2);
  });
});
