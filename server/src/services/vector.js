const AIService = require('./ai');

/**
 * Vector: embedding và tìm kiếm tương đồng (cosine).
 * Quy mô nhỏ dùng tính tay; production có thể chuyển Pinecone/Weaviate.
 */
class VectorService {
  /** Độ tương đồng cosine giữa hai vector. */
  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
    if (magA === 0 || magB === 0) return 0;
    return dotProduct / (magA * magB);
  }

  /**
   * Generate embedding for a text
   */
  async generateEmbedding(text) {
    return await AIService.embedContent(text);
  }

  /**
   * Tìm top-K phần tử gần nhất với vector truy vấn (mỗi item có embedding).
   * @param {Array<number>} queryVector
   * @param {Array<Object>} items — phần tử có { id, embedding }
   * @param {number} topK
   */
  findMatches(queryVector, items, topK = 5) {
    const scoredItems = items
      .filter((item) => item.embedding && Array.isArray(item.embedding))
      .map((item) => ({
        ...item,
        score: this.cosineSimilarity(queryVector, item.embedding),
      }))
      .sort((a, b) => b.score - a.score);

    return scoredItems.slice(0, topK);
  }
}

module.exports = new VectorService();
