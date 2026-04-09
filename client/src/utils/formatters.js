/**
 * Format amount to Vietnamese currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (amount == null || amount === '') {
    return '';
  }
  const n = Number(amount);
  if (!Number.isFinite(n)) {
    return '';
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(n);
};

/**
 * Khoảng lương min–max (VNĐ). Trả về chuỗi rỗng nếu không có số hợp lệ → UI có thể hiển thị "Thương lượng".
 * @param {number|null|undefined} min
 * @param {number|null|undefined} max
 * @returns {string}
 */
export const formatSalaryRange = (min, max) => {
  const nMin = min != null ? Number(min) : NaN;
  const nMax = max != null ? Number(max) : NaN;
  const hasMin = Number.isFinite(nMin) && nMin > 0;
  const hasMax = Number.isFinite(nMax) && nMax > 0;
  if (!hasMin && !hasMax) {
    return '';
  }
  if (hasMin && hasMax) {
    return `${formatCurrency(nMin)} – ${formatCurrency(nMax)}`;
  }
  if (hasMin) {
    return `Từ ${formatCurrency(nMin)}`;
  }
  return `Lên đến ${formatCurrency(nMax)}`;
};

/**
 * Format date to Vietnamese locale
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
};

/**
 * Format date to relative time (e.g., "2 phút trước")
 * @param {string|Date} dateString - Date to format
 * @returns {string} Relative time string
 */
export const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
export const truncate = (text, length) => {
  if (!text || text.length <= length) return text;
  return text.substring(0, length) + '…';
};

/**
 * Extract initials from a full name
 * @param {string} name - Full name
 * @returns {string} Initials (max 2 characters)
 */
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Generate avatar URL from name
 * @param {string} name - Name for avatar
 * @returns {string} Avatar URL
 */
export const getAvatarUrl = (name) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
};
