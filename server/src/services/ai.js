/**
 * Tích hợp AI cho gateway: Gemini (mặc định), OpenAI, hoặc Poe API (OpenAI-compatible, AI_PROVIDER=poe).
 * - Embedding: tìm kiếm ngữ nghĩa / ghép nối hồ sơ.
 * - Chat tư vấn nghề: hội thoại đa lượt với system prompt cố định.
 * - generateContent: một lượt (moderation, gợi ý, roadmap JSON, …).
 */
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const aiConfig = require('../config/ai.config');
const chatbotServiceConfig = require('../config/chatbot-service.config');
const logger = require('../utils/logger');

/** 503/429/lỗi tạm từ nhà cung cấp — nên retry hoặc đổi model. */
function isRetryableAiError(error) {
  const msg = String(error?.message || '');
  const status = error?.status || error?.statusCode || error?.response?.status;
  if (status === 429 || status === 503 || status === 502 || status === 504) return true;
  if (
    /503|502|504|429|timeout|ETIMEDOUT|ECONNRESET|unavailable|overloaded|high demand|try again later|RESOURCE_EXHAUSTED|Too Many Requests/i.test(
      msg
    )
  ) {
    return true;
  }
  return false;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const CAREER_COUNSELOR_INSTRUCTION =
  'You are a helpful expert career counselor in Vietnam. ' +
  'You help candidates find the right career path, prepare for interviews, ' +
  'and improve their professional profiles. Always be supportive and practical.';

/** Phản hồi thân thiện khi API trả 404/429 hoặc lỗi không mong đợi. */
function careerAdviceErrorMessage(error) {
  const msg = error?.message || '';
  if (/429|quota exceeded|Too Many Requests|rate limit/i.test(msg)) {
    return (
      'Hệ thống AI tạm hết hạn mức (quota) hoặc quá tải. ' +
      'Hãy thử lại sau vài phút; nếu vẫn lỗi, kiểm tra billing/API key hoặc đổi model trong cấu hình server.'
    );
  }
  if (/404|not found|model/i.test(msg) && /invalid|not found|does not exist/i.test(msg)) {
    return (
      'Model AI không còn khả dụng với API key này. ' +
      'Cần cập nhật AI_MODEL / AI_MODEL_FALLBACKS (Gemini), OPENAI_MODEL / OPENAI_MODEL_FALLBACKS (OpenAI), ' +
      'hoặc POE_BOT / POE_BOT_FALLBACKS (Poe) trên server.'
    );
  }
  if (
    /402|payment required|subscription|poe subscription/i.test(msg) &&
    /poe|subscription|api access/i.test(msg)
  ) {
    return (
      'Poe API từ chối: bot/model này cần gói Poe (subscription) phù hợp để gọi qua API, ' +
      'hoặc bạn cần đổi POE_BOT sang model/bot mà tài khoản Poe của bạn được phép dùng qua API. ' +
      'Có thể tạm dùng AI_PROVIDER=openai + OPENAI_API_KEY hoặc AI_PROVIDER=gemini + AI_API_KEY.'
    );
  }
  return "I apologize, but I'm having trouble processing your request right now. Please try again later.";
}

class AIService {
  constructor() {
    /** @type {'openai' | 'poe' | null} */
    this.openaiClientKind = null;
    this.openai = null;
    this.genAI = null;
    this.model = null;
    /** Gemini client chỉ dùng cho embedding khi AI_PROVIDER=poe */
    this.embeddingGemini = null;
    /** OpenAI gốc chỉ dùng cho embedding khi AI_PROVIDER=poe */
    this.embeddingOpenAI = null;

    const p = aiConfig.provider;
    if (p === 'openai' && aiConfig.openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: aiConfig.openaiApiKey,
        baseURL: aiConfig.openaiBaseUrl,
      });
      this.openaiClientKind = 'openai';
    } else if (p === 'poe' && aiConfig.poeApiKey) {
      this.openai = new OpenAI({
        apiKey: aiConfig.poeApiKey,
        baseURL: aiConfig.poeBaseUrl,
      });
      this.openaiClientKind = 'poe';
      if (aiConfig.apiKey) {
        this.embeddingGemini = new GoogleGenerativeAI(aiConfig.apiKey);
      }
      if (aiConfig.openaiApiKey) {
        this.embeddingOpenAI = new OpenAI({
          apiKey: aiConfig.openaiApiKey,
          baseURL: aiConfig.openaiBaseUrl,
        });
      }
    } else if (aiConfig.apiKey && p === 'gemini') {
      this.genAI = new GoogleGenerativeAI(aiConfig.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: aiConfig.model });
    } else if (process.env.NODE_ENV !== 'test') {
      if (p === 'openai') {
        logger.warn('OPENAI_API_KEY is missing. AI features will be limited.');
      } else if (p === 'poe') {
        logger.warn('POE_API_KEY is missing. AI features will be limited.');
      } else {
        logger.warn('AI API Key is missing. AI features will be limited.');
      }
    }
  }

  _usesOpenAICompatibleChat() {
    return this.openaiClientKind === 'openai' || this.openaiClientKind === 'poe';
  }

  _configured() {
    if (this._usesOpenAICompatibleChat()) {
      return !!this.openai;
    }
    return !!this.genAI;
  }

  /** Tạo vector embedding cho đoạn văn (tìm kiếm ngữ nghĩa, so khớp). */
  async embedContent(text) {
    try {
      if (this.openaiClientKind === 'openai') {
        if (!this.openai) throw new Error('AI service not configured');
        const res = await this.openai.embeddings.create({
          model: aiConfig.openaiEmbeddingModel,
          input: text,
        });
        return res.data[0].embedding;
      }
      if (this.openaiClientKind === 'poe') {
        if (this.embeddingOpenAI) {
          const res = await this.embeddingOpenAI.embeddings.create({
            model: aiConfig.openaiEmbeddingModel,
            input: text,
          });
          return res.data[0].embedding;
        }
        if (this.embeddingGemini) {
          const model = this.embeddingGemini.getGenerativeModel({ model: 'text-embedding-004' });
          const result = await model.embedContent(text);
          return result.embedding.values;
        }
        throw new Error(
          'Embedding unavailable with AI_PROVIDER=poe: set AI_API_KEY (Gemini) and/or OPENAI_API_KEY (OpenAI) for embeddings.'
        );
      }
      if (!this.genAI) throw new Error('AI service not configured');
      const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      logger.error('AI Embedding Error:', error);
      throw error;
    }
  }

  /**
   * Tư vấn nghề nghiệp qua chat đa lượt.
   * Thử lần lượt các model trong danh sách (404/429 khác nhau theo model).
   */
  async generateCareerAdvice(userData, userMessage, contextMessages = []) {
    if (chatbotServiceConfig.enabled) {
      return this._generateCareerAdviceViaHttp(userData, userMessage, contextMessages);
    }

    if (!this._configured()) {
      return "I'm sorry, I cannot provide AI-generated advice at the moment as the AI service is not configured.";
    }

    const history = contextMessages.map((msg) => ({
      role: msg.is_ai ? 'model' : 'user',
      parts: [{ text: msg.message }],
    }));

    while (history.length > 0 && history[0].role === 'model') {
      history.shift();
    }

    let prompt = userMessage;
    if (history.length === 0) {
      prompt = `[Context: Candidate Name=${userData.first_name || 'Candidate'}, Role=${userData.role}]\n\n${userMessage}`;
    }

    const generationConfig = {
      maxOutputTokens: aiConfig.options.maxTokens,
      temperature: aiConfig.options.temperature,
    };

    if (this._usesOpenAICompatibleChat()) {
      return this._generateCareerAdviceOpenAI(history, prompt, generationConfig);
    }
    return this._generateCareerAdviceGemini(history, prompt, generationConfig);
  }

  /** Ủy quyền sinh câu trả lời cho dịch vụ Flask (CHATBOT_SERVICE_URL). */
  async _generateCareerAdviceViaHttp(userData, userMessage, contextMessages) {
    const headers = { 'Content-Type': 'application/json' };
    if (chatbotServiceConfig.secret) {
      headers['X-Chatbot-Secret'] = chatbotServiceConfig.secret;
    }
    try {
      const res = await axios.post(
        `${chatbotServiceConfig.url}/v1/career-advice`,
        {
          user: {
            first_name: userData?.first_name,
            role: userData?.role,
          },
          message: userMessage,
          history: (contextMessages || []).map((m) => ({
            message: m.message,
            is_ai: !!m.is_ai,
          })),
        },
        { headers, timeout: chatbotServiceConfig.timeoutMs, validateStatus: () => true }
      );
      if (res.status === 401) {
        logger.error('Chatbot service rejected request (check CHATBOT_API_SECRET).');
        return careerAdviceErrorMessage(new Error('unauthorized'));
      }
      const reply = res.data?.reply;
      if (typeof reply === 'string' && reply.length > 0) {
        return reply;
      }
      logger.error('Chatbot service empty or invalid body:', res.status, res.data);
      return careerAdviceErrorMessage(new Error('empty reply'));
    } catch (error) {
      logger.error('Chatbot service HTTP error:', error.message);
      return careerAdviceErrorMessage(error);
    }
  }

  async _generateCareerAdviceOpenAI(history, prompt, generationConfig) {
    const messages = [{ role: 'system', content: CAREER_COUNSELOR_INSTRUCTION }];
    for (const h of history) {
      const role = h.role === 'model' ? 'assistant' : 'user';
      messages.push({ role, content: h.parts[0].text });
    }
    messages.push({ role: 'user', content: prompt });

    const models =
      aiConfig.openAICompatibleCareerChatModels?.length > 0
        ? aiConfig.openAICompatibleCareerChatModels
        : [aiConfig.openAICompatibleContentModel];

    let lastError = null;
    for (let i = 0; i < models.length; i++) {
      const modelName = models[i];
      try {
        const completion = await this.openai.chat.completions.create({
          model: modelName,
          messages,
          max_tokens: generationConfig.maxOutputTokens,
          temperature: generationConfig.temperature,
        });
        const text = completion.choices[0]?.message?.content || '';
        if (i > 0) {
          logger.info(`generateCareerAdvice: succeeded with fallback chat model ${modelName}`);
        }
        return text;
      } catch (error) {
        lastError = error;
        const msg = error?.message || '';
        const status = error?.status;
        const tryNext =
          (status === 429 || status === 404 || /429|404|rate limit|model/i.test(msg)) &&
          i < models.length - 1;
        if (tryNext) {
          logger.warn(
            `generateCareerAdvice: model ${modelName} failed, trying next (${msg.slice(0, 160)}...)`
          );
          continue;
        }
        logger.error('AI Service Error (OpenAI-compatible):', error);
        return careerAdviceErrorMessage(error);
      }
    }

    logger.error('AI Service Error (all OpenAI-compatible models failed):', lastError);
    return careerAdviceErrorMessage(lastError);
  }

  async _generateCareerAdviceGemini(history, prompt, generationConfig) {
    const models = aiConfig.careerChatModels?.length ? aiConfig.careerChatModels : [aiConfig.model];

    let lastError = null;
    for (let i = 0; i < models.length; i++) {
      const modelName = models[i];
      try {
        const counselor = this.genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: CAREER_COUNSELOR_INSTRUCTION,
        });
        const chat = counselor.startChat({
          history,
          generationConfig,
        });
        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        const text = response.text();
        if (i > 0) {
          logger.info(`generateCareerAdvice: succeeded with fallback model ${modelName}`);
        }
        return text;
      } catch (error) {
        lastError = error;
        const msg = error?.message || '';
        const tryNext =
          /404|not found|429|quota|Too Many Requests/i.test(msg) && i < models.length - 1;
        if (tryNext) {
          logger.warn(
            `generateCareerAdvice: model ${modelName} failed, trying next (${msg.slice(0, 160)}...)`
          );
          continue;
        }
        logger.error('AI Service Error:', error);
        return careerAdviceErrorMessage(error);
      }
    }

    logger.error('AI Service Error (all models failed):', lastError);
    return careerAdviceErrorMessage(lastError);
  }

  /** Sinh nội dung một lượt (không phải chat có lịch sử). Retry + đổi model khi 503/429. */
  async generateContent(prompt) {
    const maxTokens = aiConfig.options.contentMaxTokens ?? 4096;
    const temperature = aiConfig.options.temperature;

    try {
      if (this._usesOpenAICompatibleChat()) {
        if (!this.openai) {
          throw new Error('AI service not configured');
        }
        const models =
          aiConfig.openAICompatibleCareerChatModels?.length > 0
            ? aiConfig.openAICompatibleCareerChatModels
            : [aiConfig.openAICompatibleContentModel];

        let lastError = null;
        for (let mi = 0; mi < models.length; mi += 1) {
          const modelName = models[mi];
          for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
              if (attempt > 0) {
                await sleep(Math.min(8000, 400 * 2 ** (attempt - 1)));
              }
              const completion = await this.openai.chat.completions.create({
                model: modelName,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: maxTokens,
                temperature,
              });
              const text = (completion.choices[0]?.message?.content || '').trim();
              if (text) {
                if (mi > 0 || attempt > 0) {
                  logger.info(`generateContent: ok with model=${modelName} attempt=${attempt + 1}`);
                }
                return text;
              }
              lastError = new Error('Empty AI response');
            } catch (error) {
              lastError = error;
              const retry = isRetryableAiError(error);
              if (retry && attempt < 2) {
                logger.warn(
                  `generateContent: retry model=${modelName} attempt=${attempt + 1} (${String(error?.message || error).slice(0, 120)})`
                );
                continue;
              }
              if (retry && mi < models.length - 1) {
                logger.warn(
                  `generateContent: switch model ${modelName} → next after ${String(error?.message || error).slice(0, 100)}`
                );
                break;
              }
              logger.error('AI Generate Content Error:', error);
              throw error;
            }
          }
        }
        throw lastError || new Error('AI content generation failed');
      }

      if (!this.genAI) {
        throw new Error('AI service not configured');
      }

      const models =
        aiConfig.careerChatModels?.length > 0 ? aiConfig.careerChatModels : [aiConfig.model];

      let lastError = null;
      for (let mi = 0; mi < models.length; mi += 1) {
        const modelName = models[mi];
        const model = this.genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature,
          },
        });

        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            if (attempt > 0) {
              await sleep(Math.min(8000, 400 * 2 ** (attempt - 1)));
            }
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = (response.text() || '').trim();
            if (text) {
              if (mi > 0 || attempt > 0) {
                logger.info(`generateContent: ok with model=${modelName} attempt=${attempt + 1}`);
              }
              return text;
            }
            lastError = new Error('Empty AI response');
          } catch (error) {
            lastError = error;
            const retry = isRetryableAiError(error);
            if (retry && attempt < 2) {
              logger.warn(
                `generateContent: retry model=${modelName} attempt=${attempt + 1} (${String(error?.message || error).slice(0, 120)})`
              );
              continue;
            }
            if (retry && mi < models.length - 1) {
              logger.warn(
                `generateContent: switch model ${modelName} → next after ${String(error?.message || error).slice(0, 100)}`
              );
              break;
            }
            logger.error('AI Generate Content Error:', error);
            throw error;
          }
        }
      }

      throw lastError || new Error('AI content generation failed');
    } catch (error) {
      logger.error('AI Generate Content Error:', error);
      throw error;
    }
  }

  /**
   * Chuẩn hóa phản hồi AI: bỏ fence ```json, cắt đoạn JSON hợp lệ.
   * Dùng chung cho phân tích CV / ghép việc (tránh trùng logic).
   */
  cleanJsonResponse(response) {
    let cleaned = response.trim();
    cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    const jsonStart = cleaned.search(/[{[]/);
    if (jsonStart === -1) return cleaned;

    const isArray = cleaned[jsonStart] === '[';
    const jsonEnd = isArray ? cleaned.lastIndexOf(']') + 1 : cleaned.lastIndexOf('}') + 1;

    if (jsonEnd > jsonStart) {
      cleaned = cleaned.substring(jsonStart, jsonEnd);
    }
    return cleaned;
  }

  /** Gợi ý việc làm phù hợp theo kỹ năng (AI xếp hạng, có fallback). */
  async recommendJobs(candidateSkills, jobs) {
    try {
      if (!this._configured()) return jobs.slice(0, 3);

      const prompt = `
        Rank the following jobs for a candidate with these skills: ${candidateSkills.join(', ')}.
        Jobs: ${JSON.stringify(jobs.map((j) => ({ id: j.id, title: j.title, skills: j.skills })))}
        
        Return a JSON array of the top 3 matching job IDs. Match based on skill overlap and relevance.
        Return ONLY valid JSON, no markdown.
      `;

      const text = await this.generateContent(prompt);
      const recommendedIds = JSON.parse(this.cleanJsonResponse(text));
      return jobs.filter((j) => recommendedIds.includes(j.id));
    } catch (error) {
      logger.error('AI Recommendation Error:', error);
      return jobs.slice(0, 3);
    }
  }

  /** Kiểm duyệt nội dung tin tuyển (lừa đảo, nội dung xấu, …). */
  async moderateJob(jobData) {
    try {
      if (!this._configured()) return { isFlagged: false, note: 'AI Moderation unavailable' };

      const prompt = `
        Analyze the following job posting for scams, illegal content, or unprofessional behavior.
        Title: ${jobData.title}
        Company: ${jobData.company_name || 'N/A'}
        Description: ${jobData.description}
        Requirements: ${jobData.requirements || 'N/A'}

        Return a JSON object with:
        "is_flagged": boolean,
        "reason": string (brief explanation if flagged, or "Safe" if not)
        Return ONLY valid JSON.
      `;

      const text = await this.generateContent(prompt);
      const result = JSON.parse(this.cleanJsonResponse(text));
      return {
        isFlagged: !!result.is_flagged,
        note: result.reason || 'Safe',
      };
    } catch (error) {
      logger.error('AI Moderation Error:', error);
      return { isFlagged: false, note: 'Moderation failed but continuing' };
    }
  }

  /** Tạo một câu hỏi sàng lọc ứng viên theo yêu cầu tin tuyển. */
  async generateScreeningQuestion(jobData) {
    try {
      if (!this._configured()) return 'Tell us more about your experience.';

      const prompt = `
        Based on this job, generate ONE brief open-ended screening question for candidates.
        Title: ${jobData.title}
        Requirements: ${jobData.requirements || 'N/A'}
        
        Example: "How many years of React experience do you have?" or "Tell us about a time you handled a difficult client."
        Return ONLY the question text.
      `;

      return await this.generateContent(prompt);
    } catch {
      return 'Tell us why you are a good fit for this position.';
    }
  }

  /** Lộ trình nghề nghiệp có cấu trúc (JSON) theo hồ sơ và vị trí mục tiêu. */
  async generateCareerRoadmap(candidateData, targetRole) {
    try {
      if (!this._configured()) return null;

      const prompt = `
        As an expert career counselor, create a detailed professional roadmap for a candidate.
        Candidate Profile: ${JSON.stringify(candidateData)}
        Target Role: ${targetRole}

        Return a JSON object with:
        "current_assessment": string (brief summary),
        "milestones": [
          {
            "title": string,
            "duration": string (e.g., "Month 1-2"),
            "description": string,
            "skills_to_learn": [string]
          }
        ],
        "market_outlook": string
        
        Return ONLY valid JSON.
      `;

      const text = await this.generateContent(prompt);
      return JSON.parse(this.cleanJsonResponse(text));
    } catch (error) {
      logger.error('AI Career Roadmap Error:', error);
      return null;
    }
  }
}

module.exports = new AIService();
