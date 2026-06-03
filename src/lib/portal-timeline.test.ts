import { describe, expect, it } from 'vitest';
import { getDefaultTimelineEndIso, getTimelineProgressPercent } from './portal-timeline-data';

describe('getDefaultTimelineEndIso', () => {
  it('adds one calendar month', () => {
    expect(getDefaultTimelineEndIso('2026-01-15T12:00:00.000Z')).toBe(
      new Date('2026-02-15T12:00:00.000Z').toISOString()
    );
  });
});

describe('getTimelineProgressPercent', () => {
  const start = '2026-01-01T00:00:00.000Z';
  const end = '2026-07-01T00:00:00.000Z';

  it('returns 0 at start', () => {
    expect(getTimelineProgressPercent(start, end, new Date(start).getTime())).toBe(0);
  });

  it('returns 100 at or after end', () => {
    expect(getTimelineProgressPercent(start, end, new Date(end).getTime())).toBe(100);
  });

  it('returns 50 at midpoint', () => {
    const mid = new Date('2026-04-01T00:00:00.000Z').getTime();
    expect(getTimelineProgressPercent(start, end, mid)).toBe(50);
  });

  it('uses a one-month default window when end is one month after start', () => {
    const defaultEnd = getDefaultTimelineEndIso(start);
    const mid = new Date('2026-01-16T00:00:00.000Z').getTime();
    expect(getTimelineProgressPercent(start, defaultEnd, mid)).toBeGreaterThan(45);
    expect(getTimelineProgressPercent(start, defaultEnd, mid)).toBeLessThan(55);
  });
});
