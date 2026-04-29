const { PDFParse } = require('pdf-parse');
const fs = require('fs').promises;
const ResumeAnalysisRepository = require('../models/ResumeAnalysis');
const AppError = require('../utils/errorHandler');

const logger = require('../utils/logger');
const AIService = require('./ai');
const VectorService = require('./vector');

/**
 * AI trả strengths/weaknesses dạng { area, description } hoặc chuỗi — chuẩn hóa để API/UI chỉ nhận string.
 * @param {unknown[]} items
 * @returns {string[]}
 */
function normalizeAnalysisBullets(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (item == null) return '';
      if (typeof item === 'string') return item.trim();
      if (typeof item === 'object') {
        if (typeof item.area === 'string' && typeof item.description === 'string') {
          return `${item.area}: ${item.description}`.trim();
        }
        if (typeof item.title === 'string' && typeof item.description === 'string') {
          return `${item.title}: ${item.description}`.trim();
        }
        if (typeof item.action === 'string' || typeof item.reason === 'string') {
          return [item.action, item.reason].filter(Boolean).join(' — ');
        }
        if (typeof item.text === 'string') return item.text.trim();
      }
      return '';
    })
    .filter(Boolean);
}

/**
 * Phân tích CV bằng AI: điểm số, gợi ý, so sánh thị trường (lưu DB theo ứng viên).
 */
class ResumeAnalysisService {
  async getAnalysis(candidateId) {
    return await ResumeAnalysisRepository.getLatest(candidateId);
  }

  /**
   * Phân tích CV đã lưu của ứng viên.
   * @param {number} candidateId
   * @param {string} resumeText
   * @param {Object} resumeFile — file Multer nếu upload mới
   */
  async analyzeResume(candidateId, resumeText, resumeFile = null) {
    try {
      let finalResumeText = resumeText;
      let resumeUrl = null;

      if (resumeFile) {
        resumeUrl = `/uploads/cvs/${resumeFile.filename}`;
        if (!finalResumeText) {
          finalResumeText = await this._extractTextFromFile(resumeFile);
        }
      }

      if (!finalResumeText) {
        throw new Error('No resume content to analyze');
      }

      // Không upload file mới → có thể tái dùng bản phân tích gần đây còn hạn
      if (!resumeFile) {
        const existing = await ResumeAnalysisRepository.getLatest(candidateId);
        if (existing && this._isAnalysisValid(existing)) {
          logger.info(`Using cached resume analysis for candidate ${candidateId}`);
          return existing;
        }
      }

      logger.info(`Starting resume analysis for candidate ${candidateId}`);

      const aiResponse = await this._performComprehensiveAIAnalysis(finalResumeText);

      const { extractedData, analysis, suggestions } = aiResponse;

      // Embedding đoạn đầu CV (tìm kiếm ngữ nghĩa); lỗi thì bỏ qua, vẫn lưu phân tích
      let resumeEmbedding = null;
      try {
        const VectorService = require('./vector');
        resumeEmbedding = await VectorService.generateEmbedding(finalResumeText.substring(0, 5000));
      } catch {
        logger.warn(
          'Failed to generate resume embedding, continuing but semantic matching will be limited.'
        );
      }

      const scores = await this._calculateScores(extractedData);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const strengthLines = normalizeAnalysisBullets(analysis.strengths);
      const weaknessLines = normalizeAnalysisBullets(analysis.weaknesses);
      const suggestionLines = normalizeAnalysisBullets(suggestions || []);

      const result = await ResumeAnalysisRepository.create({
        candidate_id: candidateId,
        resume_text: finalResumeText,
        resume_url: resumeUrl,
        resume_embedding: resumeEmbedding,
        overall_score: scores.overall,
        skill_score: scores.skills,
        experience_score: scores.experience,
        education_score: scores.education,
        strengths: strengthLines,
        weaknesses: weaknessLines,
        skill_matches: extractedData.skills,
        suggestions:
          suggestionLines.length > 0
            ? suggestionLines
            : ['Xem lại cấu trúc CV và bổ sung số liệu cụ thể.'],
        keywords: extractedData.keywords,
        role_level: extractedData.role_level,
        expires_at: expiresAt,
      });

      logger.info(
        `Resume analysis completed for candidate ${candidateId}, score: ${scores.overall}`
      );

      return result;
    } catch (error) {
      logger.error('Resume analysis error:', error);
      throw new Error(error.message || 'Failed to analyze resume');
    }
  }

  /**
   * Phân tích CV công khai (trang /ai-cv-scanner): gọi AI, không lưu DB, không cần candidate.
   */
  async analyzeResumePreview(resumeText, resumeFile = null) {
    let finalResumeText = resumeText ? String(resumeText).trim() : '';

    if (resumeFile) {
      try {
        if (!finalResumeText) {
          finalResumeText = await this._extractTextFromFile(resumeFile);
        } else {
          await fs.unlink(resumeFile.path).catch(() => {});
        }
      } catch (err) {
        if (resumeFile.path) await fs.unlink(resumeFile.path).catch(() => {});
        throw err;
      }
    }

    if (!finalResumeText) {
      throw new AppError('Không có nội dung CV để phân tích', 400);
    }

    const slice = finalResumeText.slice(0, 12000);
    const aiResponse = await this._performComprehensiveAIAnalysis(slice);
    const scores = await this._calculateScores(aiResponse.extractedData);
    const kw = aiResponse.extractedData.keywords || [];
    const suggestionLines = normalizeAnalysisBullets(aiResponse.suggestions || []);
    const missingKw = Math.min(8, Math.max(0, 12 - kw.length));

    return {
      overall_score: scores.overall,
      skill_score: scores.skills,
      experience_score: scores.experience,
      education_score: scores.education,
      keyword_score: scores.keywords,
      keywords_found: kw.length,
      missing_keywords_estimate: missingKw,
      format_label: scores.overall >= 80 ? 'Tốt' : scores.overall >= 65 ? 'Khá' : 'Cần cải thiện',
      role_level: aiResponse.extractedData.role_level,
      strengths: normalizeAnalysisBullets(aiResponse.analysis.strengths || []),
      weaknesses: normalizeAnalysisBullets(aiResponse.analysis.weaknesses || []),
      suggestions:
        suggestionLines.length > 0
          ? suggestionLines
          : ['Xem lại cấu trúc CV và bổ sung số liệu cụ thể.'],
      skills: aiResponse.extractedData.skills || [],
    };
  }

  /** Trích văn bản từ file upload (hiện hỗ trợ PDF). Nhận PDF theo byte %PDF (1024 byte đầu), không chỉ MIME. */
  async _extractTextFromFile(file) {
    try {
      const dataBuffer = await fs.readFile(file.path);
      const PDF_MARKER = Buffer.from('%PDF');
      const prefixLen = Math.min(dataBuffer.length, 1024);
      const looksPdf =
        file.mimetype === 'application/pdf' ||
        dataBuffer.subarray(0, prefixLen).includes(PDF_MARKER);

      if (!looksPdf) {
        await fs
          .unlink(file.path)
          .catch((_err) => logger.warn(`Failed to delete temp file ${file.path}`));
        throw new AppError('Hiện tại chỉ hỗ trợ trích xuất văn bản từ file PDF', 400);
      }

      let text = '';
      let parser = null;
      try {
        parser = new PDFParse({ data: dataBuffer });
        const result = await parser.getText();
        text = (result.text || '').trim();
      } finally {
        if (parser) {
          try {
            await parser.destroy();
          } catch (dErr) {
            logger.warn(`pdf-parse destroy failed: ${dErr?.message || dErr}`);
          }
        }
        await fs
          .unlink(file.path)
          .catch((_err) => logger.warn(`Failed to delete temp file ${file.path}`));
      }
      return text;
    } catch (error) {
      logger.error('File extraction error:', error);
      throw error;
    }
  }

  /** Một lần gọi AI: trích dữ liệu, điểm mạnh/yếu, gợi ý (hiệu quả hơn gọi lần lượt). */
  async _performComprehensiveAIAnalysis(resumeText) {
    const buildPrompt = (strictJsonHint) => {
      const suffix = strictJsonHint
        ? '\n\nCRITICAL: Output ONLY one valid JSON object. No markdown code fences. Close all strings and brackets.'
        : '';
      return `You are an ATS/career expert for Vietnamese job seekers. Analyze the resume below and return ONE JSON object.

Resume:
${resumeText}

Tasks:
1. Extract structured data: skills, years of experience, education, certifications, keywords, and role level.
2. Identify 3-5 key strengths and 3-5 areas for improvement (weaknesses).
3. Provide 3-5 specific, actionable suggestions to improve the resume.

LANGUAGE (mandatory for user-facing text):
- Write EVERY "area" and "description" inside analysis.strengths and analysis.weaknesses in clear, professional Vietnamese.
- Write EVERY "action" and "reason" inside suggestions in Vietnamese (concise, actionable).
- Skill names and keywords may stay in common industry English (e.g. React, AWS) when they appear on typical CVs; short labels in Vietnamese are welcome when natural.
- Do not write strengths, weaknesses, or suggestions in English — Vietnamese only for those narrative fields.

Return ONLY valid JSON with this exact structure:
{
  "extractedData": {
    "skills": ["skill1", "skill2", ...],
    "experience_years": <number>,
    "education": ["degree1", ...],
    "certifications": ["cert1", ...],
    "keywords": ["key1", ...],
    "role_level": "entry|junior|mid|senior|lead|executive"
  },
  "analysis": {
    "strengths": [{"area": "string", "description": "string"}],
    "weaknesses": [{"area": "string", "description": "string"}]
  },
  "suggestions": [
     {"action": "string", "reason": "string", "priority": "high|medium|low"}
  ]
}${suffix}`;
    };

    const parseAiJson = (response) => {
      const cleaned = AIService.cleanJsonResponse(response);
      return JSON.parse(cleaned);
    };

    for (let round = 0; round < 2; round += 1) {
      try {
        const response = await AIService.generateContent(buildPrompt(round > 0));
        const data = parseAiJson(response);

        return {
          extractedData: data.extractedData || {
            skills: [],
            experience_years: 0,
            education: [],
            certifications: [],
            keywords: [],
            role_level: 'mid',
          },
          analysis: data.analysis || { strengths: [], weaknesses: [] },
          suggestions: data.suggestions || [],
        };
      } catch (error) {
        const isParse = error instanceof SyntaxError;
        if (isParse && round === 0) {
          logger.warn(
            'Comprehensive AI: JSON parse failed, retrying once with stricter instruction'
          );
          continue;
        }
        logger.error('Comprehensive AI analysis failed:', error);
        throw new Error('AI_ANALYSIS_FAILED');
      }
    }

    throw new Error('AI_ANALYSIS_FAILED');
  }

  /** Điểm tổng hợp từ dữ liệu đã trích. */
  async _calculateScores(extractedData) {
    const skillScore = this._scoreSkills(extractedData.skills);
    const experienceScore = this._scoreExperience(extractedData.experience_years);
    const educationScore = this._scoreEducation(extractedData.education);
    const keywordScore = this._scoreKeywords(extractedData.keywords);

    const overall = Math.round(
      skillScore * 0.4 + experienceScore * 0.3 + educationScore * 0.2 + keywordScore * 0.1
    );

    return {
      overall,
      skills: skillScore,
      experience: experienceScore,
      education: educationScore,
      keywords: keywordScore,
    };
  }

  _scoreSkills(skills) {
    if (!skills || skills.length === 0) return 30;

    let score = 0;

    if (skills.length >= 10) score = 70;
    else if (skills.length >= 7) score = 60;
    else if (skills.length >= 5) score = 50;
    else if (skills.length >= 3) score = 40;
    else score = 30;

    const uniqueSkills = new Set(skills.map((s) => s.toLowerCase()));
    if (uniqueSkills.size >= skills.length * 0.9) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  _scoreExperience(years) {
    if (years >= 10) return 100;
    if (years >= 7) return 90;
    if (years >= 5) return 80;
    if (years >= 3) return 70;
    if (years >= 2) return 60;
    if (years >= 1) return 50;
    return 40;
  }

  _scoreEducation(education) {
    if (!education || education.length === 0) return 50;

    const eduStr = education.join(' ').toLowerCase();

    if (eduStr.includes('phd') || eduStr.includes('doctorate')) return 100;
    if (eduStr.includes('master') || eduStr.includes('mba')) return 90;
    if (eduStr.includes('bachelor') || eduStr.includes('degree')) return 80;
    if (eduStr.includes('associate')) return 70;
    if (eduStr.includes('diploma')) return 60;

    return 50;
  }

  _scoreKeywords(keywords) {
    if (!keywords || keywords.length === 0) return 40;

    if (keywords.length >= 15) return 100;
    if (keywords.length >= 10) return 80;
    if (keywords.length >= 7) return 70;
    if (keywords.length >= 5) return 60;

    return 50;
  }

  /** So sánh điểm CV ứng viên với thống kê toàn hệ thống. */
  async compareWithMarket(candidateId) {
    const analysis = await ResumeAnalysisRepository.getLatest(candidateId);
    if (!analysis) {
      throw new Error('No resume analysis found');
    }

    const stats = await ResumeAnalysisRepository.getStatistics();

    return {
      candidate_score: analysis.overall_score,
      market_average: parseFloat(stats.avg_overall_score).toFixed(2),
      position:
        analysis.overall_score > stats.avg_overall_score ? 'above_average' : 'below_average',
      percentile: this._calculatePercentile(analysis.overall_score, stats),
      stats,
    };
  }

  _calculatePercentile(score, stats) {
    const range = stats.max_score - stats.min_score;
    const position = score - stats.min_score;
    return Math.round((position / range) * 100);
  }
}

module.exports = new ResumeAnalysisService();
