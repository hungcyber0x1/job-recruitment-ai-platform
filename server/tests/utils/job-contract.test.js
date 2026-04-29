const {
  formatSalaryRange,
  normalizeSkills,
  toJobContract,
} = require('../../src/utils/job-contract');

describe('job-contract utils', () => {
  it('formats salary range from numeric min/max values', () => {
    expect(
      formatSalaryRange({
        salary_min: 15000000,
        salary_max: 30000000,
      })
    ).toBe('15–30 triệu VNĐ');
  });

  it('formats negotiable salary and preserves vacancies in the job contract', () => {
    const job = toJobContract({
      id: 16,
      title: 'Product Designer',
      company_id: 10,
      company_name: 'Design Co',
      salary_min: 20000000,
      salary_max: 30000000,
      salary_negotiable: '1',
      vacancies: 3,
    });

    expect(job.salary_range).toBe('Thỏa thuận');
    expect(job.salary_negotiable).toBe(true);
    expect(job.vacancies).toBe(3);
  });

  it('normalizes skill names from a grouped string payload', () => {
    expect(normalizeSkills('React||Node.js||SQL')).toEqual(['React', 'Node.js', 'SQL']);
  });

  it('returns canonical English titles for older Vietnamese-localized job names', () => {
    const job = toJobContract({
      id: 99,
      title: 'Lập trình viên toàn trình cao cấp (React + Node.js)',
      company_id: 9,
      company_name: 'Acme Labs',
      salary_negotiable: 1,
    });

    expect(job.title).toBe('Senior Full-stack Developer (React + Node.js)');
    expect(job.raw_title).toBe('Lập trình viên toàn trình cao cấp (React + Node.js)');
  });

  it('builds a client-friendly job contract from flat database fields', () => {
    const job = toJobContract({
      id: 15,
      title: 'Backend Engineer',
      employer_id: 9,
      company_id: 9,
      company_name: 'Acme Labs',
      company_logo: '/logo.png',
      company_website: 'https://acme.test',
      company_description: 'API platform',
      company_industry: 'Software',
      company_size: '51-200',
      company_location: 'Ho Chi Minh City',
      salary_min: 20000000,
      salary_max: 35000000,
      salary_display: '20 - 35 trieu VND',
      experience_required: '3 years',
      type: 'full-time',
      skill_names: 'Node.js||TypeScript||SQL',
    });

    expect(job.salary_range).toBe('20–35 triệu VNĐ');
    expect(job.experience).toBe('3 years');
    expect(job.employment_type).toBe('full-time');
    expect(job.skills).toEqual(['Node.js', 'TypeScript', 'SQL']);
    expect(job.company).toEqual({
      id: 9,
      name: 'Acme Labs',
      logo: '/logo.png',
      website: 'https://acme.test',
      description: 'API platform',
      industry: 'Software',
      size: '51-200',
      address: 'Ho Chi Minh City',
      location: 'Ho Chi Minh City',
    });
    expect(job.employer).toEqual(job.company);
  });

  it('falls back to database job_type when response has no legacy type field', () => {
    const job = toJobContract({
      id: 77,
      title: 'Remote QA Engineer',
      company_id: 12,
      company_name: 'Remote Co',
      job_type: 'remote',
    });

    expect(job.employment_type).toBe('remote');
  });
});
