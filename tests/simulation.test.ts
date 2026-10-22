import { describe, expect, it } from 'vitest';
import {
  createCharacter,
  placeCharacter,
  updateCharacter,
} from '../lib/wanderer/character';
import { FixedClock } from '../lib/wanderer/clock';
import { STEP, WORLD } from '../lib/wanderer/config';
import { createScene } from '../lib/wanderer/initialize';
import { InputState } from '../lib/wanderer/input';
import { advanceIntro, completeIntro } from '../lib/wanderer/loading';
import { emitSplash, updateParticles } from '../lib/wanderer/particles';
import { darknessAt, terrainHeight } from '../lib/wanderer/terrain';
import { SceneSimulation } from '../lib/wanderer/simulation';
import type { Particle } from '../lib/wanderer/types';
import {
  canEnterVehicle,
  interactVehicle,
  updateVehicle,
} from '../lib/wanderer/vehicle';
import { riverBedY, waterCrossing } from '../lib/wanderer/water';
import { updateWeather } from '../lib/wanderer/weather';

describe('character physics', () => {
  it('walks, runs, reverses and follows slopes', () => {
    const c = createCharacter();
    placeCharacter(c, 2000);
    for (let i = 0; i < 60; i++)
      updateCharacter(c, { direction: 1, run: false }, STEP);
    expect(c.velocityX).toBeCloseTo(170, 0);
    const walked = c.x - 2000;
    placeCharacter(c, 2000);
    for (let i = 0; i < 60; i++)
      updateCharacter(c, { direction: 1, run: true }, STEP);
    expect(c.x - 2000).toBeGreaterThan(walked * 2);
    expect(c.y).toBeCloseTo(terrainHeight(c.x, c.x));
    for (let i = 0; i < 60; i++)
      updateCharacter(c, { direction: -1, run: false }, STEP);
    expect(c.velocityX).toBeLessThan(0);
    expect(c.facing).toBe(-1);
  });
  it.each([false, true])(
    'retains the bridge jump and produces one splash (run=%s)',
    (run) => {
      const scene = createScene();
      completeIntro(scene);
      const c = scene.character;
      const simulation = new SceneSimulation(scene, () => 0.5);
      placeCharacter(c, 8299);
      c.velocityX = run ? 420 : 170;
      const initialY = c.y;
      let airborne = false,
        splashes = 0,
        landings = 0;
      for (let i = 0; i < 180; i++) {
        const events = simulation.update({ direction: 1, run }, STEP, {
          width: 1280,
          height: 800,
        });
        if (c.mode === 'airborne' && c.y < initialY) airborne = true;
        splashes += events.filter((event) => event.type === 'splash').length;
        landings += events.filter((e) => e.type === 'landing').length;
      }
      expect(airborne).toBe(true);
      expect(splashes).toBe(1);
      expect(landings).toBe(0);
      expect(c.mode).toBe('swimming');
    },
  );
  it.each([
    [WORLD.minX, -1],
    [WORLD.maxX, 1],
  ] as const)('stops at boundary %s', (x, direction) => {
    const c = createCharacter();
    placeCharacter(c, x);
    updateCharacter(c, { direction, run: true }, STEP);
    expect(c.x).toBe(x);
    expect(c.velocityX).toBe(0);
  });
});
describe('clock', () => {
  it('gives equal results at 30, 60 and 120Hz', () => {
    const positions = [30, 60, 120].map((hz) => {
      const clock = new FixedClock(),
        c = createCharacter();
      placeCharacter(c, 1000);
      clock.advance(0, () => {});
      for (let i = 1; i <= hz * 3; i++)
        clock.advance((i * 1000) / hz, (dt) =>
          updateCharacter(c, { direction: 1, run: true }, dt),
        );
      return c.x;
    });
    expect(positions[0]).toBeCloseTo(positions[1], 8);
    expect(positions[1]).toBeCloseTo(positions[2], 8);
  });
  it('caps stalls to five steps and resets on resume', () => {
    const clock = new FixedClock();
    let count = 0;
    clock.advance(0, () => count++);
    clock.advance(60000, () => count++);
    expect(count).toBe(5);
    clock.reset();
    clock.advance(120000, () => count++);
    expect(count).toBe(5);
  });
});
describe('vehicle', () => {
  it('checks entry, preserves action priority and permits a slow exit', () => {
    const s = createScene(),
      c = s.character,
      car = s.vehicle;
    placeCharacter(c, 760);
    c.mode = 'airborne';
    expect(canEnterVehicle(car, c)).toBe(false);
    c.mode = 'grounded';
    expect(interactVehicle(car, c).events[0].type).toBe('vehicle-entry');
    car.v = 100;
    expect(interactVehicle(car, c)).toEqual({ handled: true, events: [] });
    expect(car.in).toBe(true);
    car.v = 10;
    expect(interactVehicle(car, c).events[0].type).toBe('vehicle-exit');
    expect(c.x).toBe(885);
    expect(c.mode).toBe('grounded');
  });
  it('clamps reverse travel and exits only once at the far end', () => {
    const s = createScene();
    placeCharacter(s.character, 760);
    interactVehicle(s.vehicle, s.character);
    s.vehicle.x = WORLD.roadStart;
    for (let i = 0; i < 60; i++)
      updateVehicle(s.vehicle, s.character, { direction: -1, run: true }, STEP);
    expect(s.vehicle.x).toBe(WORLD.roadStart);
    expect(s.vehicle.v).toBe(0);
    s.vehicle.x = WORLD.roadEnd - 5;
    s.vehicle.v = 900;
    let exits = 0;
    for (let i = 0; i < 180; i++)
      exits += updateVehicle(
        s.vehicle,
        s.character,
        { direction: 1, run: true },
        STEP,
      ).length;
    expect(exits).toBe(1);
    expect(s.vehicle.arrived).toBe(true);
    expect(s.vehicle.in).toBe(false);
    expect(s.character.mode).toBe('grounded');
    expect(s.character.velocityY).toBe(0);
    expect(s.character.x).toBe(WORLD.roadEnd + 18);
    expect(s.character.velocityX).toBeGreaterThan(0);
    const exitX = s.character.x;
    for (let i = 0; i < 90; i++)
      updateCharacter(s.character, { direction: 0, run: false }, STEP);
    expect(s.character.mode).toBe('grounded');
    expect(s.character.x).toBeGreaterThan(exitX);
    expect(s.character.x).toBeLessThan(exitX + 25);
    expect(Math.abs(s.character.velocityX)).toBeLessThan(0.1);
    expect(canEnterVehicle(s.vehicle, s.character)).toBe(false);
  });
});
describe('river swimming', () => {
  it('slopes the riverbed deeper toward the end of the bridge', () => {
    const start = riverBedY(WORLD.bridgeStart);
    const quarter = riverBedY(
      WORLD.bridgeStart + (WORLD.bridgeEnd - WORLD.bridgeStart) * 0.25,
    );
    const middle = riverBedY(
      WORLD.bridgeStart + (WORLD.bridgeEnd - WORLD.bridgeStart) * 0.5,
    );
    const end = riverBedY(WORLD.bridgeEnd);

    expect(quarter).toBeGreaterThan(start);
    expect(middle).toBeGreaterThan(quarter);
    expect(end).toBeGreaterThan(middle);
    expect(end - start).toBeGreaterThan(150);
    expect(
      Math.abs(riverBedY(WORLD.bridgeEnd + 1) - riverBedY(WORLD.bridgeEnd - 1)),
    ).toBeLessThan(2);
  });

  it('keeps the river and shore in daylight', () => {
    for (const x of [8400, WORLD.wreckX, WORLD.waterEnd, WORLD.maxX])
      expect(darknessAt(x)).toBe(0);
  });
  it('can swim back into the river from the shore without walking on the bed', () => {
    const scene = createScene();
    completeIntro(scene);
    placeCharacter(scene.character, WORLD.waterEnd + 2);
    const simulation = new SceneSimulation(scene, () => 0.5);
    for (let i = 0; i < 60; i++)
      simulation.update({ direction: -1, run: false }, STEP, {
        width: 1280,
        height: 800,
      });
    expect(scene.character.mode).toBe('swimming');
    expect(scene.character.x).toBeLessThan(WORLD.waterEnd);
  });
  it('enters once, swims up and down, and climbs onto the far bank', () => {
    const scene = createScene();
    completeIntro(scene);
    placeCharacter(scene.character, WORLD.bridgeEnd - 1);
    scene.character.velocityX = 170;
    const simulation = new SceneSimulation(scene, () => 0.5);
    let splashes = 0;
    for (let i = 0; i < 180 && scene.character.mode !== 'swimming'; i++)
      splashes += simulation
        .update({ direction: 1, verticalDirection: 0, run: false }, STEP, {
          width: 1280,
          height: 800,
        })
        .filter((event) => event.type === 'splash').length;
    expect(scene.character.mode).toBe('swimming');
    expect(splashes).toBe(1);

    scene.character.y = riverBedY(scene.character.x) - 18;
    const deepY = scene.character.y;
    for (let i = 0; i < 45; i++)
      simulation.update(
        { direction: 0, verticalDirection: -1, run: false },
        STEP,
        { width: 1280, height: 800 },
      );
    expect(scene.character.y).toBeLessThan(deepY - 20);
    const highY = scene.character.y;
    for (let i = 0; i < 60; i++)
      simulation.update(
        { direction: 0, verticalDirection: 1, run: false },
        STEP,
        { width: 1280, height: 800 },
      );
    expect(scene.character.y).toBeGreaterThan(highY + 20);

    for (let i = 0; i < 1200 && scene.character.mode === 'swimming'; i++)
      simulation.update(
        { direction: 1, verticalDirection: 0, run: true },
        STEP,
        { width: 1280, height: 800 },
      );
    expect(scene.character.mode).toBe('grounded');
    expect(scene.character.x).toBe(WORLD.waterEnd + 20);
    expect(scene.character.velocityY).toBe(0);
  });
});
describe('intro and input', () => {
  it('normal completion and immediate skip use the same playable state', () => {
    const normal = createScene(),
      skipped = createScene();
    let completed = 0;
    completeIntro(skipped);
    completeIntro(skipped);
    for (let i = 0; i < 1500 && !normal.introDone; i++) {
      normal.time += STEP;
      completed += advanceIntro(normal, STEP, () => 0.5).filter(
        (e) => e.type === 'intro-complete',
      ).length;
    }
    expect(normal.introDone).toBe(true);
    expect(completed).toBe(1);
    expect(normal.character).toEqual({
      ...skipped.character,
      gaitPhase: normal.character.gaitPhase,
    });
  });
  it('keeps keyboard and pointer sources independent', () => {
    const input = new InputState();
    input.hold('key:KeyD', 'right');
    input.hold('pointer:1', 'right');
    input.hold('pointer:2', 'run');
    input.release('pointer:1');
    expect(input.snapshot()).toEqual({
      direction: 1,
      verticalDirection: 0,
      run: true,
    });
    input.hold('key:KeyW', 'up');
    expect(input.snapshot().verticalDirection).toBe(-1);
    input.hold('pointer:3', 'down');
    expect(input.snapshot().verticalDirection).toBe(0);
    input.hold('key:KeyA', 'left');
    expect(input.snapshot().direction).toBe(0);
    input.clear();
    expect(input.snapshot()).toEqual({
      direction: 0,
      verticalDirection: 0,
      run: false,
    });
  });
});
describe('effects', () => {
  it('bounds particles and expires them', () => {
    const parts: Particle[] = [];
    for (let i = 0; i < 10; i++)
      emitSplash(parts, { type: 'splash', x: 8400, y: 75 }, () => 0.5);
    expect(parts.length).toBeLessThanOrEqual(1200);
    expect(updateParticles(parts, 10)).toHaveLength(0);
  });
  it('handles zero viewport and reduced motion', () => {
    const s = createScene();
    s.nightIntensity = 1;
    updateWeather(s, 2000, true, 1, 0, 0, () => 0, false);
    expect(s.shootingStars).toHaveLength(0);
    updateWeather(s, 2000, true, 1, 1200, 800, () => 0, true);
    expect(s.shootingStars).toHaveLength(0);
    expect(Number.isFinite(s.nightIntensity)).toBe(true);
  });
  it('detects a swept water crossing exactly once', () => {
    expect(waterCrossing(8200, 0, 8500, 100)?.type).toBe('splash');
    expect(waterCrossing(8500, 100, 8510, 110)).toBeNull();
  });
});
