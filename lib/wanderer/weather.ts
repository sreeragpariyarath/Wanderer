import { smoothStep } from './math';
import type { SceneState } from './state';
export function updateWeather(
  s: Pick<SceneState, 'nightIntensity' | 'shootingStars'>,
  playerX: number,
  carStarted: boolean,
  dt: number,
  width: number,
  height: number,
  random: () => number,
  reduced: boolean,
): void {
  const target = carStarted
    ? // Night falls only over the city drive; dawn returns as the forest begins.
      smoothStep(900, 1250, playerX) * (1 - smoothStep(2700, 3700, playerX))
    : 0;
  s.nightIntensity += (target - s.nightIntensity) * (1 - Math.exp(-1.2 * dt));
  if (
    !reduced &&
    width > 0 &&
    height > 0 &&
    s.nightIntensity > 0.5 &&
    random() < 1 - Math.exp(-dt / 2.2)
  )
    s.shootingStars.push({
      x: 0.35 + random() * 0.75,
      y: 0.04 + random() * 0.22,
      vx: -(480 + random() * 300),
      vy: 170 + random() * 120,
      life: 0.9,
    });
  s.shootingStars = s.shootingStars
    .filter((p) => {
      p.life -= dt;
      if (width > 0 && height > 0) {
        p.x += (p.vx * dt) / width;
        p.y += (p.vy * dt) / height;
      }
      return p.life > 0;
    })
    .slice(-20);
}
