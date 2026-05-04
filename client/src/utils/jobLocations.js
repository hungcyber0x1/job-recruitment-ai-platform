export const JOB_LOCATION_OPTIONS = [
  { value: 'all', label: 'Toàn quốc' },
  { value: 'Ha Noi', label: 'Hà Nội' },
  { value: 'Ho Chi Minh', label: 'TP. Hồ Chí Minh' },
  { value: 'Da Nang', label: 'Đà Nẵng' },
  { value: 'Can Tho', label: 'Cần Thơ' },
  { value: 'Remote', label: 'Làm việc từ xa' },
];

export const getJobLocationOption = (value = '') =>
  JOB_LOCATION_OPTIONS.find(
    (option) => option.value.toLowerCase() === String(value).trim().toLowerCase()
  );

export const getJobLocationDisplayLabel = (value = '') => {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) return '';
  return getJobLocationOption(normalizedValue)?.label || normalizedValue;
};

export const resolveJobLocationValue = (value = '') => {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) return '';

  const normalizedQuery = normalizedValue.toLowerCase();
  const matchedOption = JOB_LOCATION_OPTIONS.find(
    (option) =>
      option.label.toLowerCase() === normalizedQuery ||
      option.value.toLowerCase() === normalizedQuery
  );

  return matchedOption
    ? matchedOption.value === 'all'
      ? ''
      : matchedOption.value
    : normalizedValue;
};

export const filterJobLocationOptions = (query = '') => {
  const normalizedQuery = String(query || '')
    .trim()
    .toLowerCase();
  if (!normalizedQuery) return JOB_LOCATION_OPTIONS;

  return JOB_LOCATION_OPTIONS.filter(
    (option) =>
      option.label.toLowerCase().includes(normalizedQuery) ||
      option.value.toLowerCase().includes(normalizedQuery)
  );
};
