import { describe, it, expect } from 'vitest';
import { formatCurrency, formatSalaryRange, formatDate, formatTimeAgo } from './formatters.js';

describe('formatCurrency', () => {
  it('formats valid numbers', () => {
    expect(formatCurrency(15000000)).toContain('15');
    expect(formatCurrency(0)).toBeTruthy();
  });

  it('returns empty string for non-finite values', () => {
    expect(formatCurrency(NaN)).toBe('');
    expect(formatCurrency(undefined)).toBe('');
    expect(formatCurrency(null)).toBe('');
    expect(formatCurrency('abc')).toBe('');
  });
});

describe('formatSalaryRange', () => {
  it('returns empty when no positive bounds', () => {
    expect(formatSalaryRange(null, null)).toBe('');
    expect(formatSalaryRange(0, 0)).toBe('');
    expect(formatSalaryRange(-1, -1)).toBe('');
  });

  it('ignores non-positive min but keeps positive max', () => {
    expect(formatSalaryRange(-1, 5000000)).toContain('5');
  });

  it('formats min–max range', () => {
    const s = formatSalaryRange(1000000, 2000000);
    expect(s).toContain('–');
  });
});

describe('formatDate', () => {
  it('returns empty for invalid input', () => {
    expect(formatDate('')).toBe('');
    expect(formatDate(null)).toBe('');
    expect(formatDate('not-a-date')).toBe('');
  });

  it('formats ISO date', () => {
    expect(formatDate('2026-03-15T12:00:00.000Z')).toMatch(/2026/);
  });
});

describe('formatTimeAgo', () => {
  it('returns empty for invalid date', () => {
    expect(formatTimeAgo('invalid')).toBe('');
  });

  it('returns relative string for past date', () => {
    const past = new Date(Date.now() - 120000).toISOString();
    expect(formatTimeAgo(past)).toMatch(/phút|giờ|ngày|xong/);
  });
});
