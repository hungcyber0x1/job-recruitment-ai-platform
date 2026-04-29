import { describe, expect, it } from 'vitest';

import { getJobSalaryCardLabel, hasConcreteJobSalary, isNegotiableSalaryText } from './jobSalary';

describe('jobSalary utils', () => {
  it('returns Thỏa thuận for negotiable salary jobs on cards', () => {
    expect(
      getJobSalaryCardLabel({
        salary_negotiable: true,
        salary_min: 25000000,
        salary_max: 45000000,
      })
    ).toBe('Thỏa thuận');
  });

  it('returns Thỏa thuận when API display text is negotiable salary', () => {
    expect(
      getJobSalaryCardLabel({
        salary_display: 'Thoa thuan',
      })
    ).toBe('Thỏa thuận');
  });

  it('formats shared numeric ranges in compact Vietnamese form', () => {
    expect(
      getJobSalaryCardLabel({
        salary_min: 25000000,
        salary_max: 45000000,
        salary_display: '25 - 45 trieu VND',
      })
    ).toBe('25–45 triệu VNĐ');
  });

  it('does not treat negotiable salary as a concrete amount', () => {
    expect(
      hasConcreteJobSalary({
        salary_display: 'Negotiable',
      })
    ).toBe(false);
  });

  it('recognizes both Vietnamese and English negotiable salary text', () => {
    expect(isNegotiableSalaryText('Thoa thuan')).toBe(true);
    expect(isNegotiableSalaryText('Negotiable')).toBe(true);
  });
});
