/**
 * Hạn ứng tuyển (DB kiểu DATE) — tính theo ngày lịch, hết hạn sau 23:59:59 local.
 */

function parseYmdParts(deadline) {
  if (deadline == null || deadline === '') return null;

  if (deadline instanceof Date) {
    if (Number.isNaN(deadline.getTime())) return null;
    return {
      y: deadline.getFullYear(),
      mo: deadline.getMonth() + 1,
      d: deadline.getDate(),
    };
  }

  const s = String(deadline).slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, mo, d };
}

function buildLocalDate({ y, mo, d }, endOfDay = false) {
  const date = endOfDay ? new Date(y, mo - 1, d, 23, 59, 59, 999) : new Date(y, mo - 1, d);

  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) {
    return null;
  }

  return date;
}

function calendarDayDiffFromToday({ y, mo, d }) {
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const deadlineUtc = Date.UTC(y, mo - 1, d);
  return Math.max(0, Math.round((deadlineUtc - todayUtc) / 86400000));
}

/** Cuối ngày (local) của mốc DATE; null nếu không parse được. */
export function getDeadlineEndOfDay(deadline) {
  const parts = parseYmdParts(deadline);
  if (!parts) return null;
  return buildLocalDate(parts, true);
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
  const parts = parseYmdParts(deadline);
  if (!parts || !buildLocalDate(parts)) return null;
  return calendarDayDiffFromToday(parts);
}
