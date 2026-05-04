const JobService = require('../../src/services/job');

describe('JobService.normalizeJobData', () => {
  it('normalizes negotiable salary flags and vacancies when creating jobs', () => {
    const normalized = JobService.normalizeJobData({
      title: 'Backend Engineer',
      description: 'Build APIs',
      salary_min: '',
      salary_max: null,
      salary_negotiable: '0',
      vacancies: '3',
    });

    expect(normalized.salary_min).toBeNull();
    expect(normalized.salary_max).toBeNull();
    expect(normalized.salary_negotiable).toBe(0);
    expect(normalized.vacancies).toBe(3);
  });

  it('normalizes negotiable salary flags and vacancies when updating jobs', () => {
    const normalized = JobService.normalizeJobData(
      {
        salary_negotiable: 'true',
        salary_min: '20000000',
        salary_max: '35000000',
        vacancies: '0',
      },
      true
    );

    expect(normalized.salary_negotiable).toBe(1);
    expect(normalized.salary_min).toBe(20000000);
    expect(normalized.salary_max).toBe(35000000);
    expect(normalized.vacancies).toBe(1);
  });

  it('normalizes legacy dashed and remote job type values', () => {
    const created = JobService.normalizeJobData({
      title: 'Remote Frontend Engineer',
      description: 'Build web apps',
      type: 'full-time',
    });

    const updated = JobService.normalizeJobData({ job_type: 'remote' }, true);

    expect(created.job_type).toBe('full_time');
    expect(updated.job_type).toBe('remote');
  });

  it('keeps an explicit empty job_type on update instead of falling back to legacy type', () => {
    const updated = JobService.normalizeJobData({ job_type: '', type: 'full-time' }, true);

    expect(updated).toHaveProperty('job_type', '');
  });
});
