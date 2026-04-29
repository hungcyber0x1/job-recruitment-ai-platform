/**
 * Job-company contract utilities shared by API responses.
 */

const { localizeJobTitle } = require('./job-title-localization');

function normalizeSalaryText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'D')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function formatCurrencyAmount(value) {
  if (value == null || value === '') {
    return '';
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return '';
  }

  if (numericValue >= 1000000) {
    return `${formatMillionValue(numericValue)} triệu VNĐ`;
  }

  return `${numericValue.toLocaleString('vi-VN')} VNĐ`;
}

function isTruthyFlag(value) {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value == null) return false;
  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
  }
  return false;
}

function isNegotiableSalaryText(value) {
  const normalized = normalizeSalaryText(value);
  return normalized.includes('thoa thuan') || normalized.includes('negotiable');
}

function hasAllowanceText(value) {
  const normalized = normalizeSalaryText(value);
  return normalized.includes('allowance') || normalized.includes('phu cap');
}

function formatMillionValue(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return '';
  }

  const millions = Math.round((numericValue / 1000000) * 10) / 10;
  return millions.toLocaleString('vi-VN', {
    minimumFractionDigits: Number.isInteger(millions) ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

function formatNumericSalaryRange(min, max) {
  if (min != null && max != null) {
    if (Number(min) >= 1000000 && Number(max) >= 1000000) {
      return `${formatMillionValue(min)}–${formatMillionValue(max)} triệu VNĐ`;
    }

    return `${formatCurrencyAmount(min)}–${formatCurrencyAmount(max)}`;
  }

  if (min != null) {
    return `Từ ${formatCurrencyAmount(min)}`;
  }

  if (max != null) {
    return `Đến ${formatCurrencyAmount(max)}`;
  }

  return '';
}

function formatSalaryRange(job = {}) {
  if (isTruthyFlag(job.salary_negotiable)) {
    return 'Thỏa thuận';
  }

  const rawDisplay = String(job.salary_display || job.salary_range || '').trim();
  const numericRange = formatNumericSalaryRange(job.salary_min, job.salary_max);

  if (rawDisplay) {
    if (isNegotiableSalaryText(rawDisplay)) {
      return 'Thỏa thuận';
    }

    if (numericRange) {
      return hasAllowanceText(rawDisplay) ? `${numericRange} + phụ cấp` : numericRange;
    }

    return rawDisplay;
  }

  return numericRange || 'Thỏa thuận';
}

function normalizeSkills(rawSkills) {
  if (Array.isArray(rawSkills)) {
    return rawSkills.map((skill) => String(skill).trim()).filter(Boolean);
  }

  if (typeof rawSkills !== 'string') {
    return [];
  }

  const trimmed = rawSkills.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((skill) => String(skill).trim()).filter(Boolean);
    }
  } catch {
    // fall through
  }

  const delimiter = trimmed.includes('||') ? '||' : ',';
  return trimmed
    .split(delimiter)
    .map((skill) => String(skill).trim())
    .filter(Boolean);
}

function buildCompanySummary(job = {}) {
  const companyId = job.company_id ?? job.employer_id ?? null;
  const location = job.company_location ?? job.location ?? '';

  return {
    id: companyId,
    name: job.company_name ?? '',
    logo: job.company_logo ?? '',
    website: job.company_website ?? '',
    description: job.company_description ?? '',
    industry: job.company_industry ?? job.industry ?? '',
    size: job.company_size ?? '',
    address: location,
    location,
  };
}

function toJobContract(job = {}) {
  const company = buildCompanySummary(job);
  const salaryRange = formatSalaryRange(job);
  const skills = normalizeSkills(job.skill_names ?? job.skills);
  const employmentType = job.employment_type ?? job.type ?? job.job_type ?? '';
  const localizedTitle = localizeJobTitle(job.title);

  return {
    ...job,
    title: localizedTitle,
    raw_title: job.title,
    company_id: company.id,
    company_name: company.name,
    company_logo: company.logo,
    company_website: company.website,
    company_description: company.description,
    company_location: company.location,
    company_industry: company.industry,
    company_size: company.size,
    salary_range: salaryRange,
    skills,
    experience: job.experience ?? job.experience_required ?? '',
    employment_type: employmentType,
    company,
    employer: company,
    address: job.address ?? null,
    deadline: job.deadline ?? job.expires_at ?? null,
    vacancies: job.vacancies ?? null,
    salary_negotiable: isTruthyFlag(job.salary_negotiable),
  };
}

function toJobContracts(jobs = []) {
  return jobs.map((job) => toJobContract(job));
}

module.exports = {
  buildCompanySummary,
  formatSalaryRange,
  normalizeSkills,
  toJobContract,
  toJobContracts,
};
