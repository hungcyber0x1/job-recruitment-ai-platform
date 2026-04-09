const AIService = require('./ai');
const AIJobMatchRepository = require('../repositories/ai-job-match');
const CandidateRepository = require('../repositories/candidate');
const JobRepository = require('../repositories/job');
const SystemSettingsRepository = require('../repositories/system-settings');
// const SkillRepository = require('../repositories/skill');
const ResumeAnalysisRepository = require('../repositories/resume-analysis');
const logger = require('../utils/logger');
const { sanitizeForPrompt, sanitizeSkillList } = require('../utils/sanitize');

/**
 * Ghép ứng viên–tin tuyển (điểm tương thích, AI hỗ trợ phân tích).
 */
class JobMatchingService {
  /** Tính điểm khớp cho một cặp (ứng viên, tin). */
  async calculateMatchScore(candidateId, jobId) {
    try {
      // Ưu tiên bản ghi cache còn hạn
      const cached = await AIJobMatchRepository.findMatch(candidateId, jobId);
      if (cached && this._isMatchValid(cached)) {
        logger.info(`Using cached match for candidate ${candidateId} - job ${jobId}`);
        return cached;
      }

      logger.info(`Calculating new match score for candidate ${candidateId} - job ${jobId}`);

      const candidate = await CandidateRepository.findByIdWithSkills(candidateId);
      if (!candidate) throw new Error('Candidate not found');

      const resumeAnalysis = await ResumeAnalysisRepository.getLatest(candidateId);

      const job = await JobRepository.findByIdWithDetails(jobId);
      if (!job) throw new Error('Job not found');

      // Điểm thành phần (kỹ năng, kinh nghiệm, học vấn, địa điểm)
      const skillMatch = this._calculateSkillMatch(
        candidate.skills || [],
        this._parseSkills(job.required_skills),
        this._parseSkills(job.preferred_skills)
      );

      const experienceMatch = this._calculateExperienceMatch(
        candidate.experience_years || 0,
        job.experience_min || 0,
        job.experience_max
      );

      const educationMatch = this._calculateEducationMatch(
        resumeAnalysis?.education_score || 70,
        job.education_level
      );

      const locationMatch = this._calculateLocationMatch(
        candidate.location,
        job.location,
        job.type
      );

      // Phân tích sâu bằng AI (gọi model, gộp vào kết quả khớp)
      const aiAnalysis = await this._getAIMatchAnalysis(
        candidate,
        job,
        skillMatch,
        experienceMatch,
        educationMatch
      );

      const overallScore = this._calculateOverallScore({
        skill: skillMatch.score,
        experience: experienceMatch,
        education: educationMatch,
        location: locationMatch,
      });

      const recommendationType = this._getRecommendationType(overallScore);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Lưu kết quả (cache 7 ngày)
      const matchResult = await AIJobMatchRepository.upsert({
        candidate_id: candidateId,
        job_id: jobId,
        match_score: overallScore,
        skill_match_score: skillMatch.score,
        experience_match_score: experienceMatch,
        education_match_score: educationMatch,
        location_match_score: locationMatch,
        matching_skills: skillMatch.matching,
        missing_skills: skillMatch.missing,
        extra_skills: skillMatch.extra,
        recommendation_reason: aiAnalysis.reason,
        strengths: aiAnalysis.strengths,
        concerns: aiAnalysis.concerns,
        recommendation_type: recommendationType,
        expires_at: expiresAt,
      });

      logger.info(`Match calculated: ${overallScore}% for candidate ${candidateId} - job ${jobId}`);

      return matchResult;
    } catch (error) {
      logger.error('Job matching error:', error);
      if (error.message === 'JOB_MATCHING_DISABLED') {
        throw error;
      }
      throw new Error('Failed to calculate job match');
    }
  }

  /** Top tin việc phù hợp cho một ứng viên. */
  async getTopMatchesForCandidate(candidateId, limit = 10) {
    const jobMatchingEnabled = await SystemSettingsRepository.getBoolean('ai_job_matching', true);
    if (!jobMatchingEnabled) {
      throw new Error('JOB_MATCHING_DISABLED');
    }

    // 1) Lấy tin đã publish (giới hạn để tránh tải quá nhiều)
    const { data: jobs } = await JobRepository.findWithDetails({ status: 'published', limit: 200 });

    // 2) Chấm sơ bằng rule (nhanh, chưa gọi AI sâu)
    const candidate = await CandidateRepository.findByIdWithSkills(candidateId);
    if (!candidate) throw new Error('Candidate not found');

    const resumeAnalysis = await ResumeAnalysisRepository.getLatest(candidateId);
    const educationScore = resumeAnalysis?.education_score || 70;

    const prelimMatches = jobs.map((job) => {
      const skillMatch = this._calculateSkillMatch(
        candidate.skills || [],
        this._parseSkills(job.required_skills),
        this._parseSkills(job.preferred_skills)
      );
      const experienceMatch = this._calculateExperienceMatch(
        candidate.experience_years || 0,
        job.experience_min || 0,
        job.experience_max
      );
      const eduMatch = this._calculateEducationMatch(educationScore, job.education_level);
      const locationMatch = this._calculateLocationMatch(
        candidate.location,
        job.location,
        job.type
      );

      const score = this._calculateOverallScore({
        skill: skillMatch.score,
        experience: experienceMatch,
        education: eduMatch,
        location: locationMatch,
      });

      return { job, score };
    });

    // 3) Lấy top 5 theo điểm sơ bộ để phân tích AI đầy đủ
    const topPrelim = prelimMatches.sort((a, b) => b.score - a.score).slice(0, 5);

    // 4) Chỉ gọi calculateMatchScore (AI đầy đủ) cho các tin này
    const matchPromises = topPrelim.map(async (item) => {
      try {
        return await this.calculateMatchScore(candidateId, item.job.id);
      } catch (error) {
        logger.error(`Failed to match job ${item.job.id}:`, error);
        return null;
      }
    });

    const matches = (await Promise.all(matchPromises)).filter((m) => m !== null);

    return matches.sort((a, b) => b.match_score - a.match_score).slice(0, limit);
  }

  /** Top ứng viên phù hợp cho một tin (phía nhà tuyển dụng). */
  async getTopCandidatesForJob(jobId, limit = 20) {
    const jobMatchingEnabled = await SystemSettingsRepository.getBoolean('ai_job_matching', true);
    if (!jobMatchingEnabled) {
      throw new Error('JOB_MATCHING_DISABLED');
    }

    const candidates = await CandidateRepository.findAllPaginated({ limit: 100 });

    const matchPromises = candidates.map(async (candidate) => {
      try {
        return await this.calculateMatchScore(candidate.id, jobId);
      } catch (error) {
        logger.error(`Failed to match candidate ${candidate.id}:`, error);
        return null;
      }
    });

    const matches = (await Promise.all(matchPromises)).filter((m) => m !== null);

    return matches.sort((a, b) => b.match_score - a.match_score).slice(0, limit);
  }

  /** Điểm khớp kỹ năng (bắt buộc / ưu tiên). */
  _calculateSkillMatch(candidateSkills, requiredSkills = [], preferredSkills = []) {
    const candidateSkillSet = new Set(candidateSkills.map((s) => (s.name || s).toLowerCase()));

    const requiredSet = new Set(requiredSkills.map((s) => s.toLowerCase()));
    const preferredSet = new Set(preferredSkills.map((s) => s.toLowerCase()));

    const matchingRequired = [...requiredSet].filter((s) => candidateSkillSet.has(s));
    const matchingPreferred = [...preferredSet].filter((s) => candidateSkillSet.has(s));

    const missingRequired = [...requiredSet].filter((s) => !candidateSkillSet.has(s));
    const missingPreferred = [...preferredSet].filter((s) => !candidateSkillSet.has(s));

    const allJobSkills = new Set([...requiredSet, ...preferredSet]);
    const extraSkills = [...candidateSkillSet].filter((s) => !allJobSkills.has(s));

    let score = 0;

    if (requiredSet.size > 0) {
      const requiredMatch = (matchingRequired.length / requiredSet.size) * 100;
      score = requiredMatch * 0.7; // 70% trọng số kỹ năng bắt buộc
    } else {
      score = 70; // Tin không ghi yêu cầu kỹ năng bắt buộc
    }

    if (preferredSet.size > 0) {
      const preferredMatch = (matchingPreferred.length / preferredSet.size) * 100;
      score += preferredMatch * 0.3; // 30% weight for preferred skills
    } else {
      score += 30; // No preferences specified
    }

    return {
      score: Math.round(score),
      matching: [...matchingRequired, ...matchingPreferred],
      missing: [...missingRequired, ...missingPreferred],
      extra: extraSkills,
    };
  }

  /** Điểm khớp kinh nghiệm (năm). */
  _calculateExperienceMatch(candidateYears, minYears, maxYears) {
    if (!minYears || minYears === 0) return 100;

    if (candidateYears >= minYears && candidateYears <= (maxYears || 999)) {
      return 100;
    } else if (candidateYears < minYears) {
      const gap = minYears - candidateYears;
      return Math.max(0, 100 - gap * 15);
    } else {
      return 90;
    }
  }

  /** Điểm khớp học vấn (so với ngưỡng theo bậc yêu cầu). */
  _calculateEducationMatch(candidateEducationScore, requiredLevel) {
    if (!requiredLevel) return 100;

    const levelThresholds = {
      phd: 95,
      doctorate: 95,
      master: 85,
      mba: 85,
      bachelor: 70,
      degree: 70,
      associate: 55,
      diploma: 45,
      high_school: 30,
      none: 0,
    };

    const reqKey = requiredLevel.toLowerCase().replace(/[^a-z_]/g, '');
    const threshold = levelThresholds[reqKey] ?? 60;

    if (candidateEducationScore >= threshold) return 100;

    const gap = threshold - candidateEducationScore;
    return Math.max(0, 100 - gap * 2);
  }

  /** Điểm khớp địa điểm (chuỗi đơn giản; remote luôn 100). */
  _calculateLocationMatch(candidateLocation, jobLocation, jobType) {
    if (jobType === 'remote') return 100;

    if (!candidateLocation || !jobLocation) return 70;

    const candLoc = candidateLocation.toLowerCase();
    const jobLoc = jobLocation.toLowerCase();

    if (candLoc === jobLoc) return 100;
    if (candLoc.includes(jobLoc) || jobLoc.includes(candLoc)) return 90;

    return 50;
  }

  /** Tổng điểm có trọng số. */
  _calculateOverallScore(scores) {
    const weights = {
      skill: 0.5,
      experience: 0.25,
      education: 0.15,
      location: 0.1,
    };

    const overall =
      scores.skill * weights.skill +
      scores.experience * weights.experience +
      scores.education * weights.education +
      scores.location * weights.location;

    return Math.round(overall);
  }

  /** Gọi AI để giải thích / điểm mạnh-yếu khớp. */
  async _getAIMatchAnalysis(candidate, job, skillMatch, expMatch, _eduMatch) {
    const candidateName = sanitizeForPrompt(candidate.current_job_title || 'Chưa cập nhật', 100);
    const jobTitle = sanitizeForPrompt(job.title, 200);
    const jobType = sanitizeForPrompt(job.type || 'full-time', 50);
    const jobDesc = sanitizeForPrompt(job.description?.substring(0, 500) || 'Chưa cung cấp', 500);
    const candidateSkills = sanitizeSkillList(candidate.skills || []);
    const matchingSkills = sanitizeSkillList(skillMatch.matching || []);
    const missingSkills = sanitizeSkillList(skillMatch.missing || []);

    const prompt = `Bạn là chuyên gia tuyển dụng tại Việt Nam với 10 năm kinh nghiệm. Hãy đánh giá mức độ phù hợp giữa ứng viên và công việc sau:

Ứng viên:
- Kỹ năng: ${candidateSkills.join(', ') || 'Chưa cập nhật'}
- Kinh nghiệm: ${candidate.experience_years || 0} năm
- Vị trí hiện tại: ${candidateName}

Công việc:
- Vị trí: ${jobTitle}
- Loại hình: ${jobType}
- Mô tả: ${jobDesc}

Kết quả chấm điểm sơ bộ:
- Điểm kỹ năng: ${skillMatch.score}%
- Điểm kinh nghiệm: ${expMatch}%
- Kỹ năng phù hợp: ${matchingSkills.join(', ') || 'Không có'}
- Kỹ năng còn thiếu: ${missingSkills.join(', ') || 'Không có'}

Hãy đưa ra đánh giá ngắn gọn và thực tế. Trả lời bằng tiếng Việt. Return ONLY valid JSON (no markdown):
{
  "reason": "Một câu giải thích tại sao đây là sự phù hợp tốt/khá/kém",
  "strengths": ["điểm mạnh 1", "điểm mạnh 2", "điểm mạnh 3"],
  "concerns": ["lưu ý 1", "lưu ý 2"],
  "advice": "Một lời khuyên cụ thể và hành động được để ứng viên tăng cơ hội được chọn"
}`;

    try {
      const response = await AIService.generateContent(prompt);
      const cleanedResponse = AIService.cleanJsonResponse(response);
      return JSON.parse(cleanedResponse);
    } catch (error) {
      logger.error('AI match analysis failed:', error);
      return {
        reason: `${skillMatch.score}% skill match with ${candidate.experience_years || 0} years experience`,
        strengths: skillMatch.matching.slice(0, 3),
        concerns: skillMatch.missing.slice(0, 2),
      };
    }
  }

  /** Nhãn gợi ý theo khoảng điểm. */
  _getRecommendationType(score) {
    if (score >= 90) return 'perfect_match';
    if (score >= 75) return 'strong_match';
    if (score >= 60) return 'good_match';
    if (score >= 45) return 'possible_match';
    return 'weak_match';
  }

  /** Chuẩn hóa danh sách kỹ năng (JSON hoặc chuỗi phân tách phẩy). */
  _parseSkills(skillsData) {
    if (!skillsData) return [];
    if (Array.isArray(skillsData)) return skillsData;

    try {
      const parsed = JSON.parse(skillsData);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return skillsData
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s);
    }
  }

  /** Cache khớp còn trong hạn expires_at. */
  _isMatchValid(match) {
    if (!match.expires_at) return false;
    return new Date(match.expires_at) > new Date();
  }

  /** Trả về bản ghi khớp hoặc tính lại nếu chưa có. */
  async explainMatch(candidateId, jobId) {
    const match = await AIJobMatchRepository.findMatch(candidateId, jobId);

    if (!match) {
      return await this.calculateMatchScore(candidateId, jobId);
    }

    return match;
  }
}

module.exports = new JobMatchingService();
