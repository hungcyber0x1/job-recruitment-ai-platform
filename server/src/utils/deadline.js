function normalizeYmdParts(deadline) {
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

function parseYmdLocal(deadline) {
  const parts = normalizeYmdParts(deadline);
  if (!parts) return null;
  return buildLocalDate(parts);
}

function startOfTodayLocal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isValidDeadlineDate(deadline) {
  return Boolean(parseYmdLocal(deadline));
}

/** Ngày deadline (DATE) trước ngày hôm nay (lịch) — không hợp lệ khi đăng published. */
function isDeadlineDateBeforeToday(deadline) {
  const day = parseYmdLocal(deadline);
  if (!day || Number.isNaN(day.getTime())) return false;
  return day < startOfTodayLocal();
}

/** Trả về 23:59:59 ngày deadline local, null nếu không parse được. */
function parseDeadlineEndOfDay(deadline) {
  const parts = normalizeYmdParts(deadline);
  if (!parts) return null;
  return buildLocalDate(parts, true);
}

/**
 * Hết hạn ứng tuyển — deadline đến ngày hôm nay sau 23:59:59.
 * Không có deadline => không chặn ứng tuyển.
 */
function isDeadlinePassed(deadline) {
  const end = parseDeadlineEndOfDay(deadline);
  if (!end) return false;
  return Date.now() > end.getTime();
}

module.exports = {
  isDeadlineDateBeforeToday,
  isDeadlinePassed,
  isValidDeadlineDate,
};
