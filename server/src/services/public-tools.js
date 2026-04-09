const AIService = require('./ai');
const logger = require('../utils/logger');

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
      'Ước lượng tham khảo trên HireAI cho ứng viên (đàm phán offer, định hướng ứng tuyển). Không thay thế khảo sát lương thực tế tại doanh nghiệp.',
  };
}

async function generateInterviewHint({ question, role, level }) {
  const q = String(question || '').trim();
  if (!q) {
    throw new Error('Thiếu nội dung câu hỏi');
  }
  const prompt = `Bạn là huấn luyện viên phỏng vấn tuyển dụng trên nền tảng tuyển dụng HireAI (ứng viên đang chuẩn bị ứng tuyển / phỏng vấn vòng doanh nghiệp tại Việt Nam).

Câu hỏi phỏng vấn: "${q}"
Lĩnh vực / vai trò ứng viên: ${String(role || 'tổng quát')}.
Mức kinh nghiệm: ${String(level || 'mid')}.

Nhiệm vụ: đưa gợi ý thực tế, súc tích, giúp ứng viên trả lời tự tin và gắn với JD / kinh nghiệm. Tránh văn mẫu rỗng.

Trả về CHỈ JSON hợp lệ (không markdown):
{
  "hints": ["gợi ý ngắn 1", "gợi ý ngắn 2", "gợi ý ngắn 3"],
  "framework": "1-2 câu: khung trả lời (STAR hoặc luận điểm rõ ràng)"
}`;

  try {
    const response = await AIService.generateContent(prompt);
    const cleaned = AIService.cleanJsonResponse(response);
    const data = JSON.parse(cleaned);
    return {
      hints: Array.isArray(data.hints) ? data.hints.slice(0, 5) : [],
      framework: typeof data.framework === 'string' ? data.framework : '',
    };
  } catch (e) {
    logger.error('public interview hint AI error:', e);
    throw new Error('INTERVIEW_HINT_FAILED');
  }
}

module.exports = {
  computeSalaryEstimate,
  generateInterviewHint,
};
