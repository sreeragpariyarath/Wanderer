// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WandererEngine from '../lib/WandererEngine';
import { SceneAudio } from '../lib/wanderer/audio';
import { placeCharacter } from '../lib/wanderer/character';
import { createScene } from '../lib/wanderer/initialize';
import { completeIntro } from '../lib/wanderer/loading';
import { SAVE_KEY, captureJourney } from '../lib/wanderer/persistence';
import { SceneRenderer } from '../lib/wanderer/renderer';

let callbacks: Map<number, FrameRequestCallback>, next: number;
function context(): CanvasRenderingContext2D {
  const gradient = { addColorStop: vi.fn() };
  const base = {
    getImageData: () => ({ data: new Uint8ClampedArray([32, 31, 29, 255]) }),
    createRadialGradient: () => gradient,
    createLinearGradient: () => gradient,
  };
  return new Proxy(base, {
    get: (target, key) => (key in target ? Reflect.get(target, key) : vi.fn()),
    set: (target, key, value) => Reflect.set(target, key, value),
  }) as unknown as CanvasRenderingContext2D;
}
function mount() {
  const root = document.createElement('div'),
    canvas = document.createElement('canvas');
  root.append(canvas);
  document.body.append(root);
  Object.defineProperties(canvas, {
    clientWidth: { value: 1280, configurable: true },
    clientHeight: { value: 800, configurable: true },
  });
  return { canvas, overlays: { root, card: null, prompt: null } };
}
function tick(time: number) {
  const current = [...callbacks.values()];
  callbacks.clear();
  current.forEach((callback) => callback(time));
}
beforeEach(() => {
  localStorage.clear();
  callbacks = new Map();
  next = 0;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    callbacks.set(++next, cb);
    return next;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => callbacks.delete(id));
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() =>
    context(),
  );
  Object.defineProperty(document, 'hidden', {
    value: false,
    configurable: true,
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});
describe('lifecycle and browser boundary', () => {
  it('construction does not access the browser or schedule work', () => {
    const engine = new WandererEngine();
    expect(callbacks.size).toBe(0);
    expect(engine.getSnapshot().ready).toBe(false);
  });
  it('start/dispose/remount leaves exactly one loop and no active listeners', () => {
    const engine = new WandererEngine(),
      { canvas, overlays } = mount();
    engine.start(canvas, overlays);
    engine.start(canvas, overlays);
    expect(callbacks.size).toBe(1);
    engine.skipIntro();
    engine.dispose();
    expect(callbacks.size).toBe(0);
    engine.dispose();
    engine.start(canvas, overlays);
    expect(callbacks.size).toBe(1);
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'd', code: 'KeyD' }),
    );
    expect(engine.getSnapshot().direction).toBe(1);
    engine.dispose();
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'a', code: 'KeyA' }),
    );
    expect(callbacks.size).toBe(0);
  });
  it('hidden tab cancels work and clears input, resume resets elapsed time', () => {
    const engine = new WandererEngine(),
      { canvas, overlays } = mount();
    engine.start(canvas, overlays);
    engine.skipIntro();
    engine.hold(1, 'right');
    tick(0);
    tick(17);
    Object.defineProperty(document, 'hidden', {
      value: true,
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(callbacks.size).toBe(0);
    expect(engine.getSnapshot().direction).toBe(0);
    const before = JSON.parse(localStorage.getItem(SAVE_KEY)!).x;
    Object.defineProperty(document, 'hidden', {
      value: false,
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    tick(60000);
    window.dispatchEvent(new Event('pagehide'));
    expect(JSON.parse(localStorage.getItem(SAVE_KEY)!).x).toBe(before);
    engine.dispose();
  });
  it('restores a seated car stopped, without creating audio', () => {
    const scene = createScene();
    placeCharacter(scene.character, 760);
    scene.vehicle = { ...scene.vehicle, x: 2000, in: true, started: true };
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(captureJourney(scene.character, scene.vehicle, true)),
    );
    const audio = vi.fn();
    vi.stubGlobal('AudioContext', audio);
    const engine = new WandererEngine(),
      { canvas, overlays } = mount();
    engine.start(canvas, overlays);
    expect(engine.getSnapshot()).toMatchObject({
      ready: true,
      sound: true,
      carPrompt: 'exit',
    });
    expect(audio).not.toHaveBeenCalled();
    engine.dispose();
  });
  it('handles missing canvas and zero dimensions', () => {
    const { canvas, overlays } = mount();
    vi.mocked(canvas.getContext).mockReturnValueOnce(null);
    const engine = new WandererEngine();
    engine.start(canvas, overlays);
    expect(engine.getSnapshot().error).toBe(true);
    engine.dispose();
    Object.defineProperty(canvas, 'clientWidth', { value: 0 });
    expect(new SceneRenderer().render(createScene(), canvas)).toBeNull();
  });
  it('does not intercept Space on a focused button; ignores repeat interactions', () => {
    const scene = createScene();
    placeCharacter(scene.character, 5100);
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        ...captureJourney(scene.character, scene.vehicle, false),
        x: 5100,
      }),
    );
    const engine = new WandererEngine(),
      { canvas, overlays } = mount();
    engine.start(canvas, overlays);
    const repeat = new KeyboardEvent('keydown', {
      key: ' ',
      repeat: true,
      bubbles: true,
      cancelable: true,
    });
    document.body.dispatchEvent(repeat);
    expect(engine.getSnapshot().expanded).toBe(false);
    const button = document.createElement('button');
    document.body.append(button);
    const focused = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    });
    button.dispatchEvent(focused);
    expect(focused.defaultPrevented).toBe(false);
    expect(engine.getSnapshot().expanded).toBe(false);
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
    );
    expect(engine.getSnapshot().expanded).toBe(true);
    engine.dispose();
  });
});
function freeze(value: object): void {
  Object.freeze(value);
  for (const child of Object.values(value))
    if (child && typeof child === 'object' && !Object.isFrozen(child))
      freeze(child);
}
it.each([120, 760, 5100, 7550, 8420, 9300, 10320, 13000, 14800])(
  'rendering at %s leaves all simulation data unchanged',
  (x) => {
    const s = createScene();
    completeIntro(s);
    placeCharacter(s.character, x);
    if (x === 9300) {
      s.character.mode = 'swimming';
      s.character.y = 180;
    }
    s.camera = { x, y: s.character.y };
    const before = JSON.stringify(s);
    freeze(s);
    const { canvas } = mount();
    new SceneRenderer().render(s, canvas);
    expect(JSON.stringify(s)).toBe(before);
  },
);
it('intro rendering uses an immutable seated pose', () => {
  const s = createScene();
  freeze(s);
  const { canvas } = mount();
  expect(() => new SceneRenderer().render(s, canvas)).not.toThrow();
});
it('audio fails safely if unsupported and cannot revive after disposal', () => {
  vi.stubGlobal('AudioContext', undefined);
  const audio = new SceneAudio();
  audio.setEnabled(true);
  expect(() => audio.unlock()).not.toThrow();
  audio.dispose();
  audio.unlock();
  audio.play();
});
