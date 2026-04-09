function parseYmdLocal(deadline) {
  if (deadline == null || deadline === '') return null;
  const s = String(deadline).slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return new Date(y, mo - 1, d);
}

function startOfTodayLocal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Ngày deadline (DATE) trước ngày hôm nay (lịch) — không hợp lệ khi đăng published. */
function isDeadlineDateBeforeToday(deadline) {
  const day = parseYmdLocal(deadline);
  if (!day || Number.isNaN(day.getTime())) return false;
  return day < startOfTodayLocal();
}

module.exports = {
  isDeadlineDateBeforeToday,
};
