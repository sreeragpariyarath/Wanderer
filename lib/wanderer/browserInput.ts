import { InputState, isInteractiveTarget, keyAction } from './input';
export function bindKeyboard(
  input: InputState,
  callbacks: {
    enabled: () => boolean;
    interact: () => void;
    unlock: () => void;
    changed: () => void;
  },
): () => void {
  const down = (event: KeyboardEvent) => {
    const textEntry =
      event.target instanceof Element &&
      event.target.closest('input,textarea,select,[contenteditable="true"]');
    if (
      textEntry ||
      (isInteractiveTarget(event.target) &&
        (event.key === ' ' || event.key === 'Enter'))
    )
      return;
    callbacks.unlock();
    if (!callbacks.enabled()) return;
    const action = keyAction(event.key);
    if (action) {
      event.preventDefault();
      input.hold(`key:${event.code || event.key}`, action);
      callbacks.changed();
    }
    if (event.key === ' ') {
      event.preventDefault();
      if (!event.repeat) callbacks.interact();
    }
  };
  const up = (event: KeyboardEvent) => {
    input.release(`key:${event.code || event.key}`);
    callbacks.changed();
  };
  const clear = () => {
    input.clear();
    callbacks.changed();
  };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', clear);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    window.removeEventListener('blur', clear);
    input.clear();
  };
}
