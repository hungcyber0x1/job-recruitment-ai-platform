const VectorService = require('../src/services/vector');

describe('VectorService', () => {
  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const vec = [1, 0, 1];
      expect(VectorService.cosineSimilarity(vec, vec)).toBeCloseTo(1);
    });

    it('should return 0 for orthogonal vectors', () => {
      const vecA = [1, 0];
      const vecB = [0, 1];
      expect(VectorService.cosineSimilarity(vecA, vecB)).toBe(0);
    });

    it('should return -1 for opposite vectors', () => {
      const vecA = [1, 1];
      const vecB = [-1, -1];
      expect(VectorService.cosineSimilarity(vecA, vecB)).toBeCloseTo(-1);
    });

    it('should handle zero magnitude vectors', () => {
      const vecA = [0, 0];
      const vecB = [1, 1];
      expect(VectorService.cosineSimilarity(vecA, vecB)).toBe(0);
    });
  });

  describe('findMatches', () => {
    it('should return top matched items based on score', () => {
      const query = [1, 0];
      const items = [
        { id: 1, embedding: [0.9, 0.1] },
        { id: 2, embedding: [0.1, 0.9] },
        { id: 3, embedding: [0.5, 0.5] },
      ];
      const matches = VectorService.findMatches(query, items, 2);
      expect(matches).toHaveLength(2);
      expect(matches[0].id).toBe(1);
      expect(matches[1].id).toBe(3);
    });
  });
});
