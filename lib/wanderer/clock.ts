import { STEP } from './config';
export class FixedClock {
  private previous: number | null = null;
  private accumulator = 0;
  reset(): void {
    this.previous = null;
    this.accumulator = 0;
  }
  advance(now: number, update: (dt: number) => void): number {
    if (this.previous === null) {
      this.previous = now;
      return 0;
    }
    const elapsed = Math.max(
      0,
      Math.min(STEP * 5, (now - this.previous) / 1000),
    );
    this.previous = now;
    this.accumulator += elapsed;
    let steps = 0;
    while (this.accumulator + 1e-10 >= STEP && steps < 5) {
      update(STEP);
      this.accumulator -= STEP;
      steps++;
    }
    this.accumulator = Math.max(0, this.accumulator);
    return Math.min(1, this.accumulator / STEP);
  }
}
