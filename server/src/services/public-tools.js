function hashStr(s) {
  let h = 0;
  const str = String(s || '');
  for (let i = 0; i < str.length; i += 1) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h);
}

const BASE_BY_EXP = {
  fresher: 10_000_000,
  junior: 16_000_000,
  mid: 24_000_000,
  senior: 34_000_000,
  expert: 46_000_000,
};

const LOC_MULT = { hcm: 1.1, hn: 1.06, dn: 0.93, other: 1, remote: 1.14 };
const IND_MULT = { it: 1.22, marketing: 0.95, accounting: 0.9, sales: 1.05, design: 0.98 };

function computeSalaryEstimate({ title, experience, location, industry }) {
  const t = (title || '').trim();
  const base = BASE_BY_EXP[experience] ?? BASE_BY_EXP.mid;
  const lm = LOC_MULT[location] ?? 1;
  const im = IND_MULT[industry] ?? 1;
  const jitter = 1 + (hashStr(t || 'x') % 19) / 100;
  const titleBoost = t.length > 28 ? 1.04 : t.length > 12 ? 1 : 0.97;
  const mid = base * lm * im * jitter * titleBoost;
  const growthPct = 7 + (hashStr(`${t}|${experience}|${location}`) % 12);
  return {
    mid,
    low: mid * 0.72,
    high: mid * 1.38,
    growthPct,
    currency: 'VND',
    disclaimer:
      'Ước lượng tham khảo trên HireBOT cho ứng viên (đàm phán offer, định hướng ứng tuyển). Không thay thế khảo sát lương thực tế tại doanh nghiệp.',
  };
}

module.exports = {
  computeSalaryEstimate,
};
