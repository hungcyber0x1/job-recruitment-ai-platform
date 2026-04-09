/**
 * Khi CHATBOT_SERVICE_URL được đặt, tin nhắn tư vấn nghề (chatbot) sinh qua API Flask
 * thay vì gọi Gemini/OpenAI trực tiếp trong process Node.
 */
const { envBaseUrl } = require('../utils/envBaseUrl');

const url = envBaseUrl('CHATBOT_SERVICE_URL', '');

module.exports = {
  enabled: Boolean(url),
  url,
  secret: String(process.env.CHATBOT_API_SECRET || '').trim(),
  timeoutMs: Number(process.env.CHATBOT_SERVICE_TIMEOUT_MS || 120000) || 120000,
};
