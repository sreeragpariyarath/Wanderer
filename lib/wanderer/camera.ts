export interface Camera {
  x: number;
  y: number;
}
export function updateCamera(
  camera: Camera,
  x: number,
  y: number,
  dt: number,
): void {
  camera.x += (x - camera.x) * (1 - Math.exp(-7.67 * dt));
  camera.y += (y - camera.y) * (1 - Math.exp(-3 * dt));
}
