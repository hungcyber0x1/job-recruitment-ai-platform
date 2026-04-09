const { PDFParse } = require('pdf-parse');
const fs = require('fs').promises;
const ResumeAnalysisRepository = require('../repositories/resume-analysis');
const JobRepository = require('../repositories/job');
const AppError = require('../utils/errorHandler');

const logger = require('../utils/logger');
const AIService = require('./ai');
const VectorService = require('./vector');

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

      const result = await ResumeAnalysisRepository.create({
        candidate_id: candidateId,
        resume_text: finalResumeText,
        resume_url: resumeUrl,
        resume_embedding: resumeEmbedding,
        overall_score: scores.overall,
        skill_score: scores.skills,
        experience_score: scores.experience,
        education_score: scores.education,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        skill_matches: extractedData.skills,
        suggestions: suggestions,
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
    const suggestions = (aiResponse.suggestions || []).map((s) =>
      typeof s === 'string' ? s : [s.action, s.reason].filter(Boolean).join(' — ')
    );
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
      strengths: aiResponse.analysis.strengths || [],
      weaknesses: aiResponse.analysis.weaknesses || [],
      suggestions:
        suggestions.length > 0 ? suggestions : ['Xem lại cấu trúc CV và bổ sung số liệu cụ thể.'],
      skills: aiResponse.extractedData.skills || [],
    };
  }

  /** Trích văn bản từ file upload (hiện hỗ trợ PDF). */
  async _extractTextFromFile(file) {
    try {
      if (file.mimetype === 'application/pdf') {
        const dataBuffer = await fs.readFile(file.path);
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
      }
      throw new AppError('Hiện tại chỉ hỗ trợ trích xuất văn bản từ file PDF', 400);
    } catch (error) {
      logger.error('File extraction error:', error);
      throw error;
    }
  }

  /** Một lần gọi AI: trích dữ liệu, điểm mạnh/yếu, gợi ý (hiệu quả hơn gọi lần lượt). */
  async _performComprehensiveAIAnalysis(resumeText) {
    const prompt = `Analyze the following resume and provide a comprehensive assessment in JSON format:

Resume:
${resumeText}

Tasks:
1. Extract structured data: skills, years of experience, education, certifications, keywords, and role level.
2. Identify 3-5 key strengths and 3-5 areas for improvement (weaknesses).
3. Provide 3-5 specific, actionable suggestions to improve the resume.

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
}`;

    try {
      const response = await AIService.generateContent(prompt);
      const cleaned = AIService.cleanJsonResponse(response);
      const data = JSON.parse(cleaned);

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
      logger.error('Comprehensive AI analysis failed:', error);
      throw new Error('AI_ANALYSIS_FAILED');
    }
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

  /**
   * Chuẩn hóa vector embedding từ DB/API (string JSON, Buffer, hoặc mảng số).
   * @returns {number[]|null}
   */
  _parseEmbeddingVector(raw) {
    if (raw == null) return null;
    let vec = raw;
    if (Buffer.isBuffer(raw)) {
      try {
        vec = JSON.parse(raw.toString('utf8'));
      } catch {
        return null;
      }
    } else if (typeof raw === 'string') {
      const s = raw.trim();
      if (!s) return null;
      try {
        vec = JSON.parse(s);
      } catch {
        return null;
      }
    }
    if (!Array.isArray(vec) || vec.length === 0) return null;
    const out = [];
    for (let i = 0; i < vec.length; i += 1) {
      const n = Number(vec[i]);
      if (!Number.isFinite(n)) return null;
      out.push(n);
    }
    return out;
  }

  _normalizeJobMatchLlmResult(parsed, semanticScore) {
    const fallbackReason =
      semanticScore > 0
        ? 'Không đọc được phản hồi chi tiết từ AI; điểm dưới đây kết hợp độ tương đồng ngữ nghĩa CV–JD.'
        : 'Không đọc được phản hồi từ AI. Vui lòng thử lại.';
    const strArr = (v) =>
      Array.isArray(v) ? v.map((x) => (x != null ? String(x) : '')).filter(Boolean) : [];
    const score =
      typeof parsed?.llm_match_score === 'number' && Number.isFinite(parsed.llm_match_score)
        ? Math.max(0, Math.min(100, parsed.llm_match_score))
        : 0;
    return {
      llm_match_score: score,
      reasoning:
        typeof parsed?.reasoning === 'string' && parsed.reasoning.trim()
          ? parsed.reasoning.trim()
          : fallbackReason,
      matching_skills: strArr(parsed?.matching_skills),
      missing_skills: strArr(parsed?.missing_skills),
      strengths: strArr(parsed?.strengths),
      gaps: strArr(parsed?.gaps),
      recommendations: strArr(parsed?.recommendations),
    };
  }

  /** Phân tích khớp CV–tin tuyển (embedding + LLM) trong cùng process. */
  async analyzeJobMatch(candidateId, jobId) {
    try {
      const analysis = await ResumeAnalysisRepository.getLatest(candidateId);
      if (!analysis || !analysis.resume_text) {
        throw new Error('RESUME_NOT_FOUND');
      }

      const job = await JobRepository.findByIdWithDetails(jobId);
      if (!job) {
        throw new Error('JOB_NOT_FOUND');
      }

      let semanticScore = 0;
      let resumeEmbedding = analysis.resume_embedding;
      let jobEmbedding = job.job_embedding;

      if (!resumeEmbedding) {
        try {
          resumeEmbedding = await VectorService.generateEmbedding(
            analysis.resume_text.substring(0, 5000)
          );
        } catch {
          logger.warn('Failed to generate resume embedding on the fly');
        }
      }

      if (!jobEmbedding) {
        try {
          const textToEmbed = `${job.title} ${job.description} ${job.requirements || ''}`;
          jobEmbedding = await VectorService.generateEmbedding(textToEmbed.substring(0, 5000));
        } catch {
          logger.warn('Failed to generate job embedding on the fly');
        }
      }

      if (resumeEmbedding && jobEmbedding) {
        const resVec = this._parseEmbeddingVector(resumeEmbedding);
        const jobVec = this._parseEmbeddingVector(jobEmbedding);
        if (resVec && jobVec && resVec.length === jobVec.length) {
          const sim = VectorService.cosineSimilarity(resVec, jobVec);
          if (Number.isFinite(sim)) {
            semanticScore = Math.round(sim * 100);
          }
        } else if (resVec && jobVec && resVec.length !== jobVec.length) {
          logger.warn('Resume/job embedding dimension mismatch; skipping semantic score');
        }
      }

      const resumeText = analysis.resume_text.substring(0, 10000);

      const prompt = `
                Act as an expert ATS (Applicant Tracking System) and Career Coach. 
                Compare the following Candidate Resume with the Job Description.

                CANDIDATE RESUME:
                ${resumeText}

                JOB DESCRIPTION:
                Title: ${job.title}
                Requirements: ${job.requirements}
                Description: ${job.description}

                Analyze the fit and return a JSON object with this exact structure:
                {
                    "llm_match_score": <number between 0 and 100>,
                    "reasoning": "Brief explanation of the score",
                    "matching_skills": ["skill1", "skill2", ...],
                    "missing_skills": ["skill1", "skill2", ...],
                    "strengths": ["strength1", "strength2"],
                    "gaps": ["gap1", "gap2"],
                    "recommendations": ["actionable advice 1", "actionable advice 2"]
                }
                
                IMPORTANT: Return ONLY valid JSON. No markdown formatting.
            `;

      const response = await AIService.generateContent(prompt);

      let llmParsed = null;
      try {
        llmParsed = JSON.parse(AIService.cleanJsonResponse(response));
      } catch (e) {
        logger.warn('Job match LLM JSON parse failed', { message: e?.message });
      }
      const llmResult = this._normalizeJobMatchLlmResult(llmParsed, semanticScore);

      const finalMatchScore =
        semanticScore > 0
          ? Math.round(semanticScore * 0.4 + (llmResult.llm_match_score || 0) * 0.6)
          : llmResult.llm_match_score || 0;

      return {
        ...llmResult,
        match_score: finalMatchScore,
        semantic_score: semanticScore,
        llm_score: llmResult.llm_match_score,
        job_id: jobId,
        candidate_id: candidateId,
        analyzed_at: new Date(),
      };
    } catch (error) {
      logger.error('Job Match Analysis Error:', error);
      if (error.message === 'RESUME_NOT_FOUND' || error.message === 'JOB_NOT_FOUND') {
        throw error;
      }
      throw new Error('Failed to analyze job match');
    }
  }
}

module.exports = new ResumeAnalysisService();
