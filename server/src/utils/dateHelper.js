/**
 * Tiện ích ngày giờ không thêm dependency (thay cho moment cũ).
 */

function toValidDate(input) {
  if (input == null || input === '') return null;
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }
  const s = String(input).trim();
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    const y = Number(ymd[1]);
    const m = Number(ymd[2]) - 1;
    const d = Number(ymd[3]);
    return new Date(y, m, d);
  }
  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

exports.formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  const d = toValidDate(date);
  if (!d) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const Y = d.getFullYear();
  const M = pad(d.getMonth() + 1);
  const D = pad(d.getDate());
  const h = pad(d.getHours());
  const m = pad(d.getMinutes());
  const sec = pad(d.getSeconds());
  if (format === 'YYYY-MM-DD HH:mm:ss') {
    return `${Y}-${M}-${D} ${h}:${m}:${sec}`;
  }
  return `${Y}-${M}-${D} ${h}:${m}:${sec}`;
};

exports.getDaysRemaining = (deadline) => {
  const end = toValidDate(deadline);
  if (!end) return NaN;
  const now = new Date();
  return Math.floor((end.getTime() - now.getTime()) / 86400000);
};

exports.isExpired = (deadline) => {
  const end = toValidDate(deadline);
  if (!end) return false;
  return Date.now() > end.getTime();
};

/** Hết hạn ứng tuyển sau 23:59:59 của ngày deadline (DATE). Không deadline => không hết hạn. */
exports.isApplicationDeadlinePassed = (deadline) => {
  if (!deadline) return false;
  const day = toValidDate(deadline);
  if (!day) return false;
  const endOfDay = new Date(day);
  endOfDay.setHours(23, 59, 59, 999);
  return Date.now() > endOfDay.getTime();
};
