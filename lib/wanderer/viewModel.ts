import type { Movement } from './character';
import type { SceneState } from './state';
import { canEnterVehicle } from './vehicle';
export interface ViewModel {
  sound: boolean;
  direction: -1 | 0 | 1;
  run: boolean;
  ready: boolean;
  introProgress: number;
  cardIndex: number;
  cardVisible: boolean;
  expanded: boolean;
  carPrompt: 'enter' | 'drive' | 'exit' | null;
  action: 'enter' | 'exit' | 'card' | null;
  error: boolean;
}
export const INITIAL_VIEW: ViewModel = {
  sound: false,
  direction: 0,
  run: false,
  ready: false,
  introProgress: 0,
  cardIndex: -1,
  cardVisible: false,
  expanded: false,
  carPrompt: null,
  action: null,
  error: false,
};
export function deriveView(
  s: SceneState,
  previous: ViewModel,
  input: Movement,
): ViewModel {
  let cardIndex = -1,
    distance = 900;
  if (s.introDone)
    s.cards.forEach((card, i) => {
      const d = Math.abs(s.character.x - card.x);
      if (d < distance) {
        cardIndex = i;
        distance = d;
      }
    });
  s.cardOpacity =
    cardIndex < 0 ? 0 : Math.max(0, Math.min(1, 1.4 - distance / 500));
  const cardVisible = s.cardOpacity > 0.5;
  const carPrompt = !s.introDone
    ? null
    : s.vehicle.in
      ? Math.abs(s.vehicle.v) < 80
        ? 'exit'
        : 'drive'
      : canEnterVehicle(s.vehicle, s.character)
        ? 'enter'
        : null;
  return {
    ...previous,
    direction: input.direction,
    run: input.run,
    ready: s.introDone,
    introProgress: Math.round(s.introProgress * 100),
    cardIndex,
    cardVisible,
    expanded:
      cardVisible && cardIndex === previous.cardIndex
        ? previous.expanded
        : false,
    carPrompt,
    action: s.vehicle.in
      ? 'exit'
      : carPrompt === 'enter'
        ? 'enter'
        : cardVisible
          ? 'card'
          : null,
  };
}
