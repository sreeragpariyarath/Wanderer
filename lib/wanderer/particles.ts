import type { CharacterState, SceneEvent } from './character';
import { PARTICLE_LIMIT } from './config';
import type { Particle, Puff } from './types';

export function updateParticles(parts: Particle[], dt: number): Particle[] {
  return parts
    .filter((p) => {
      const drag = Math.exp(-p.drag * dt);
      p.vx *= drag;
      p.vy = p.vy * drag + p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.k === 'rect') p.rot += p.vr * dt;
      return p.life > 0;
    })
    .slice(-PARTICLE_LIMIT);
}
export function emitSplash(
  parts: Particle[],
  event: SceneEvent,
  random: () => number,
): void {
  for (let i = 0; i < 70; i++) {
    const big = random();
    parts.push({
      k: 'drop',
      x: event.x + (random() - 0.5) * 60,
      y: event.y + random() * 20,
      vx: (random() - 0.5) * 240,
      vy: -60 - Math.pow(random(), 0.6) * 220,
      g: 400,
      drag: 1.4,
      life: 0.6 + random() * 0.8,
      max: 1.4,
      r: 1 + big * big * 4,
      c: ['#3d6fa8', '#5b8fc7', '#7fb3c9', '#86b0dc'][Math.floor(random() * 4)],
    });
  }
  if (parts.length > PARTICLE_LIMIT)
    parts.splice(0, parts.length - PARTICLE_LIMIT);
}
export class ParticleEmitter {
  private petals = 0;
  private exhaust = 0;
  update(
    parts: Particle[],
    puffs: Puff[],
    c: Readonly<CharacterState>,
    colors: readonly string[],
    dt: number,
    random: () => number,
    reduced: boolean,
  ): void {
    if (reduced) {
      this.petals = 0;
      this.exhaust = 0;
      return;
    }
    if (c.mode === 'scripted-launch' && c.velocityY < -150) {
      this.petals += dt * 180;
      while (this.petals >= 1) {
        this.petals--;
        parts.push({
          k: 'petal',
          x: c.x + (random() - 0.5) * 14,
          y: c.y + 4,
          vx: (random() - 0.5) * 40,
          vy: 40 + random() * 80,
          g: 15,
          drag: 0.6,
          life: 2.2 + random() * 1.5,
          max: 3.7,
          rot: random() * 6,
          c: colors[Math.floor(random() * colors.length)],
        });
      }
    } else this.petals = 0;
    if (c.mode === 'seated') {
      this.exhaust += dt * (Math.abs(c.velocityX) > 30 ? 20 : 5);
      while (this.exhaust >= 1) {
        this.exhaust--;
        puffs.push({
          x: c.x - 98,
          y: c.y - 24,
          vx: -30 - random() * 30 - c.velocityX * 0.15,
          vy: -18 - random() * 18,
          r: 2 + random() * 2,
          life: 1,
        });
      }
    } else this.exhaust = 0;
    if (parts.length > PARTICLE_LIMIT)
      parts.splice(0, parts.length - PARTICLE_LIMIT);
    if (puffs.length > 100) puffs.splice(0, puffs.length - 100);
  }
}
