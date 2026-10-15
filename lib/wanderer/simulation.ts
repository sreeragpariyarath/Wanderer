import { updateCamera } from './camera';
import { updateCharacter, type Movement, type SceneEvent } from './character';
import { advanceIntro } from './loading';
import { ParticleEmitter, emitSplash, updateParticles } from './particles';
import type { RenderState, SceneState } from './state';
import { updateVehicle } from './vehicle';
import { waterCrossing } from './water';
import { updateWeather } from './weather';

interface PreviousPose {
  x: number;
  y: number;
  cameraX: number;
  cameraY: number;
  vehicleX: number;
}
/** Composes feature updates without browser or React dependencies. */
export class SceneSimulation {
  private previous: PreviousPose | null = null;
  private emitter = new ParticleEmitter();
  constructor(
    private scene: SceneState,
    private random: () => number = Math.random,
  ) {}
  resetInterpolation(): void {
    this.previous = null;
  }
  update(
    input: Movement,
    dt: number,
    viewport: { width: number; height: number },
  ): SceneEvent[] {
    const s = this.scene;
    this.previous = {
      x: s.character.x,
      y: s.character.y,
      cameraX: s.camera.x,
      cameraY: s.camera.y,
      vehicleX: s.vehicle.x,
    };
    s.time += dt;
    let events: SceneEvent[];
    if (!s.introDone) events = advanceIntro(s, dt, this.random);
    else {
      const previousX = s.character.x,
        previousY = s.character.y;
      events = s.vehicle.in
        ? updateVehicle(s.vehicle, s.character, input, dt)
        : updateCharacter(s.character, input, dt);
      const splash = waterCrossing(
        previousX,
        previousY,
        s.character.x,
        s.character.y,
      );
      if (splash) events.push(splash);
    }
    for (const event of events)
      if (event.type === 'splash' && !s.reducedMotion)
        emitSplash(s.parts, event, this.random);
    s.parts = updateParticles(s.parts, dt);
    s.puffs = s.puffs.filter((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.r += dt * 9;
      p.life -= dt * 1.1;
      return p.life > 0;
    });
    this.emitter.update(
      s.parts,
      s.puffs,
      s.character,
      s.villageColors,
      dt,
      this.random,
      s.reducedMotion,
    );
    updateWeather(
      s,
      s.character.x,
      Boolean(s.vehicle.started),
      dt,
      viewport.width,
      viewport.height,
      this.random,
      s.reducedMotion,
    );
    updateCamera(
      s.camera,
      s.character.x,
      s.character.y,
      s.character.mode === 'scripted-launch',
      dt,
    );
    if (
      events.some(
        (event) =>
          event.type === 'intro-complete' || event.type === 'vehicle-exit',
      )
    )
      this.resetInterpolation();
    return events;
  }
  interpolate(alpha: number): RenderState {
    const s = this.scene,
      p = this.previous;
    const blend = (a: number, b: number) => a + (b - a) * alpha;
    const render: RenderState = p
      ? {
          ...s,
          character: {
            ...s.character,
            x: blend(p.x, s.character.x),
            y: blend(p.y, s.character.y),
          },
          camera: {
            x: blend(p.cameraX, s.camera.x),
            y: blend(p.cameraY, s.camera.y),
          },
          vehicle: { ...s.vehicle, x: blend(p.vehicleX, s.vehicle.x) },
        }
      : s;
    return s.reducedMotion
      ? {
          ...render,
          time: 0,
          character: { ...render.character, treeVisibility: 1, waveAmount: 0 },
          parts: [],
          puffs: [],
          shootingStars: [],
        }
      : render;
  }
}
