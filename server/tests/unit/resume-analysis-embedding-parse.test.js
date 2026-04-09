/**
 * Parse an toàn embedding cho job match (tránh crash khi DB trả string/Buffer hỏng).
 * Gọi qua prototype vì service export singleton.
 */
const resumeAnalysis = require('../../src/services/resume-analysis');

describe('ResumeAnalysisService._parseEmbeddingVector', () => {
  const parse = (v) => resumeAnalysis._parseEmbeddingVector(v);

  it('returns null for null/undefined/whitespace string', () => {
    expect(parse(null)).toBeNull();
    expect(parse(undefined)).toBeNull();
    expect(parse('')).toBeNull();
    expect(parse('   ')).toBeNull();
  });

  it('accepts finite number array', () => {
    expect(parse([0, 0.5, 1])).toEqual([0, 0.5, 1]);
  });

  it('parses valid JSON array string', () => {
    expect(parse('[0,1,2]')).toEqual([0, 1, 2]);
  });

  it('parses UTF-8 Buffer of JSON array', () => {
    expect(parse(Buffer.from('[0.1,0.2]', 'utf8'))).toEqual([0.1, 0.2]);
  });

  it('returns null for invalid JSON string', () => {
    expect(parse('{not valid')).toBeNull();
    expect(parse('not-json')).toBeNull();
  });

  it('returns null for non-numeric elements', () => {
    expect(parse([1, 'x'])).toBeNull();
    expect(parse([NaN])).toBeNull();
  });

  it('returns null for empty array', () => {
    expect(parse([])).toBeNull();
  });
});

describe('ResumeAnalysisService._normalizeJobMatchLlmResult', () => {
  const norm = (parsed, semantic) => resumeAnalysis._normalizeJobMatchLlmResult(parsed, semantic);

  it('fills safe defaults when parsed is null', () => {
    const r = norm(null, 0);
    expect(r.llm_match_score).toBe(0);
    expect(r.matching_skills).toEqual([]);
    expect(r.reasoning).toContain('thử lại');
  });

  it('uses semantic fallback reasoning when semanticScore > 0 and parse failed', () => {
    const r = norm(null, 50);
    expect(r.reasoning).toContain('tương đồng');
  });

  it('clamps score and normalizes arrays', () => {
    const r = norm(
      {
        llm_match_score: 999,
        reasoning: ' ok ',
        matching_skills: ['a'],
        missing_skills: null,
        strengths: [1],
        gaps: 'x',
        recommendations: [],
      },
      0
    );
    expect(r.llm_match_score).toBe(100);
    expect(r.reasoning).toBe('ok');
    expect(r.matching_skills).toEqual(['a']);
    expect(r.missing_skills).toEqual([]);
    expect(r.strengths).toEqual(['1']);
    expect(r.gaps).toEqual([]);
  });
});
