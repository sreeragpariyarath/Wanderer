import { createPortfolioSceneContent } from '../portfolio/content';
import { portfolioProfile } from '../portfolio/profile';
import type { PortfolioProfile } from '../portfolio/types';
import type { Caption, SceneCard } from './types';
import { WORLD } from './config';

const DEFAULT_CAPTIONS: readonly Caption[] = [
  {
    x: 480,
    en: 'The city wakes before you do.',
  },
  {
    x: 3700,
    en: 'Seeds drift upward, as if remembering the sky.',
  },
  {
    x: 8280,
    en: 'The bridge ends before the river does.',
  },
  {
    x: 10000,
    en: 'Beyond the old boat, the river gives way to shore.',
  },
  {
    x: 11550,
    en: 'Up, and the light comes back.',
  },
  {
    x: 15700,
    en: 'The horizon keeps its promise by moving.',
  },
];

const DEFAULT_CARDS: readonly SceneCard[] = [
  {
    x: 5100,
    en: [
      'Field notes / Outdoors',
      'Moss & Line',
      'Rivers, trails and slow mornings, from direct experience.',
      'A notebook of small expeditions: where the fish were, what the weather did, and which paths were worth walking twice.',
    ],
  },
  {
    x: 7550,
    en: [
      'Journal / Crossings',
      'Halfway',
      'Essays written between one place and the next.',
      'Short pieces drafted on trains, ferries and footbridges — about leaving, arriving, and the long middle part.',
    ],
  },
  {
    x: WORLD.wreckX,
    y: 220,
    revealRadius: 180,
    en: [
      'River archive / Discovery',
      'The Quiet Wreck',
      'A broken wooden boat, resting among the river plants.',
      'The hull is split and its mast has fallen, but the river has made a home of it. Small fish shelter between the ribs, and new plants grow through the planks. Pause here, then follow the current toward the shore.',
    ],
  },
  {
    x: 10600,
    en: [
      'Web / Tools / Automation',
      'Lantern',
      'Small tools for lighting up repetitive work.',
      'Experiments and working notes on web development, automation and the quiet tools that make everyday work lighter.',
    ],
  },
  {
    x: 11100,
    en: [
      'Sound / Experiments',
      'Undertow',
      'Field recordings and generative sound.',
      'Rain on tin roofs, harbour bells and patterns that play themselves — collected, layered and left running.',
    ],
  },
  {
    x: 13000,
    en: [
      'Travel / Food / Daily records',
      'Kitchen Atlas',
      'Towns and meals, written down as they happened.',
      'A running record of places eaten in and streets walked through, kept honestly and without stars.',
    ],
  },
  {
    x: 14800,
    en: [
      'Games / Long-running world',
      'Blockhouse',
      'A slow build in a world made of cubes.',
      'One world, played for years: a house, then a village, then a railway to nowhere in particular.',
    ],
  },
];

export interface SceneData {
  readonly captions: readonly Caption[];
  readonly cards: readonly SceneCard[];
}

export function createSceneData(profile: PortfolioProfile | null): SceneData {
  if (profile) return createPortfolioSceneContent(profile);
  return { captions: DEFAULT_CAPTIONS, cards: DEFAULT_CARDS };
}

const sceneData = createSceneData(portfolioProfile);

export const CAPTIONS = sceneData.captions;
export const CARDS = sceneData.cards;
