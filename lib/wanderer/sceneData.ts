import { createPortfolioSceneContent } from '../portfolio/content';
import { portfolioProfile } from '../portfolio/profile';
import type { PortfolioProfile } from '../portfolio/types';
import type { Caption, SceneCard } from './types';
import { WORLD } from './config';

const DEFAULT_CAPTIONS: readonly Caption[] = [
  {
    x: 70,
    en: 'The city wakes before you do. One window is already lit.',
  },
  {
    x: 640,
    en: 'Sreerag P. Full stack developer.',
  },
  {
    x: 1250,
    en: 'The road starts here.',
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
    x: 9700,
    en: 'The shore waits where the river lets go.',
  },
];

const DEFAULT_CARDS: readonly SceneCard[] = [
  {
    x: 640,
    en: [
      'Hello · Full stack developer',
      'Hello, I am Sreerag',
      'I build the parts of an app you never see, and make sure they hold.',
      'Full stack developer in Indore, with a year of shipping real work: backends, admin panels and apps people use, including a learning app for children, live on Google Play and the App Store. I work in MERN, NestJS and TypeScript, from billing and permissions to deployment. Stack: MongoDB, Express, React, Node.js, NestJS, TypeScript.',
    ],
  },
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
