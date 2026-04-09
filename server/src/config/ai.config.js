/**
 * AI_PROVIDER=gemini (mặc định): Google Generative AI — AI_API_KEY, AI_MODEL, AI_MODEL_FALLBACKS.
 * AI_PROVIDER=openai: OpenAI — OPENAI_API_KEY, OPENAI_MODEL, OPENAI_MODEL_FALLBACKS; tùy chọn OPENAI_BASE_URL.
 * AI_PROVIDER=poe: Poe OpenAI-compatible API — POE_API_KEY, POE_BOT (tên bot công khai trên Poe), POE_API_BASE_URL.
 *   Chat/embeddings: Poe chỉ hỗ trợ chat completions; embedding cần thêm AI_API_KEY (Gemini) hoặc OPENAI_API_KEY (OpenAI gốc).
 */
const { optionalEnvUrl } = require('../utils/envBaseUrl');

function parseModelList(raw) {
  if (raw == null || String(raw).trim() === '') return [];
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function dedupeModels(list) {
  const seen = new Set();
  return list.filter((m) => {
    if (seen.has(m)) return false;
    seen.add(m);
    return true;
  });
}

const rawProvider = String(process.env.AI_PROVIDER || 'gemini').toLowerCase();
const provider = ['gemini', 'openai', 'poe'].includes(rawProvider) ? rawProvider : 'gemini';

const primaryModel = process.env.AI_MODEL || 'gemini-2.5-flash';
const geminiFallbacks = parseModelList(
  process.env.AI_MODEL_FALLBACKS || 'gemini-2.0-flash,gemini-2.5-flash-lite,gemini-flash-latest'
);
const careerChatModels = dedupeModels([primaryModel, ...geminiFallbacks]);

const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const openaiFallbacks = parseModelList(process.env.OPENAI_MODEL_FALLBACKS || 'gpt-4o');
const openaiCareerChatModels = dedupeModels([openaiModel, ...openaiFallbacks]);

const poeApiKey = String(process.env.POE_API_KEY || '').trim();
const poeBaseUrl = optionalEnvUrl('POE_API_BASE_URL') || 'https://api.poe.com/v1';
const poeBotPrimary = process.env.POE_BOT || 'JobMentorAI';
const poeBotFallbacks = parseModelList(process.env.POE_BOT_FALLBACKS);
const poeCareerChatModels = dedupeModels([poeBotPrimary, ...poeBotFallbacks]);

const openaiBaseUrl = optionalEnvUrl('OPENAI_BASE_URL');

/** Model list cho chat.completions khi AI_PROVIDER là openai hoặc poe */
const openAICompatibleCareerChatModels =
  provider === 'poe' ? poeCareerChatModels : openaiCareerChatModels;

/** Model một lượt (generateContent, …) khi dùng OpenAI-compatible client */
const openAICompatibleContentModel = provider === 'poe' ? poeBotPrimary : openaiModel;

module.exports = {
  /** `gemini` | `openai` | `poe` */
  provider,
  apiKey: process.env.AI_API_KEY,
  model: primaryModel,
  careerChatModels,

  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel,
  openaiCareerChatModels,
  openaiBaseUrl,
  openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',

  poeApiKey: poeApiKey || undefined,
  poeBaseUrl,
  poeBot: poeBotPrimary,
  poeCareerChatModels,

  openAICompatibleCareerChatModels,
  openAICompatibleContentModel,

  options: {
    temperature: 0.7,
    maxTokens: 500,
  },
};
