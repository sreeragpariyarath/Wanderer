import type { HeldAction } from '@/lib/wanderer/input';
import type { ViewModel } from '@/lib/wanderer/viewModel';
import type { PointerEvent } from 'react';
import { labels } from './labels';
export function MovementControls({
  view,
  hold,
  release,
  interact,
}: {
  view: ViewModel;
  hold: (id: number, action: HeldAction) => void;
  release: (id: number) => void;
  interact: () => void;
}) {
  const text = labels();
  const press =
    (action: HeldAction) => (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      hold(event.pointerId, action);
    };
  const lift = (event: PointerEvent<HTMLButtonElement>) =>
    release(event.pointerId);
  const button = (
    action: HeldAction,
    label: string,
    key: string,
    active: boolean,
  ) => (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onPointerDown={press(action)}
      onPointerUp={lift}
      onPointerCancel={lift}
      onLostPointerCapture={lift}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          e.preventDefault();
          hold(action === 'left' ? -1 : action === 'right' ? -2 : -3, action);
        }
      }}
      onKeyUp={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          release(action === 'left' ? -1 : action === 'right' ? -2 : -3);
        }
      }}
      onBlur={() =>
        release(action === 'left' ? -1 : action === 'right' ? -2 : -3)
      }
    >
      {key}
    </button>
  );
  return (
    <div className="movement-controls" hidden={!view.ready || view.error}>
      <span>{text.back}</span>
      {button('left', text.back, 'A', view.direction < 0)}
      {button('right', text.forward, 'D', view.direction > 0)}
      <span>{text.forward}</span>
      <span className="control-divider" />
      {button('run', text.run, 'SHIFT', view.run)}
      <span>{text.run}</span>
      {view.action && (
        <button
          type="button"
          className="context-action"
          disabled={view.action === 'exit' && view.carPrompt === 'drive'}
          onClick={interact}
        >
          {view.action === 'enter'
            ? text.enter
            : view.action === 'exit'
              ? text.exit
              : text.open}
        </button>
      )}
    </div>
  );
}
