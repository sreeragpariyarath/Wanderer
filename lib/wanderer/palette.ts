import type { SceneState } from './state';
import type { RGB } from './types';
function rgb(str: string): RGB {
  const c = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  if (!c) return [0, 0, 0];
  c.clearRect(0, 0, 1, 1);
  c.fillStyle = '#000';
  c.fillStyle = str;
  c.fillRect(0, 0, 1, 1);
  const d = c.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2]];
}

export function initializePalette(s: SceneState, element: Element): void {
  const cs = getComputedStyle(element),
    v = (name: string, fallback: string) =>
      cs.getPropertyValue(name).trim() || fallback;
  const n9 = rgb(v('--color-neutral-900', '#201f1d'));
  s.dayPalette = {
    bg: rgb(v('--color-bg', '#f3f2f2')),
    ink: rgb(v('--color-text', '#201f1d')),
    dot: rgb(v('--color-neutral-400', '#aaa')),
    mut: rgb(v('--color-neutral-500', '#888')),
    div: rgb(v('--color-divider', '#ddd')),
    sub: rgb(v('--color-accent-700', '#7a5420')),
  };
  s.darkPalette = {
    bg: n9.map((c) => Math.round(c * 0.45)) as RGB,
    ink: s.dayPalette.bg,
    dot: rgb(v('--color-neutral-600', '#666')),
    mut: rgb(v('--color-neutral-400', '#aaa')),
    div: rgb(v('--color-neutral-700', '#444')),
    sub: rgb(v('--color-accent-300', '#e0c08a')),
  };
  s.nightPalette = {
    bg: [18, 24, 38],
    ink: s.dayPalette.bg,
    dot: [84, 96, 118],
    mut: [150, 160, 180],
    div: [48, 58, 78],
    sub: rgb(v('--color-accent-300', '#e0c08a')),
  };
  s.shootingStars = [];
  s.nightIntensity = 0;
  s.accent = v('--color-accent', '#b68235');
  s.particleColors = [
    v('--color-accent', '#b68235'),
    v('--color-accent-300', '#e0c08a'),
    v('--color-neutral-300', '#ccc'),
    v('--color-accent-2-400', '#9a9'),
  ];
  s.waterColor = '#5b8fc7';
  s.rainColor = '#7aa6d6';
  s.headingFont = v('--font-heading', 'serif');
}
