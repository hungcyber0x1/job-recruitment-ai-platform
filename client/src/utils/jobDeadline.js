/**
 * Hạn ứng tuyển (DB kiểu DATE) — tính theo ngày lịch, hết hạn sau 23:59:59 local.
 */

function parseYmdParts(deadline) {
  if (deadline == null || deadline === '') return null;
  const s = String(deadline).slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, mo, d };
}

/** Cuối ngày (local) của mốc DATE; null nếu không parse được. */
export function getDeadlineEndOfDay(deadline) {
  const parts = parseYmdParts(deadline);
  if (!parts) return null;
  return new Date(parts.y, parts.mo - 1, parts.d, 23, 59, 59, 999);
}

/** Đã quá hạn ứng tuyển (sau hết ngày deadline). Không deadline => không chặn. */
export function isJobApplicationDeadlinePassed(deadline) {
  const end = getDeadlineEndOfDay(deadline);
  if (!end) return false;
  return Date.now() > end.getTime();
}

/**
 * Số ngày lịch còn lại đến hết ngày deadline (0 nếu cùng ngày nhưng chưa quá giờ cuối ngày).
 * null nếu không có deadline.
 */
export function calendarDaysLeftUntilDeadline(deadline) {
  const end = getDeadlineEndOfDay(deadline);
  if (!end) return null;
  const diff = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}
