import type { Frame } from './frame';
import type { RenderState } from './state';
import { terrainHeight } from './terrain';
export interface OverlayElements {
  root: HTMLDivElement;
  card: HTMLDivElement | null;
  prompt: HTMLDivElement | null;
}
/** Sole owner of animated DOM styles. React owns content and accessibility. */
export function positionOverlays(
  s: RenderState,
  frame: Frame,
  elements: OverlayElements,
  cardIndex: number,
): void {
  const { w, h, cam, SY, col } = frame;
  const root = elements.root;
  for (const [key, value] of Object.entries({
    '--color-bg': col.bg,
    '--color-text': col.ink,
    '--color-neutral-500': col.mut,
    '--color-divider': col.div,
    '--sub': col.sub,
  }))
    root.style.setProperty(key, value);
  const clamp = (v: number, size: number) =>
    Math.max(16, Math.min(Math.max(16, size), v));
  const card = elements.card,
    data = s.cards[cardIndex];
  if (card && data) {
    card.style.transform = `translate(${clamp(data.x - cam + 80, w - card.offsetWidth - 16)}px, ${clamp(SY(data.y ?? terrainHeight(s.character.x, data.x)) - card.offsetHeight - 120, h - card.offsetHeight - 100)}px)`;
    card.style.opacity = String(s.cardOpacity);
  }
  const prompt = elements.prompt;
  if (prompt)
    prompt.style.transform = `translate(${clamp(s.vehicle.x - cam - prompt.offsetWidth / 2, w - prompt.offsetWidth - 16)}px, ${clamp(SY(terrainHeight(s.character.x, s.vehicle.x)) - 175, h - prompt.offsetHeight - 100)}px)`;
}
