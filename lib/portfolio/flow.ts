import { WORLD } from '../wanderer/config';

export type PortfolioZone = 'City' | 'Forest' | 'Bridge' | 'River';

export type PortfolioPresentation =
  'ambient' | 'story-card' | 'landmark' | 'finale';

export interface PortfolioWorldSlot {
  readonly id:
    | 'identity'
    | 'experience'
    | 'skills'
    | 'featured-project'
    | 'engineering-story'
    | 'project-two'
    | 'project-three'
    | 'education'
    | 'contact';
  readonly zone: PortfolioZone;
  readonly x: number;
  readonly presentation: PortfolioPresentation;
  readonly purpose: string;
  readonly required: boolean;
}

// Content slots follow the existing physical journey. They describe where real
// portfolio data belongs without embedding temporary biography or project copy.
export const PORTFOLIO_FLOW: readonly PortfolioWorldSlot[] = [
  {
    id: 'identity',
    zone: 'City',
    x: 700,
    presentation: 'ambient',
    purpose:
      'Name, full-stack role, one-year experience label, and short introduction.',
    required: true,
  },
  {
    id: 'experience',
    zone: 'City',
    x: 2500,
    presentation: 'landmark',
    purpose:
      'Company, role, dates, responsibilities, and measurable achievements.',
    required: true,
  },
  {
    id: 'skills',
    zone: 'Forest',
    x: 5100,
    presentation: 'story-card',
    purpose: 'Grouped frontend, backend, database, cloud, and tooling skills.',
    required: true,
  },
  {
    id: 'featured-project',
    zone: 'Bridge',
    x: 7550,
    presentation: 'landmark',
    purpose:
      'Strongest project, including problem, contribution, stack, and outcome.',
    required: true,
  },
  {
    id: 'engineering-story',
    zone: 'River',
    x: WORLD.wreckX,
    presentation: 'landmark',
    purpose:
      'A debugging, failure, performance, or learning story discovered at the wreck.',
    required: true,
  },
  {
    id: 'project-two',
    zone: 'River',
    x: 10420,
    presentation: 'story-card',
    purpose: 'Second project with live and source links when available.',
    required: false,
  },
  {
    id: 'project-three',
    zone: 'River',
    x: 10560,
    presentation: 'story-card',
    purpose: 'Optional third project or a compact open-source contribution.',
    required: false,
  },
  {
    id: 'education',
    zone: 'River',
    x: 10700,
    presentation: 'landmark',
    purpose: 'Education, certifications, teamwork, and community details.',
    required: true,
  },
  {
    id: 'contact',
    zone: 'River',
    x: 10840,
    presentation: 'finale',
    purpose:
      'Email, résumé, GitHub, LinkedIn, availability, and journey restart.',
    required: true,
  },
];

export function portfolioSlot(
  id: PortfolioWorldSlot['id'],
): PortfolioWorldSlot {
  const slot = PORTFOLIO_FLOW.find((entry) => entry.id === id);
  if (!slot) throw new Error(`Unknown portfolio slot: ${id}`);
  return slot;
}
