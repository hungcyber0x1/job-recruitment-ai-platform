const {
  isDeadlineDateBeforeToday,
  isDeadlinePassed,
  isValidDeadlineDate,
} = require('../../src/utils/deadline');

describe('deadline utils', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('treats the current calendar day as still open until end of day', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 4, 1, 10, 0, 0));

    expect(isValidDeadlineDate('2026-05-01')).toBe(true);
    expect(isDeadlineDateBeforeToday('2026-05-01')).toBe(false);
    expect(isDeadlinePassed('2026-05-01')).toBe(false);
  });

  it('rejects rolled-over calendar dates instead of normalizing them', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 1, 1, 10, 0, 0));

    expect(isValidDeadlineDate('2026-02-31')).toBe(false);
    expect(isDeadlineDateBeforeToday('2026-02-31')).toBe(false);
    expect(isDeadlinePassed('2026-02-31')).toBe(false);
  });

  it('handles Date objects returned by database drivers', () => {
    const deadline = new Date(2026, 4, 1);

    jest.useFakeTimers().setSystemTime(new Date(2026, 4, 1, 23, 0, 0));
    expect(isDeadlinePassed(deadline)).toBe(false);

    jest.setSystemTime(new Date(2026, 4, 2, 0, 0, 0));
    expect(isDeadlinePassed(deadline)).toBe(true);
  });
});
