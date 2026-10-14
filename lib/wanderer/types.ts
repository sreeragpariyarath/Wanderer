export type Language = 'en' | 'ja';
export type LocalizedCard = [string, string, string, string];
export type RGB = [number, number, number];
export type ScreenY = (worldY: number) => number;

export interface Caption {
  x: number;
  en: string;
  ja: string;
}

export interface SceneCard {
  x: number;
  en: LocalizedCard;
  ja: LocalizedCard;
}

export interface EngineState {
  lang: Language;
  sound: boolean;
  dir: number;
  card: number;
  expanded: boolean;
  run: boolean;
  carPrompt: 'drive' | 'enter' | null;
}

export interface EngineRef<T> {
  current: T | null;
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
  k?: number;
}

export interface CloudPoint {
  x: number;
  y: number;
  r: number;
  c: number;
}

export interface Particle {
  k: 'petal' | 'drop' | 'rect';
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  drag: number;
  life: number;
  max: number;
  rot?: number;
  c?: string;
  r?: number;
  vr?: number;
  w?: number;
}

export interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  c: string;
}

export interface IntroState {
  state: 'swing' | 'ready' | 'leap' | 'walk' | 'jump' | 'land';
  t: number;
  st: number;
  A: number;
  reveal: number;
  landX: number;
  onSwing: boolean;
  dust: DustParticle[];
  landT?: number;
}

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

export interface BackBuilding {
  x: number;
  w: number;
  h: number;
  c: string;
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
  y?: number;
}
