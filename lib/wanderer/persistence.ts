import type { CharacterState } from './character';
import { WORLD } from './config';
import type { VehicleState } from './types';
export const SAVE_KEY = 'wanderer-save-v1';
export const LEGACY_KEY = 'wanderer-x2';
export interface JourneySave {
  version: 1;
  x: number;
  introComplete: true;
  lang: 'en';
  sound: boolean;
  vehicle: { x: number; in: boolean; started: boolean; arrived: boolean };
}
export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
function finite(value: unknown, min: number, max: number): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  );
}
export function safePosition(x: number): number {
  return x >= WORLD.launchX && x < WORLD.islandStart ? WORLD.launchX - 10 : x;
}
export function parseSave(raw: string): JourneySave | null {
  try {
    const v: unknown = JSON.parse(raw);
    if (
      !record(v) ||
      v.version !== 1 ||
      v.introComplete !== true ||
      !finite(v.x, WORLD.minX, WORLD.maxX) ||
      (v.lang !== 'en' && v.lang !== 'ja') ||
      typeof v.sound !== 'boolean' ||
      !record(v.vehicle)
    )
      return null;
    const car = v.vehicle;
    if (
      !finite(car.x, WORLD.roadStart, WORLD.roadEnd) ||
      typeof car.in !== 'boolean' ||
      typeof car.started !== 'boolean' ||
      typeof car.arrived !== 'boolean' ||
      (car.in && (!car.started || car.arrived)) ||
      (car.arrived && (!car.started || car.x < WORLD.roadEnd - 1))
    )
      return null;
    return {
      version: 1,
      x: safePosition(v.x),
      introComplete: true,
      lang: 'en',
      sound: v.sound,
      vehicle: {
        x: car.x,
        in: car.in,
        started: car.started,
        arrived: car.arrived,
      },
    };
  } catch {
    return null;
  }
}
export function readJourney(storage: StoragePort): JourneySave | null {
  try {
    const current = storage.getItem(SAVE_KEY);
    if (current !== null) return parseSave(current);
    const legacy = storage.getItem(LEGACY_KEY);
    if (legacy === null || legacy.trim() === '') return null;
    const x = Number(legacy);
    if (!finite(x, WORLD.minX, WORLD.maxX)) return null;
    const migrated: JourneySave = {
      version: 1,
      x: safePosition(x),
      introComplete: true,
      lang: 'en',
      sound: false,
      vehicle: { x: 760, in: false, started: false, arrived: false },
    };
    try {
      storage.setItem(SAVE_KEY, JSON.stringify(migrated));
      storage.removeItem(LEGACY_KEY);
    } catch {
      /* Preserve legacy data if writes fail. */
    }
    return migrated;
  } catch {
    return null;
  }
}
export function captureJourney(
  c: Readonly<CharacterState>,
  car: Readonly<VehicleState>,
  sound: boolean,
): JourneySave {
  return {
    version: 1,
    x: safePosition(c.safeX),
    introComplete: true,
    lang: 'en',
    sound,
    vehicle: {
      x: car.x,
      in: car.in,
      started: Boolean(car.started),
      arrived: car.arrived,
    },
  };
}
export class JourneyWriter {
  private previous = '';
  private elapsed = 0;
  constructor(private storage: StoragePort) {}
  write(save: JourneySave, dt = 0, flush = false): void {
    this.elapsed += dt;
    if (!flush && this.elapsed < 0.5) return;
    this.elapsed = 0;
    const raw = JSON.stringify(save);
    if (raw === this.previous) return;
    try {
      this.storage.setItem(SAVE_KEY, raw);
      this.previous = raw;
    } catch {
      /* Storage is optional. */
    }
  }
}
