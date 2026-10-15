import { SceneAudio } from './wanderer/audio';
import { bindKeyboard } from './wanderer/browserInput';
import { placeCharacter, type SceneEvent } from './wanderer/character';
import { FixedClock } from './wanderer/clock';
import { createScene } from './wanderer/initialize';
import { InputState, type HeldAction } from './wanderer/input';
import { completeIntro } from './wanderer/loading';
import { positionOverlays, type OverlayElements } from './wanderer/overlays';
import { initializePalette } from './wanderer/palette';
import {
  JourneyWriter,
  captureJourney,
  readJourney,
} from './wanderer/persistence';
import { SceneRenderer } from './wanderer/renderer';
import { SceneSimulation } from './wanderer/simulation';
import type { SceneState } from './wanderer/state';
import { terrainHeight } from './wanderer/terrain';
import { interactVehicle } from './wanderer/vehicle';
import { INITIAL_VIEW, deriveView, type ViewModel } from './wanderer/viewModel';

export default class WandererEngine {
  private scene: SceneState | null = null;
  private view: ViewModel = { ...INITIAL_VIEW };
  private listeners = new Set<() => void>();
  private input = new InputState();
  private clock = new FixedClock();
  private audio: SceneAudio | null = null;
  private renderer: SceneRenderer | null = null;
  private simulation: SceneSimulation | null = null;
  private writer: JourneyWriter | null = null;
  private raf = 0;
  private running = false;
  private cleanups: Array<() => void> = [];
  private canvas: HTMLCanvasElement | null = null;
  private overlays: OverlayElements | null = null;
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  readonly getSnapshot = (): ViewModel => this.view;
  readonly getServerSnapshot = (): ViewModel => INITIAL_VIEW;
  private publish(next: ViewModel): void {
    if (
      (Object.keys(next) as Array<keyof ViewModel>).every(
        (key) => next[key] === this.view[key],
      )
    )
      return;
    this.view = next;
    this.listeners.forEach((listener) => listener());
  }
  private sync = (): void => {
    if (this.scene)
      this.publish(deriveView(this.scene, this.view, this.input.snapshot()));
  };
  start(canvas: HTMLCanvasElement, overlays: OverlayElements): void {
    if (this.running) return;
    this.running = true;
    this.canvas = canvas;
    this.overlays = overlays;
    this.clock.reset();
    this.input.clear();
    this.simulation?.resetInterpolation();
    this.scene = createScene();
    this.audio = new SceneAudio();
    this.renderer = new SceneRenderer();
    this.simulation = new SceneSimulation(this.scene);
    this.view = { ...INITIAL_VIEW };
    let context: CanvasRenderingContext2D | null = null;
    try {
      context = canvas.getContext('2d');
    } catch {}
    if (!context) {
      this.publish({ ...this.view, error: true });
      return;
    }
    const s = this.scene;
    initializePalette(s);
    try {
      const storage = window.localStorage;
      this.writer = new JourneyWriter(storage);
      const save = readJourney(storage);
      if (save) {
        completeIntro(s);
        placeCharacter(s.character, save.x);
        Object.assign(s.vehicle, save.vehicle, {
          v: 0,
          endT: 0,
          startX: save.vehicle.x,
        });
        if (save.vehicle.in) {
          s.character.mode = 'seated';
          s.character.x = s.vehicle.x;
          s.character.y = terrainHeight(s.vehicle.x, s.vehicle.x);
        }
        this.publish({ ...this.view, sound: save.sound });
      }
    } catch {
      this.writer = null;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    s.reducedMotion = reduced.matches;
    if (s.reducedMotion) completeIntro(s);
    const motion = () => {
      s.reducedMotion = reduced.matches;
      if (reduced.matches && !s.introDone) this.skipIntro();
    };
    reduced.addEventListener('change', motion);
    this.cleanups.push(() => reduced.removeEventListener('change', motion));
    s.camera = { x: s.character.x, y: s.character.y };
    document.documentElement.lang = 'en';
    this.audio.setEnabled(this.view.sound);
    this.cleanups.push(
      bindKeyboard(this.input, {
        enabled: () => Boolean(this.scene?.introDone),
        interact: this.interact,
        unlock: () => this.audio?.unlock(),
        changed: this.sync,
      }),
    );
    const visibility = () => {
      this.input.clear();
      this.clock.reset();
      this.simulation?.resetInterpolation();
      this.sync();
      cancelAnimationFrame(this.raf);
      if (document.hidden) this.flush();
      else if (this.running) this.raf = requestAnimationFrame(this.frame);
    };
    const hide = () => this.flush();
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', hide);
    this.cleanups.push(
      () => document.removeEventListener('visibilitychange', visibility),
      () => window.removeEventListener('pagehide', hide),
    );
    this.sync();
    if (!document.hidden) this.raf = requestAnimationFrame(this.frame);
  }
  private frame = (now: number): void => {
    if (!this.running || document.hidden || !this.scene || !this.canvas) return;
    const alpha = this.clock.advance(now, (dt) => this.update(dt));
    const render = this.simulation?.interpolate(alpha);
    const frame = render ? this.renderer?.render(render, this.canvas) : null;
    if (frame && render && this.overlays)
      positionOverlays(render, frame, this.overlays, this.view.cardIndex);
    this.raf = requestAnimationFrame(this.frame);
  };
  private update(dt: number): void {
    const events =
      this.simulation?.update(this.input.snapshot(), dt, {
        width: this.canvas?.clientWidth ?? 0,
        height: this.canvas?.clientHeight ?? 0,
      }) ?? [];
    if (events.some((event) => event.type === 'intro-complete'))
      this.input.clear();
    this.handleEvents(events);
    this.sync();
    this.save(dt);
  }
  private handleEvents(events: SceneEvent[]): void {
    for (const event of events) {
      if (event.type === 'step') this.audio?.play();
      else if (event.type === 'launch') this.audio?.play(320, 0.5);
      else if (event.type === 'splash') this.audio?.play(90, 0.25);
      else if (event.type !== 'intro-complete')
        this.audio?.play(event.type === 'landing' ? 120 : 220, 0.15);
    }
  }
  readonly skipIntro = (): void => {
    const s = this.scene;
    if (!s || s.introDone) return;
    completeIntro(s);
    this.input.clear();
    s.camera = { x: s.character.x, y: s.character.y };
    this.simulation?.resetInterpolation();
    this.clock.reset();
    this.sync();
    this.flush();
  };
  readonly interact = (): void => {
    const s = this.scene;
    if (!s?.introDone) return;
    this.audio?.unlock();
    const result = interactVehicle(s.vehicle, s.character);
    this.handleEvents(result.events);
    if (!result.handled && this.view.cardVisible)
      this.publish({ ...this.view, expanded: !this.view.expanded });
    if (result.events.length) this.simulation?.resetInterpolation();
    this.sync();
  };
  readonly collapseCard = (): void =>
    this.publish({ ...this.view, expanded: false });
  readonly toggleSound = (): void => {
    const sound = !this.view.sound;
    this.publish({ ...this.view, sound });
    this.audio?.setEnabled(sound);
    if (sound) this.audio?.unlock();
  };
  readonly hold = (pointerId: number, action: HeldAction): void => {
    if (!this.scene?.introDone) return;
    this.audio?.unlock();
    this.input.hold(`pointer:${pointerId}`, action);
    this.sync();
  };
  readonly release = (pointerId: number): void => {
    this.input.release(`pointer:${pointerId}`);
    this.sync();
  };
  private save(dt = 0, flush = false): void {
    const s = this.scene;
    if (s?.introDone)
      this.writer?.write(
        captureJourney(s.character, s.vehicle, this.view.sound),
        dt,
        flush,
      );
  }
  private flush = (): void => this.save(0, true);
  dispose(): void {
    if (!this.running) return;
    this.flush();
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.cleanups.splice(0).forEach((clean) => clean());
    this.input.clear();
    this.clock.reset();
    this.audio?.dispose();
    this.renderer?.dispose();
    this.audio = null;
    this.renderer = null;
    this.writer = null;
    this.scene = null;
    this.simulation = null;
    this.canvas = null;
    this.overlays = null;
  }
}
