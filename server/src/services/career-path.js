const AIService = require('./ai');
const CareerPathRepository = require('../repositories/career-path');
const SkillGapRepository = require('../repositories/skill-gap');
const CandidateRepository = require('../repositories/candidate');
// const JobRepository = require('../repositories/job');
const logger = require('../utils/logger');

/**
 * Service for AI-powered Career Path Planning
 * Generates personalized career roadmaps and tracks progress
 */
class CareerPathService {
  /**
   * Generate a personalized career path
   */
  async generateCareerPath(candidateId, targetRole) {
    try {
      // Get candidate data
      const candidate = await CandidateRepository.findByIdWithSkills(candidateId);
      if (!candidate) throw new Error('Candidate not found');

      const currentRole = candidate.current_job_title || 'Current Position';
      const currentSkills = (candidate.skills || []).map((s) => s.name || s);
      const experienceYears = candidate.experience_years || 0;

      logger.info(
        `Generating career path for candidate ${candidateId}: ${currentRole} → ${targetRole}`
      );

      // Get market data for target role
      const marketData = await this._getMarketDataForRole(targetRole);

      // AI generates career path
      const careerPath = await this._generatePathWithAI(
        currentRole,
        targetRole,
        currentSkills,
        experienceYears,
        marketData
      );

      // Save to database
      const saved = await CareerPathRepository.create({
        candidate_id: candidateId,
        current_role: currentRole,
        target_role: targetRole,
        timeline_months: careerPath.timeline_months,
        milestones: careerPath.milestones,
        skills_to_acquire: careerPath.skills_to_acquire,
        recommended_jobs: careerPath.recommended_jobs,
        intermediate_roles: careerPath.intermediate_roles,
        ai_confidence: careerPath.ai_confidence,
      });

      // Generate skill gap analysis
      await this._generateSkillGapAnalysis(
        candidateId,
        currentSkills,
        careerPath.skills_to_acquire
      );

      logger.info(`Career path generated successfully for candidate ${candidateId}`);

      return saved;
    } catch (error) {
      logger.error('Career path generation error:', error);
      throw new Error('Failed to generate career path');
    }
  }

  /**
   * Generate career path using AI
   */
  async _generatePathWithAI(currentRole, targetRole, currentSkills, experienceYears, marketData) {
    const prompt = `Create a personalized career development path:

Current Situation:
- Current Role: ${currentRole}
- Current Skills: ${currentSkills.join(', ') || 'Not specified'}
- Experience: ${experienceYears} years

Target Role: ${targetRole}

Market Data for ${targetRole}:
- Common Skills Required: ${marketData.common_skills.join(', ')}
- Average Experience Needed: ${marketData.avg_experience} years
- Key Competencies: ${marketData.competencies.join(', ')}

Generate a realistic career development path. Return ONLY valid JSON (no markdown):
{
  "timeline_months": <number>,
  "milestones": [
    {
      "stage": "Stage 1: <name>",
      "duration_months": <number>,
      "goal": "<what to achieve>",
      "skills_to_learn": ["skill1", "skill2"],
      "actions": ["action1", "action2"]
    }
  ],
  "skills_to_acquire": ["skill1", "skill2"],
  "intermediate_roles": ["role1", "role2"],
  "recommended_jobs": [],
  "ai_confidence": <0-100>
}`;

    try {
      const response = await AIService.generateContent(prompt);
      const cleanedResponse = this._cleanJsonResponse(response);
      const parsed = JSON.parse(cleanedResponse);

      return {
        timeline_months: parsed.timeline_months || 12,
        milestones: parsed.milestones || [],
        skills_to_acquire: parsed.skills_to_acquire || [],
        recommended_jobs: parsed.recommended_jobs || [],
        intermediate_roles: parsed.intermediate_roles || [],
        ai_confidence: parsed.ai_confidence || 70,
      };
    } catch (error) {
      logger.error('AI career path generation failed:', error);
      // Return a basic fallback path
      return {
        timeline_months: 12,
        milestones: [
          {
            stage: 'Stage 1: Skill Development',
            duration_months: 6,
            goal: `Build skills for ${targetRole}`,
            skills_to_learn: marketData.common_skills.slice(0, 3),
            actions: ['Take online courses', 'Work on projects', 'Network with professionals'],
          },
        ],
        skills_to_acquire: marketData.common_skills,
        recommended_jobs: [],
        intermediate_roles: [],
        ai_confidence: 60,
      };
    }
  }

  /**
   * Get market data for a role
   */
  async _getMarketDataForRole(roleTitle) {
    // In production, this would query actual market data
    // For now, we'll use AI to generate insights

    const prompt = `Provide market insights for the role: ${roleTitle}

Return ONLY valid JSON (no markdown):
{
  "common_skills": ["skill1", "skill2", "skill3"],
  "avg_experience": <number of years>,
  "competencies": ["competency1", "competency2"],
  "certifications": ["cert1", "cert2"]
}`;

    try {
      const response = await AIService.generateContent(prompt);
      const cleanedResponse = this._cleanJsonResponse(response);
      return JSON.parse(cleanedResponse);
    } catch (error) {
      logger.error('Failed to get market data:', error);
      return {
        common_skills: ['Communication', 'Problem Solving', 'Technical Skills'],
        avg_experience: 3,
        competencies: ['Leadership', 'Collaboration'],
        certifications: [],
      };
    }
  }

  /**
   * Generate skill gap analysis
   */
  async _generateSkillGapAnalysis(candidateId, currentSkills, requiredSkills) {
    const currentSet = new Set(currentSkills.map((s) => s.toLowerCase()));
    const requiredSet = new Set(requiredSkills.map((s) => s.toLowerCase()));

    const missingSkills = [...requiredSet].filter((s) => !currentSet.has(s));
    const matchingSkills = [...requiredSet].filter((s) => currentSet.has(s));

    if (missingSkills.length === 0) {
      logger.info('No skill gaps identified');
      return null;
    }

    // Generate learning paths for missing skills
    const learningPaths = await this._generateLearningPaths(missingSkills);

    // Calculate priority score
    const priorityScore = this._calculatePriorityScore(missingSkills.length, requiredSkills.length);

    // Estimate learning time
    const estimatedWeeks = missingSkills.length * 4; // Rough estimate: 4 weeks per skill

    await SkillGapRepository.create({
      candidate_id: candidateId,
      job_id: null,
      target_role: null,
      required_skills: requiredSkills,
      missing_skills: missingSkills,
      matching_skills: matchingSkills,
      learning_paths: learningPaths,
      priority_score: priorityScore,
      estimated_learning_time_weeks: estimatedWeeks,
    });

    return {
      missing_skills: missingSkills,
      learning_paths: learningPaths,
    };
  }

  /**
   * Generate learning paths for skills
   */
  async _generateLearningPaths(missingSkills) {
    const prompt = `For each of these skills, suggest how to learn it:

Skills: ${missingSkills.join(', ')}

For each skill, provide:
- Recommended learning resources (courses, books, platforms)
- Estimated time to learn
- Free vs paid options

Return ONLY valid JSON array (no markdown):
[
  {
    "skill": "skill name",
    "resources": ["resource1", "resource2"],
    "estimated_weeks": <number>,
    "free_options": ["option1"],
    "paid_options": ["option1"]
  }
]`;

    try {
      const response = await AIService.generateContent(prompt);
      const cleanedResponse = this._cleanJsonResponse(response);
      return JSON.parse(cleanedResponse);
    } catch (error) {
      logger.error('Failed to generate learning paths:', error);
      return missingSkills.map((skill) => ({
        skill,
        resources: ['Online courses', 'Documentation', 'Practice projects'],
        estimated_weeks: 4,
        free_options: ['YouTube tutorials', 'Free courses'],
        paid_options: ['Udemy', 'Coursera'],
      }));
    }
  }

  /**
   * Calculate priority score for skill gaps
   */
  _calculatePriorityScore(missingCount, totalRequired) {
    const gapPercentage = (missingCount / totalRequired) * 100;

    if (gapPercentage >= 70) return 5; // Critical
    if (gapPercentage >= 50) return 4; // High
    if (gapPercentage >= 30) return 3; // Medium
    if (gapPercentage >= 15) return 2; // Low
    return 1; // Very low
  }

  /**
   * Get career path for candidate
   */
  async getCareerPath(candidateId) {
    return await CareerPathRepository.getLatest(candidateId);
  }

  /**
   * Get skill gaps for candidate
   */
  async getSkillGaps(candidateId) {
    return await SkillGapRepository.findByCandidate(candidateId);
  }

  /**
   * Track progress on career path
   */
  async updateProgress(pathId, milestoneUpdates) {
    // Implementation for updating milestone progress
    return await CareerPathRepository.update(pathId, milestoneUpdates);
  }

  /**
   * Clean JSON response
   */
  _cleanJsonResponse(response) {
    let cleaned = response.trim();
    cleaned = cleaned.replace(/```json\s*/g, '');
    cleaned = cleaned.replace(/```\s*/g, '');

    const jsonStart = cleaned.search(/[{[]/);
    const jsonEnd = cleaned.search(/[\]}]\s*$/) + 1;

    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      cleaned = cleaned.substring(jsonStart, jsonEnd);
    }

    return cleaned;
  }
}

module.exports = new CareerPathService();
