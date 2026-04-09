/**
 * Unit Tests — JobMatchingService scoring logic
 *
 * Mocks all external dependencies (DB, AI) so pure calculation functions
 * can be tested in isolation without needing a database or AI connection.
 */

// ── Mock all external dependencies BEFORE importing the service ──────────
jest.mock('../../src/config/database.config', () => ({
  pool: {
    query: jest.fn().mockResolvedValue([[]]),
  },
  connectDB: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/repositories/ai-job-match', () => ({
  findMatch: jest.fn().mockResolvedValue(null),
  upsert: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../src/repositories/candidate', () => ({
  findByIdWithSkills: jest.fn().mockResolvedValue(null),
  findAll: jest.fn().mockResolvedValue([]),
  findAllPaginated: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../src/repositories/job', () => ({
  findWithDetails: jest.fn().mockResolvedValue({ data: [], total: 0 }),
  findByIdWithDetails: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../src/repositories/resume-analysis', () => ({
  getLatest: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../src/services/ai', () => ({
  generateContent: jest.fn().mockResolvedValue('{}'),
  cleanJsonResponse: jest.fn((v) => v),
}));

// ── Now safe to import the service ───────────────────────────────────────
const jobMatchingService = require('../../src/services/job-matching');

// ─────────────────────────────────────────────────────────────────────────

describe('JobMatchingService — Scoring Functions', () => {
  // ─────────────────────────────────────────────
  // _calculateSkillMatch
  // ─────────────────────────────────────────────
  describe('_calculateSkillMatch', () => {
    test('returns 100% score when candidate has all required and preferred skills', () => {
      const candidateSkills = ['javascript', 'react', 'nodejs'];
      const required = ['javascript', 'react'];
      const preferred = ['nodejs'];
      const result = jobMatchingService._calculateSkillMatch(candidateSkills, required, preferred);
      expect(result.score).toBe(100);
      expect(result.matching).toContain('javascript');
      expect(result.missing).toHaveLength(0);
    });

    test('returns partial score when missing some required skills', () => {
      const candidateSkills = ['javascript'];
      const required = ['javascript', 'react', 'typescript'];
      const preferred = [];
      const result = jobMatchingService._calculateSkillMatch(candidateSkills, required, preferred);
      expect(result.score).toBeLessThan(60);
      expect(result.missing).toContain('react');
      expect(result.missing).toContain('typescript');
    });

    test('returns 100 when no requirements specified (defaults)', () => {
      const result = jobMatchingService._calculateSkillMatch(['react'], [], []);
      expect(result.score).toBe(100);
    });

    test('identifies extra skills beyond job requirements', () => {
      const candidateSkills = ['javascript', 'react', 'python', 'docker'];
      const required = ['javascript'];
      const preferred = ['react'];
      const result = jobMatchingService._calculateSkillMatch(candidateSkills, required, preferred);
      expect(result.extra).toContain('python');
      expect(result.extra).toContain('docker');
    });

    test('is case-insensitive for skill comparison', () => {
      const result = jobMatchingService._calculateSkillMatch(
        ['JavaScript', 'REACT'],
        ['javascript', 'react'],
        []
      );
      expect(result.matching).toHaveLength(2);
      expect(result.missing).toHaveLength(0);
    });
  });

  // ─────────────────────────────────────────────
  // _calculateExperienceMatch
  // ─────────────────────────────────────────────
  describe('_calculateExperienceMatch', () => {
    test('returns 100 when candidate meets minimum experience', () => {
      expect(jobMatchingService._calculateExperienceMatch(3, 2, 5)).toBe(100);
    });

    test('returns 100 when no minimum experience required', () => {
      expect(jobMatchingService._calculateExperienceMatch(0, 0, null)).toBe(100);
    });

    test('returns reduced score when candidate is underqualified by 2 years', () => {
      // 2 year gap → 100 - (2 * 15) = 70
      expect(jobMatchingService._calculateExperienceMatch(1, 3, 5)).toBe(70);
    });

    test('returns 0 when candidate is severely underqualified', () => {
      // 10 year gap → 100 - (10 * 15) = -50 → clamped to 0
      expect(jobMatchingService._calculateExperienceMatch(0, 10, null)).toBe(0);
    });

    test('returns 90 when candidate is overqualified', () => {
      expect(jobMatchingService._calculateExperienceMatch(10, 2, 5)).toBe(90);
    });
  });

  // ─────────────────────────────────────────────
  // _calculateEducationMatch (fixed — no longer a no-op)
  // ─────────────────────────────────────────────
  describe('_calculateEducationMatch', () => {
    test('returns 100 when no education level required', () => {
      expect(jobMatchingService._calculateEducationMatch(80, null)).toBe(100);
      expect(jobMatchingService._calculateEducationMatch(80, '')).toBe(100);
    });

    test('returns 100 when candidate score meets bachelor threshold (70)', () => {
      expect(jobMatchingService._calculateEducationMatch(80, 'bachelor')).toBe(100);
    });

    test('returns reduced score when candidate is below required level', () => {
      // candidate 50, bachelor threshold 70 → gap = 20 → 100 - 40 = 60
      expect(jobMatchingService._calculateEducationMatch(50, 'bachelor')).toBe(60);
    });

    test('returns 100 for PhD when candidate has perfect score', () => {
      expect(jobMatchingService._calculateEducationMatch(100, 'phd')).toBe(100);
    });

    test('returns 0 minimum, not negative', () => {
      // candidate 0, PhD threshold 95 → gap = 95 → 100 - 190 = -90 → clamped to 0
      expect(jobMatchingService._calculateEducationMatch(0, 'phd')).toBe(0);
    });

    test('handles unknown education levels with default threshold of 60', () => {
      // candidate 80 >= 60 → 100
      expect(jobMatchingService._calculateEducationMatch(80, 'vocational')).toBe(100);
    });
  });

  // ─────────────────────────────────────────────
  // _calculateLocationMatch
  // ─────────────────────────────────────────────
  describe('_calculateLocationMatch', () => {
    test('returns 100 for remote jobs regardless of location', () => {
      expect(jobMatchingService._calculateLocationMatch('Hanoi', 'Ho Chi Minh', 'remote')).toBe(
        100
      );
    });

    test('returns 100 for exact location match', () => {
      expect(jobMatchingService._calculateLocationMatch('hanoi', 'hanoi', 'fulltime')).toBe(100);
    });

    test('returns 70 when location is missing', () => {
      expect(jobMatchingService._calculateLocationMatch(null, null, 'fulltime')).toBe(70);
    });

    test('returns 50 for different locations', () => {
      expect(jobMatchingService._calculateLocationMatch('hanoi', 'ho chi minh', 'fulltime')).toBe(
        50
      );
    });
  });

  // ─────────────────────────────────────────────
  // _calculateOverallScore
  // ─────────────────────────────────────────────
  describe('_calculateOverallScore', () => {
    test('returns 100 when all component scores are 100', () => {
      expect(
        jobMatchingService._calculateOverallScore({
          skill: 100,
          experience: 100,
          education: 100,
          location: 100,
        })
      ).toBe(100);
    });

    test('returns 50 when only skill score is 100 (50% weight)', () => {
      expect(
        jobMatchingService._calculateOverallScore({
          skill: 100,
          experience: 0,
          education: 0,
          location: 0,
        })
      ).toBe(50);
    });

    test('returns rounded integer score', () => {
      const score = jobMatchingService._calculateOverallScore({
        skill: 75,
        experience: 60,
        education: 80,
        location: 90,
      });
      expect(Number.isInteger(score)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────
  // _getRecommendationType
  // ─────────────────────────────────────────────
  describe('_getRecommendationType', () => {
    test.each([
      [95, 'perfect_match'],
      [90, 'perfect_match'],
      [80, 'strong_match'],
      [75, 'strong_match'],
      [65, 'good_match'],
      [60, 'good_match'],
      [50, 'possible_match'],
      [45, 'possible_match'],
      [30, 'weak_match'],
    ])('score %i → "%s"', (score, expected) => {
      expect(jobMatchingService._getRecommendationType(score)).toBe(expected);
    });
  });

  // ─────────────────────────────────────────────
  // _parseSkills
  // ─────────────────────────────────────────────
  describe('_parseSkills', () => {
    test('returns empty array for null', () => {
      expect(jobMatchingService._parseSkills(null)).toEqual([]);
    });

    test('returns array as-is when already an array', () => {
      expect(jobMatchingService._parseSkills(['react', 'node'])).toEqual(['react', 'node']);
    });

    test('parses JSON string to array', () => {
      expect(jobMatchingService._parseSkills('["react","node"]')).toEqual(['react', 'node']);
    });

    test('parses comma-separated string as fallback', () => {
      expect(jobMatchingService._parseSkills('react, node, typescript')).toEqual([
        'react',
        'node',
        'typescript',
      ]);
    });
  });

  // ─────────────────────────────────────────────
  // _isMatchValid
  // ─────────────────────────────────────────────
  describe('_isMatchValid', () => {
    test('returns false when expires_at is missing', () => {
      expect(jobMatchingService._isMatchValid({})).toBe(false);
    });

    test('returns false when match is expired', () => {
      const past = new Date(Date.now() - 1000).toISOString();
      expect(jobMatchingService._isMatchValid({ expires_at: past })).toBe(false);
    });

    test('returns true when match is still valid', () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      expect(jobMatchingService._isMatchValid({ expires_at: future })).toBe(true);
    });
  });
});
