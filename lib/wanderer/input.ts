import type { Movement } from './character';
export type HeldAction = 'left' | 'right' | 'up' | 'down' | 'run';
export class InputState {
  private held = new Map<string, HeldAction>();
  hold(source: string, action: HeldAction): void {
    this.held.set(source, action);
  }
  release(source: string): void {
    this.held.delete(source);
  }
  clear(): void {
    this.held.clear();
  }
  snapshot(): Movement {
    const active = new Set(this.held.values());
    return {
      direction: (Number(active.has('right')) -
        Number(active.has('left'))) as Movement['direction'],
      verticalDirection: (Number(active.has('down')) -
        Number(active.has('up'))) as NonNullable<Movement['verticalDirection']>,
      run: active.has('run'),
    };
  }
}
export function keyAction(key: string): HeldAction | null {
  const k = key.toLowerCase();
  return k === 'a' || k === 'arrowleft'
    ? 'left'
    : k === 'd' || k === 'arrowright'
      ? 'right'
      : k === 'w' || k === 'arrowup'
        ? 'up'
        : k === 's' || k === 'arrowdown'
          ? 'down'
          : k === 'shift'
            ? 'run'
            : null;
}
export function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        'button,input,textarea,select,a,[contenteditable="true"],[role="button"]',
      ),
    )
  );
}
