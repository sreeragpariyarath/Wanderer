import { createCharacter } from './character';
import { CAPTIONS, CARDS } from './sceneData';
import type {
  Building,
  CloudPoint,
  House,
  IntroState,
  IntroTreePoint,
  NumericPalette,
  Particle,
  Puff,
  TreePoint,
  VehicleState,
} from './types';

function defaultPalette(): NumericPalette {
  return {
    bg: [243, 242, 242],
    ink: [32, 31, 29],
    dot: [170, 170, 170],
    mut: [136, 136, 136],
    div: [221, 221, 221],
    sub: [122, 84, 32],
  };
}
export class SceneState {
  character = createCharacter();
  camera = { x: -330, y: -150 };
  reducedMotion = false;
  cardOpacity = 0;
  worldWidth = 16000;
  captions = CAPTIONS;
  cards = CARDS;
  time = 0;
  nightIntensity = 0;
  introDone = false;
  intro: IntroState = {
    state: 'swing',
    t: 0,
    st: 0,
    A: 0.22,
    reveal: 0,
    landX: 0,
    onSwing: true,
    dust: [],
  };
  trees: Array<{ x: number; h: number; pts: TreePoint[] }> = [];
  vehicle: VehicleState = {
    x: 760,
    v: 0,
    rot: 0,
    in: false,
    endT: 0,
    startX: 760,
    arrived: false,
  };
  puffs: Puff[] = [];
  parts: Particle[] = [];
  buildings: Building[] = [];
  mountains: [number, number][][] = [];
  clouds: Array<{ x: number; y: number; pts: CloudPoint[] }> = [];
  seeds: Array<{ x: number; off: number; sp: number }> = [];
  rain: Array<{ x: number; y: number; sp: number }> = [];
  stars: Array<{ x: number; y: number; s: number }> = [];
  villageColors: string[] = [];
  houses: House[] = [];
  ridges: [number, number][][] = [];
  dayPalette: NumericPalette = defaultPalette();
  darkPalette: NumericPalette = defaultPalette();
  nightPalette: NumericPalette = defaultPalette();
  shootingStars: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
  }> = [];
  accent = '#b68235';
  particleColors: string[] = [];
  waterColor = '#5b8fc7';
  rainColor = '#7aa6d6';
  headingFont = 'serif';
  introProgress = 0;
  introElapsed = 0;
  introDots: Array<{ u: number; a: number; s: number; c: string }> = [];
  introTree: IntroTreePoint[] = [];
}
export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;
export type RenderState = DeepReadonly<SceneState>;
