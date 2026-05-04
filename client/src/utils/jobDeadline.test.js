import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  calendarDaysLeftUntilDeadline,
  getDeadlineEndOfDay,
  isJobApplicationDeadlinePassed,
} from './jobDeadline';

describe('jobDeadline utils', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps jobs open on the deadline date until local end of day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 1, 10, 0, 0));

    expect(calendarDaysLeftUntilDeadline('2026-05-01')).toBe(0);
    expect(isJobApplicationDeadlinePassed('2026-05-01')).toBe(false);
  });

  it('marks a deadline as passed only after its local end of day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 2, 0, 0, 0));

    expect(isJobApplicationDeadlinePassed('2026-05-01')).toBe(true);
  });

  it('rejects rolled-over calendar dates instead of normalizing them', () => {
    expect(getDeadlineEndOfDay('2026-02-31')).toBeNull();
    expect(calendarDaysLeftUntilDeadline('2026-02-31')).toBeNull();
    expect(isJobApplicationDeadlinePassed('2026-02-31')).toBe(false);
  });

  it('handles Date objects returned by API adapters or mocks', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 1, 10, 0, 0));

    expect(calendarDaysLeftUntilDeadline(new Date(2026, 4, 3))).toBe(2);
  });
});
