/**
 * Skill Model Schema — see migration 049_reset_complete_schema.sql
 */

/**
 * @typedef {Object} SkillRow
 * @property {number} id
 * @property {string} name
 * @property {string} slug
 * @property {number|null} category_id
 * @property {number} is_active
 */

const TABLE_NAME = 'skills';

module.exports = { TABLE_NAME };

const BaseRepository = require('./Base');
const { slugify } = require('../utils/stringHelper');

class SkillRepository extends BaseRepository {
  constructor() {
    super('skills');
  }

  async findByName(name) {
    const [rows] = await this.pool.query('SELECT * FROM skills WHERE name = ?', [name]);
    return rows[0];
  }

  async findByCandidateId(candidateId) {
    const query = `
      SELECT s.*
      FROM skills s
      JOIN candidate_skills cs ON s.id = cs.skill_id
      WHERE cs.candidate_id = ?
    `;
    const [rows] = await this.pool.query(query, [candidateId]);
    return rows;
  }

  async slugExists(slug, excludeId = null) {
    const sql =
      excludeId == null
        ? 'SELECT id FROM skills WHERE slug = ? LIMIT 1'
        : 'SELECT id FROM skills WHERE slug = ? AND id <> ? LIMIT 1';
    const params = excludeId == null ? [slug] : [slug, excludeId];
    const [rows] = await this.pool.query(sql, params);
    return Boolean(rows[0]);
  }

  async ensureUniqueSlug(source, excludeId = null) {
    const baseSlug = slugify(String(source || '').trim()) || 'skill';
    let candidate = baseSlug;
    let suffix = 1;

    while (await this.slugExists(candidate, excludeId)) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  async resolveCategoryId(categoryInput) {
    if (categoryInput === undefined) return undefined;
    if (categoryInput === null || categoryInput === '') return null;

    const numericValue = Number(categoryInput);
    if (Number.isFinite(numericValue) && numericValue > 0) {
      return numericValue;
    }

    const raw = String(categoryInput).trim();
    if (!raw) return null;

    const [rows] = await this.pool.query(
      'SELECT id FROM categories WHERE name = ? OR slug = ? LIMIT 1',
      [raw, slugify(raw)]
    );

    return rows[0]?.id ?? null;
  }

  buildDetailedQuery(whereSql = 's.is_active = 1') {
    return `
      SELECT
        s.id,
        s.name,
        s.slug,
        s.category_id,
        s.is_active,
        s.created_at,
        s.updated_at,
        c.name AS category_name,
        c.name AS category,
        COUNT(DISTINCT js.job_id) AS job_count,
        COUNT(DISTINCT cs.candidate_id) AS candidate_count
      FROM skills s
      LEFT JOIN categories c ON c.id = s.category_id
      LEFT JOIN job_skills js ON js.skill_id = s.id
      LEFT JOIN candidate_skills cs ON cs.skill_id = s.id
      WHERE ${whereSql}
      GROUP BY
        s.id,
        s.name,
        s.slug,
        s.category_id,
        s.is_active,
        s.created_at,
        s.updated_at,
        c.name
      ORDER BY s.is_active DESC, s.name ASC
    `;
  }

  async findAll(options = {}) {
    const whereClauses = ['1 = 1'];
    const params = [];

    if (options.includeInactive !== true) {
      whereClauses.push('s.is_active = 1');
    }

    if (options.search) {
      whereClauses.push('s.name LIKE ?');
      params.push(`%${options.search}%`);
    }

    const [rows] = await this.pool.query(
      this.buildDetailedQuery(whereClauses.join(' AND ')),
      params
    );

    return rows;
  }

  async findById(id, options = {}) {
    const whereSql =
      options.includeInactive === true ? 's.id = ?' : 's.id = ? AND s.is_active = 1';
    const [rows] = await this.pool.query(`${this.buildDetailedQuery(whereSql)} LIMIT 1`, [id]);
    return rows[0];
  }

  async createManaged(data = {}) {
    const name = String(data.name || '').trim();
    const slug = await this.ensureUniqueSlug(data.slug || name);
    const resolvedCategoryId =
      data.category_id !== undefined
        ? await this.resolveCategoryId(data.category_id)
        : await this.resolveCategoryId(data.category);
    const categoryId = resolvedCategoryId === undefined ? null : resolvedCategoryId;
    const isActive =
      data.is_active === undefined || data.is_active === null ? 1 : Number(Boolean(data.is_active));

    const id = await super.create({
      name,
      slug,
      category_id: categoryId,
      is_active: isActive,
    });

    return this.findById(id, { includeInactive: true });
  }

  async updateManaged(id, data = {}) {
    const existing = await this.findById(id, { includeInactive: true });
    if (!existing) return null;

    const nextName = String(data.name ?? existing.name ?? '').trim();
    const nextSlug = await this.ensureUniqueSlug(
      data.slug || (data.name ? nextName : existing.slug || existing.name),
      id
    );

    let nextCategoryId = existing.category_id ?? null;
    if (data.category_id !== undefined) {
      nextCategoryId = await this.resolveCategoryId(data.category_id);
    } else if (data.category !== undefined) {
      nextCategoryId = await this.resolveCategoryId(data.category);
    }

    const nextIsActive =
      data.is_active !== undefined
        ? Number(Boolean(data.is_active))
        : Number(existing.is_active ?? 1);

    await this.pool.query(
      `
        UPDATE skills
        SET name = ?, slug = ?, category_id = ?, is_active = ?
        WHERE id = ?
      `,
      [nextName, nextSlug, nextCategoryId, nextIsActive, id]
    );

    return this.findById(id, { includeInactive: true });
  }

  async addSkillToCandidate(candidateId, skillId) {
    const query = 'INSERT IGNORE INTO candidate_skills (candidate_id, skill_id) VALUES (?, ?)';
    await this.pool.query(query, [candidateId, skillId]);
  }

  async removeSkillsFromCandidate(candidateId) {
    await this.pool.query('DELETE FROM candidate_skills WHERE candidate_id = ?', [candidateId]);
  }
}

module.exports = new SkillRepository();
