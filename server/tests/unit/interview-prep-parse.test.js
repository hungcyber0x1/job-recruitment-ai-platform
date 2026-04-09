/**
 * Kiểm tra parse an toàn ideal_answer_points (tránh crash khi DB/AI trả non-array).
 * Gọi qua prototype vì service export singleton.
 */
const interviewPrep = require('../../src/services/interview-prep');

describe('InterviewPrepService._parseIdealAnswerPointsArray', () => {
  const parse = (v) => interviewPrep._parseIdealAnswerPointsArray(v);

  it('returns [] for null/undefined/empty string', () => {
    expect(parse(null)).toEqual([]);
    expect(parse(undefined)).toEqual([]);
    expect(parse('')).toEqual([]);
  });

  it('returns array as-is', () => {
    expect(parse(['a', 'b'])).toEqual(['a', 'b']);
  });

  it('parses valid JSON array string', () => {
    expect(parse('["x","y"]')).toEqual(['x', 'y']);
  });

  it('returns [] for invalid JSON string', () => {
    expect(parse('not-json')).toEqual([]);
  });

  it('returns [] for JSON object (not array)', () => {
    expect(parse('{"a":1}')).toEqual([]);
  });

  it('returns [] for plain object from driver', () => {
    expect(parse({ a: 1 })).toEqual([]);
  });
});
