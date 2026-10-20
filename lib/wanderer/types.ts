export type LocalizedCard = [string, string, string, string];
export type RGB = [number, number, number];
export type ScreenY = (worldY: number) => number;

export interface Caption {
  x: number;
  en: string;
}

export interface SceneLink {
  readonly label: string;
  readonly href: string;
}

export interface SceneCard {
  x: number;
  y?: number;
  revealRadius?: number;
  en: LocalizedCard;
  links?: readonly SceneLink[];
}

export interface NumericPalette {
  bg: RGB;
  ink: RGB;
  dot: RGB;
  mut: RGB;
  div: RGB;
  sub: RGB;
}

export interface RenderPalette {
  bg: string;
  ink: string;
  dot: string;
  mut: string;
}

export interface TreePoint {
  x: number;
  y: number;
  r: number;
  trunk: boolean;
  c: number;
  shade?: number;
}

export interface CloudPoint {
  x: number;
  y: number;
  r: number;
  c: number;
}

interface ParticleBase {
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  drag: number;
  life: number;
  max: number;
}
export type Particle = ParticleBase &
  (
    | { k: 'petal'; rot: number; c: string }
    | { k: 'drop'; r: number; c: string }
    | { k: 'rect'; rot: number; vr: number; w: number }
  );

export interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  c: string;
}

interface IntroBase {
  t: number;
  st: number;
  A: number;
  reveal: number;
  landX: number;
  onSwing: boolean;
  dust: DustParticle[];
  landT?: number;
}
export type IntroState = IntroBase &
  (
    | { state: 'swing' }
    | { state: 'ready' }
    | { state: 'leap' }
    | { state: 'walk' }
    | { state: 'jump' }
    | { state: 'land' }
  );

export interface VehicleState {
  x: number;
  v: number;
  rot: number;
  in: boolean;
  endT: number;
  startX: number;
  arrived: boolean;
  started?: boolean;
  pt?: number;
}

export interface Puff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
}

export interface Building {
  x: number;
  w: number;
  h: number;
  c: string;
  roof: number;
  shop: boolean;
  aw: string;
  seed: number;
}

export interface HousePoint {
  x: number;
  y: number;
  len: number;
  horiz: boolean;
  c: string;
  s: number;
  a: number;
}

export interface House {
  x: number;
  pts: HousePoint[];
  wins: [number, number, boolean?][];
}

export interface IntroTreePoint {
  x: number;
  yy: number;
  r: number;
  t: number;
  c: number;
}
