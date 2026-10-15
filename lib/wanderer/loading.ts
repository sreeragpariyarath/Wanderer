import { placeCharacter, type SceneEvent } from './character';
import { WORLD } from './config';
import type { SceneState } from './state';
import { terrainHeight } from './terrain';
export function completeIntro(
  s: Pick<SceneState, 'intro' | 'character' | 'introProgress' | 'introDone'>,
): void {
  if (s.introDone) return;
  s.introDone = true;
  s.introProgress = 1;
  s.intro.onSwing = false;
  s.intro.reveal = 16000;
  s.intro.dust = [];
  s.intro.landT = -100;
  placeCharacter(s.character, WORLD.startX);
}
export function advanceIntro(
  s: Pick<
    SceneState,
    | 'intro'
    | 'character'
    | 'introElapsed'
    | 'introProgress'
    | 'introDone'
    | 'time'
    | 'introDots'
  >,
  dt: number,
  random: () => number = Math.random,
): SceneEvent[] {
  const events: SceneEvent[] = [];
  const I = s.intro,
    SWX = -330,
    LEDGE = -150;
  s.introElapsed += dt;
  I.t += dt;
  I.st += dt;
  const p = (s.introProgress = Math.min(
    1,
    Math.max(s.introProgress, Math.min(1, s.introElapsed / 3.2)),
  ));
  if (I.state === 'swing') {
    I.A = 0.22 + 0.5 * Math.min(1, p * 1.3);
    if (p >= 1) Object.assign(I, { state: 'ready' });
  } else if (I.state === 'ready') {
    const ph = I.st * 2.4,
      th = I.A * Math.sin(ph),
      dth = I.A * 2.4 * Math.cos(ph);
    if (th > I.A * 0.45 && dth > 0) {
      const Lr = 165,
        sx = SWX + Lr * Math.sin(th),
        sy = LEDGE - 215 + Lr * Math.cos(th);
      Object.assign(I, { state: 'leap' });
      I.onSwing = false;
      s.character.x = sx + 10;
      s.character.y = sy + 6;
      s.character.velocityX = Lr * dth * Math.cos(th);
      s.character.velocityY = -Lr * dth * Math.sin(th) - 170;
      s.character.sitting = 0;
      s.character.facing = 1;
    }
  } else {
    I.A *= Math.exp(-dt * 0.5);
    if (I.state === 'leap') {
      s.character.x += s.character.velocityX * dt;
      s.character.velocityY += 950 * dt;
      s.character.y += s.character.velocityY * dt;
      if (s.character.velocityY > 0 && s.character.y >= LEDGE) {
        s.character.y = LEDGE;
        s.character.velocityY = 0;
        s.character.velocityX = Math.min(s.character.velocityX, 150);
        Object.assign(I, { state: 'walk' });
        for (let i = 0; i < 14; i++)
          I.dust.push({
            x: s.character.x + (random() - 0.5) * 12,
            y: LEDGE,
            vx: (random() - 0.5) * 120,
            vy: -30 - random() * 80,
            life: 1,
            c: s.introDots[i % s.introDots.length].c,
          });
      }
    } else if (I.state === 'walk') {
      s.character.velocityX +=
        (150 - s.character.velocityX) * Math.min(1, dt * 5);
      s.character.x += s.character.velocityX * dt;
      s.character.gaitPhase += dt * Math.abs(s.character.velocityX) * 0.085;
      if (s.character.x >= -14) {
        Object.assign(I, { state: 'jump' });
        s.character.velocityY = -330;
      }
    } else if (I.state === 'jump') {
      s.character.x += s.character.velocityX * dt;
      s.character.velocityY += 950 * dt;
      s.character.y += s.character.velocityY * dt;
      const tg = terrainHeight(s.character.x, s.character.x);
      if (
        s.character.x > 20 &&
        s.character.velocityY > 0 &&
        s.character.y >= tg
      ) {
        s.character.y = tg;
        s.character.velocityY = 0;
        s.character.velocityX = 0;
        Object.assign(I, { state: 'land' });
        I.t = 0;
        I.landX = s.character.x;
        I.landT = s.time;
        for (let i = 0; i < 26; i++)
          I.dust.push({
            x: s.character.x + (random() - 0.5) * 14,
            y: tg,
            vx: (random() - 0.5) * 180,
            vy: -40 - random() * 120,
            life: 1,
            c: s.introDots[i % s.introDots.length].c,
          });
      }
    } else if (I.state === 'land') {
      I.reveal += dt * 1100;
      s.character.facing = 1;
      s.character.waveAmount = Math.max(
        0,
        Math.min(1, (I.t - 0.3) / 0.2, (1.55 - I.t) / 0.2),
      );
      if (I.t > 1.6) {
        completeIntro(s);
        events.push({
          type: 'intro-complete',
          x: s.character.x,
          y: s.character.y,
        });
      }
    }
  }
  I.dust = I.dust.filter((d) => {
    d.vy += 500 * dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.life -= dt * 1.4;
    return d.life > 0;
  });
  return events;
}
