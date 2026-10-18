import { describe, expect, it } from 'vitest';
import { WORLD } from '../lib/wanderer/config';
import {
  PORTFOLIO_FLOW,
  portfolioSlot,
  type PortfolioZone,
} from '../lib/portfolio/flow';

describe('portfolio world flow', () => {
  it('uses unique slots in journey order', () => {
    expect(new Set(PORTFOLIO_FLOW.map(({ id }) => id)).size).toBe(
      PORTFOLIO_FLOW.length,
    );
    expect(PORTFOLIO_FLOW.map(({ x }) => x)).toEqual(
      [...PORTFOLIO_FLOW.map(({ x }) => x)].sort((a, b) => a - b),
    );
  });

  it('covers every existing world zone', () => {
    const zones: readonly PortfolioZone[] = [
      'City',
      'Forest',
      'Bridge',
      'River',
      'Shore',
      'Village',
      'Island',
    ];
    expect(new Set(PORTFOLIO_FLOW.map(({ zone }) => zone))).toEqual(
      new Set(zones),
    );
  });

  it('keeps all discoveries inside the playable world', () => {
    for (const slot of PORTFOLIO_FLOW) {
      expect(slot.x).toBeGreaterThanOrEqual(WORLD.minX);
      expect(slot.x).toBeLessThanOrEqual(WORLD.maxX);
    }
    expect(portfolioSlot('engineering-story').x).toBe(WORLD.wreckX);
  });
});
