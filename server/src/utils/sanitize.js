/**
 * Làm sạch dữ liệu người dùng trước khi đưa vào prompt AI (giảm prompt injection).
 */

const MAX_FIELD_LENGTH = 2000;

/**
 * Loại ký tự có thể phá ngữ cảnh JSON hoặc chèn chỉ thị mới;
 * bỏ ký tự điều khiển và cắt độ dài.
 * @param {string|any} value
 * @param {number} maxLength — mặc định 2000
 * @returns {string}
 */
function sanitizeForPrompt(value, maxLength = MAX_FIELD_LENGTH) {
  if (value === null || value === undefined) return '';
  const str = String(value);

  const cleaned = str
    // Bỏ ký tự điều khiển (byte null, ASCII 0–31 trừ tab và xuống dòng)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    // Thoát backtick để tránh chèn fence ```
    .replace(/`/g, "'")
    // Giới hạn độ dài
    .substring(0, maxLength);

  return cleaned.trim();
}

/**
 * Làm sạch danh sách kỹ năng (chuỗi) trước khi đưa vào prompt.
 * @param {string[]} skills
 * @returns {string[]}
 */
function sanitizeSkillList(skills) {
  if (!Array.isArray(skills)) return [];
  return skills
    .map((s) => sanitizeForPrompt(String(s?.name || s || ''), 100))
    .filter(Boolean)
    .slice(0, 50); // Tối đa 50 kỹ năng
}

/**
 * Làm sạch object tin tuyển trước khi serialize vào prompt.
 * @param {Object} job
 * @returns {Object}
 */
function sanitizeJobForPrompt(job) {
  return {
    id: Number(job.id) || 0,
    title: sanitizeForPrompt(job.title, 200),
    description: sanitizeForPrompt(job.description, 1000),
    requirements: sanitizeForPrompt(job.requirements, 500),
    company_name: sanitizeForPrompt(job.company_name, 200),
    type: sanitizeForPrompt(job.type, 50),
    skills: sanitizeSkillList(job.skills),
  };
}

module.exports = { sanitizeForPrompt, sanitizeSkillList, sanitizeJobForPrompt };
