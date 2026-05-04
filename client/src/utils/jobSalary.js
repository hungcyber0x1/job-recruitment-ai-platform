export const isTruthyFlag = (value) =>
  value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'D')
    .toLowerCase()
    .trim();

export const isNegotiableSalaryText = (value) => {
  const normalized = normalizeText(value);
  return normalized.includes('thoa thuan') || normalized.includes('negotiable');
};

const hasAllowanceText = (value) => {
  const normalized = normalizeText(value);
  return normalized.includes('allowance') || normalized.includes('phu cap');
};

const formatMillionValue = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return '';

  const millions = Math.round((numericValue / 1000000) * 10) / 10;
  return millions.toLocaleString('vi-VN', {
    minimumFractionDigits: Number.isInteger(millions) ? 0 : 1,
    maximumFractionDigits: 1,
  });
};

const formatSalaryAmount = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return '';

  if (numericValue >= 1000000) {
    return `${formatMillionValue(numericValue)} triệu VNĐ`;
  }

  return `${numericValue.toLocaleString('vi-VN')} VNĐ`;
};

const formatNumericSalaryLabel = (salaryMin, salaryMax) => {
  const hasMin = Number.isFinite(salaryMin) && salaryMin > 0;
  const hasMax = Number.isFinite(salaryMax) && salaryMax > 0;

  if (hasMin && hasMax) {
    if (salaryMin >= 1000000 && salaryMax >= 1000000) {
      return `${formatMillionValue(salaryMin)}–${formatMillionValue(salaryMax)} triệu VNĐ`;
    }

    return `${formatSalaryAmount(salaryMin)}–${formatSalaryAmount(salaryMax)}`;
  }
  if (hasMin) {
    return `Từ ${formatSalaryAmount(salaryMin)}`;
  }
  if (hasMax) {
    return `Đến ${formatSalaryAmount(salaryMax)}`;
  }

  return '';
};

export const hasConcreteJobSalary = (job = {}) => {
  if (isTruthyFlag(job.salary_negotiable)) return false;

  const rawDisplay = String(job.salary_display || job.salary_range || job.salary || '').trim();
  if (rawDisplay) return !isNegotiableSalaryText(rawDisplay);

  const salaryMin = Number(job.salary_min);
  const salaryMax = Number(job.salary_max);
  return (
    (Number.isFinite(salaryMin) && salaryMin > 0) || (Number.isFinite(salaryMax) && salaryMax > 0)
  );
};

export const getJobSalaryCardLabel = (job = {}, fallbackLabel = 'Thỏa thuận') => {
  if (isTruthyFlag(job.salary_negotiable)) return fallbackLabel;

  const rawDisplay = String(job.salary_display || job.salary_range || job.salary || '').trim();
  const salaryMin = Number(job.salary_min);
  const salaryMax = Number(job.salary_max);
  const numericLabel = formatNumericSalaryLabel(salaryMin, salaryMax);

  if (rawDisplay) {
    if (isNegotiableSalaryText(rawDisplay)) {
      return fallbackLabel;
    }

    if (numericLabel) {
      return hasAllowanceText(rawDisplay) ? `${numericLabel} + phụ cấp` : numericLabel;
    }

    return rawDisplay;
  }

  return numericLabel || fallbackLabel;
};
