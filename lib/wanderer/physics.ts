import { MOTION } from './config';

export interface Body {
  y: number;
  velocityY: number;
}
/** Positive Y points downward. Returns true only on descending contact. */
export function integrateVertical(
  body: Body,
  groundY: number,
  dt: number,
  canLand = true,
): boolean {
  body.y += body.velocityY * dt + 0.5 * MOTION.gravity * dt * dt;
  body.velocityY += MOTION.gravity * dt;
  if (canLand && body.velocityY >= 0 && body.y >= groundY) {
    body.y = groundY;
    body.velocityY = 0;
    return true;
  }
  return false;
}
export function crossesForward(
  previous: number,
  next: number,
  boundary: number,
): boolean {
  return previous < boundary && next >= boundary;
}
