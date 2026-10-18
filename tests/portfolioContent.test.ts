import { describe, expect, it } from 'vitest';
import { createPortfolioSceneContent } from '../lib/portfolio/content';
import { portfolioSlot } from '../lib/portfolio/flow';
import type { PortfolioProfile } from '../lib/portfolio/types';
import { createSceneData } from '../lib/wanderer/sceneData';

const profile: PortfolioProfile = {
  identity: {
    name: 'Dev Example',
    role: 'Full-stack Developer',
    experienceLabel: 'One year of experience',
    introduction: 'I build useful web products.',
    about: 'A test profile used only to verify portfolio content mapping.',
  },
  experience: [
    {
      company: 'Example Studio',
      role: 'Software Developer',
      startDate: '2025',
      summary: 'Built and maintained customer-facing applications.',
      achievements: ['Improved a critical workflow.'],
      technologies: ['TypeScript', 'Node.js'],
    },
  ],
  skills: [{ label: 'Frontend', skills: ['React', 'TypeScript'] }],
  projects: [
    {
      id: 'secondary',
      name: 'Second Project',
      summary: 'A supporting project.',
      problem: 'A manual process.',
      contribution: 'Designed and built the application.',
      outcome: 'Reduced repetitive work.',
      technologies: ['Next.js'],
      links: [],
    },
    {
      id: 'featured',
      name: 'Featured Project',
      summary: 'The strongest project.',
      problem: 'An important user problem.',
      contribution: 'Owned the full-stack implementation.',
      outcome: 'Delivered a reliable workflow.',
      technologies: ['React', 'Node.js'],
      links: [
        {
          label: 'View source',
          href: 'https://example.com/source',
          kind: 'source',
        },
      ],
      featured: true,
    },
  ],
  engineeringStory: {
    title: 'Finding the bottleneck',
    challenge: 'A request became slow under load.',
    response: 'Profiled the request and removed repeated database work.',
    outcome: 'Made response time predictable.',
    technologies: ['Node.js', 'PostgreSQL'],
  },
  education: [
    {
      qualification: 'Computer Science',
      institution: 'Example College',
    },
  ],
  certifications: [],
  contact: {
    message: 'Available for full-stack opportunities.',
    email: 'dev@example.com',
    links: [
      { label: 'Email me', href: 'mailto:dev@example.com', kind: 'email' },
    ],
  },
};

describe('portfolio scene content', () => {
  it('maps identity to an ambient world caption', () => {
    const content = createPortfolioSceneContent(profile);
    expect(content.captions).toEqual([
      {
        x: portfolioSlot('identity').x,
        en: 'Dev Example — Full-stack Developer',
      },
    ]);
  });

  it('places the featured project at the bridge and preserves its links', () => {
    const content = createPortfolioSceneContent(profile);
    const card = content.cards.find(
      ({ x }) => x === portfolioSlot('featured-project').x,
    );
    expect(card?.en[1]).toBe('Featured Project');
    expect(card?.links).toEqual([
      { label: 'View source', href: 'https://example.com/source' },
    ]);
  });

  it('keeps optional projects optional and cards in journey order', () => {
    const content = createPortfolioSceneContent(profile);
    expect(
      content.cards.some(({ x }) => x === portfolioSlot('project-two').x),
    ).toBe(true);
    expect(
      content.cards.some(({ x }) => x === portfolioSlot('project-three').x),
    ).toBe(false);
    expect(content.cards.map(({ x }) => x)).toEqual(
      [...content.cards.map(({ x }) => x)].sort((a, b) => a - b),
    );
  });

  it('feeds a supplied profile into the live scene data boundary', () => {
    const content = createSceneData(profile);
    expect(content.captions[0]?.en).toContain('Dev Example');
    expect(content.cards.some(({ en }) => en[1] === 'Featured Project')).toBe(
      true,
    );
  });

  it('retains the original story while no profile is configured', () => {
    const content = createSceneData(null);
    expect(content.cards.length).toBeGreaterThan(0);
    expect(content.cards.some(({ en }) => en[1] === 'Featured Project')).toBe(
      false,
    );
  });
});
