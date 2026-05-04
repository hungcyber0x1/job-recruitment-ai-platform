/**
 * Blog Model Schema
 *
 * Cung cấp JSDoc type definitions cho hệ thống không dùng ORM.
 * Table: blog_posts
 *
 * Cấu trúc mới:
 * - author_id: FK → users.id
 * - category_id: FK → categories.id (mới, thay cho cột category dạng string)
 * - author_type: admin/recruiter/candidate
 */

const { pool } = require('../config/database.config');

class BlogRepository {
  _row(row) {
    if (!row) return null;
    return {
      ...row,
    };
  }

  _publicVisibilityClause() {
    return `bp.status = 'published'
      AND (bp.deleted_at IS NULL)
      AND (bp.scheduled_at IS NULL OR bp.scheduled_at <= NOW())`;
  }

  _publicPublishedAtExpression() {
    return 'COALESCE(bp.published_at, bp.updated_at, bp.created_at)';
  }

  _parseTags(value) {
    if (!value) return [];
    let parsed = value;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        parsed = parsed.split(',');
      }
    }
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.map((tag) => String(tag || '').trim()).filter(Boolean))];
  }

  _normalizeBooleanFilter(value) {
    return value === true || value === 1 || value === '1' || value === 'true';
  }

  async findPublished({
    category,
    tag,
    search,
    sort = 'newest',
    featured,
    limit = 500,
    offset = 0,
  }) {
    const publicPublishedAt = this._publicPublishedAtExpression();
    let sql = `
      SELECT bp.id, bp.slug, bp.title, bp.excerpt, bp.thumbnail_url, bp.featured_image, bp.view_count,
             bp.is_featured, bp.tags, bp.status, bp.published_at,
             ${publicPublishedAt} AS public_published_at, bp.author_type,
             TRIM(CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,''))) AS author_name,
             u.avatar_url AS author_avatar,
             cp.company_name AS company_name,
             c.name AS category_name,
             c.slug AS category_slug
      FROM blog_posts bp
      LEFT JOIN users u ON u.id = bp.author_id
      LEFT JOIN company_profiles cp ON bp.author_type = 'recruiter' AND cp.user_id = bp.author_id
      LEFT JOIN categories c ON c.id = bp.category_id
      WHERE ${this._publicVisibilityClause()}
    `;
    const params = [];

    if (category && category !== 'Tất cả' && category !== 'all') {
      sql += ' AND (c.slug = ? OR c.name = ?)';
      params.push(category, category);
    }
    if (tag && tag.trim()) {
      sql += ' AND JSON_CONTAINS(bp.tags, JSON_QUOTE(?))';
      params.push(tag.trim());
    }
    if (this._normalizeBooleanFilter(featured)) {
      sql += ' AND bp.is_featured = 1';
    }
    if (search && search.trim()) {
      sql += ' AND (bp.title LIKE ? OR bp.excerpt LIKE ?)';
      const t = `%${search.trim()}%`;
      params.push(t, t);
    }
    if (sort === 'popular') {
      sql += ` ORDER BY bp.view_count DESC, ${publicPublishedAt} DESC`;
    } else if (sort === 'oldest') {
      sql += ` ORDER BY ${publicPublishedAt} ASC`;
    } else if (sort === 'featured') {
      sql += ` ORDER BY bp.is_featured DESC, ${publicPublishedAt} DESC`;
    } else {
      sql += ` ORDER BY ${publicPublishedAt} DESC`;
    }
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(sql, params);
    return rows.map((r) => this._row(r));
  }

  async findBySlugForPublic(slug) {
    const publicPublishedAt = this._publicPublishedAtExpression();
    const [rows] = await pool.query(
      `SELECT bp.*,
              ${publicPublishedAt} AS public_published_at,
              TRIM(CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,''))) AS author_name,
              u.avatar_url AS author_avatar,
              cp.company_name AS company_name,
              c.name AS category_name,
              c.slug AS category_slug
       FROM blog_posts bp
       LEFT JOIN users u ON u.id = bp.author_id
       LEFT JOIN company_profiles cp ON bp.author_type = 'recruiter' AND cp.user_id = bp.author_id
       LEFT JOIN categories c ON c.id = bp.category_id
       WHERE bp.slug = ? AND ${this._publicVisibilityClause()}`,
      [slug]
    );
    return this._row(rows[0]);
  }

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT bp.*,
              TRIM(CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,''))) AS author_name,
              u.avatar_url AS author_avatar
       FROM blog_posts bp
       LEFT JOIN users u ON u.id = bp.author_id
       WHERE bp.id = ?`,
      [id]
    );
    return this._row(rows[0]);
  }

  async countPublished({ category, tag, search, featured }) {
    let sql = `
      SELECT COUNT(*) AS c FROM blog_posts bp
      LEFT JOIN categories c ON c.id = bp.category_id
      WHERE ${this._publicVisibilityClause()}
    `;
    const params = [];
    if (category && category !== 'Tất cả' && category !== 'all') {
      sql += ' AND (c.slug = ? OR c.name = ?)';
      params.push(category, category);
    }
    if (tag && tag.trim()) {
      sql += ' AND JSON_CONTAINS(bp.tags, JSON_QUOTE(?))';
      params.push(tag.trim());
    }
    if (this._normalizeBooleanFilter(featured)) {
      sql += ' AND bp.is_featured = 1';
    }
    if (search && search.trim()) {
      sql += ' AND (bp.title LIKE ? OR bp.excerpt LIKE ?)';
      const t = `%${search.trim()}%`;
      params.push(t, t);
    }
    const [rows] = await pool.query(sql, params);
    return rows[0].c;
  }

  _adminListWhereClause({ search, authorType, status, flagged }) {
    let sql = `
      FROM blog_posts bp
      LEFT JOIN users u ON u.id = bp.author_id
      LEFT JOIN company_profiles cp ON bp.author_type = 'recruiter' AND cp.user_id = bp.author_id
      LEFT JOIN categories c ON c.id = bp.category_id
      WHERE 1=1
    `;
    const params = [];
    if (authorType === 'admin' || authorType === 'recruiter' || authorType === 'candidate') {
      sql += ' AND bp.author_type = ?';
      params.push(authorType);
    }
    if (status && status !== 'all') {
      sql += ' AND bp.status = ?';
      params.push(status);
    }
    if (flagged === true) {
      sql += ' AND bp.is_flagged = 1';
    }
    if (search && search.trim()) {
      const t = `%${search.trim()}%`;
      sql += ` AND (
        bp.title LIKE ? OR bp.slug LIKE ? OR bp.excerpt LIKE ?
        OR c.name LIKE ?
        OR cp.company_name LIKE ?
        OR TRIM(CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,''))) LIKE ?
      )`;
      params.push(t, t, t, t, t, t);
    }
    return { sql, params };
  }

  async countAllAdmin({ search, authorType, status, flagged }) {
    const { sql: whereSql, params } = this._adminListWhereClause({
      search,
      authorType,
      status,
      flagged,
    });
    const sql = `SELECT COUNT(*) AS c ${whereSql}`;
    const [rows] = await pool.query(sql, params);
    return Number(rows[0]?.c) || 0;
  }

  async findAllAdmin({ search, authorType, status, flagged, limit = 1000, offset = 0 }) {
    const { sql: whereSql, params: whereParams } = this._adminListWhereClause({
      search,
      authorType,
      status,
      flagged,
    });
    let sql = `
      SELECT bp.*,
             TRIM(CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,''))) AS author_name,
             cp.company_name AS company_name,
             c.name as category_name
      ${whereSql}
    `;
    const params = [...whereParams];
    sql += ' ORDER BY bp.updated_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const [rows] = await pool.query(sql, params);
    return rows.map((r) => this._row(r));
  }

  async findByAuthor(authorId, { limit = 50, offset = 0 }) {
    const [rows] = await pool.query(
      `SELECT bp.*,
              TRIM(CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,''))) AS author_name,
              c.name as category_name
       FROM blog_posts bp
       JOIN users u ON u.id = bp.author_id
       LEFT JOIN categories c ON c.id = bp.category_id
       WHERE bp.author_id = ?
       ORDER BY bp.updated_at DESC
       LIMIT ? OFFSET ?`,
      [authorId, limit, offset]
    );
    return rows.map((r) => this._row(r));
  }

  /**
   * Find all blog posts for a specific company (employer/recruiter)
   */
  async findByCompany(companyId, { limit = 100, offset = 0 }) {
    const [rows] = await pool.query(
      `SELECT bp.*,
              TRIM(CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,''))) AS author_name,
              c.name as category_name
       FROM blog_posts bp
       LEFT JOIN users u ON u.id = bp.author_id
       LEFT JOIN categories c ON c.id = bp.category_id
       WHERE bp.company_id = ?
       ORDER BY bp.updated_at DESC
       LIMIT ? OFFSET ?`,
      [companyId, limit, offset]
    );
    return rows.map((r) => this._row(r));
  }

  async findPublicTaxonomy() {
    const [categoryRows] = await pool.query(`
      SELECT DISTINCT c.id, c.name, c.slug
      FROM blog_posts bp
      JOIN categories c ON c.id = bp.category_id
      WHERE ${this._publicVisibilityClause()}
        AND c.is_active = 1
        AND c.deleted_at IS NULL
      ORDER BY c.name ASC
    `);

    const [tagRows] = await pool.query(`
      SELECT bp.tags
      FROM blog_posts bp
      WHERE ${this._publicVisibilityClause()}
        AND bp.tags IS NOT NULL
    `);

    const tagCounts = new Map();
    for (const row of tagRows) {
      for (const tag of this._parseTags(row.tags)) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    return {
      categories: categoryRows.map((row) => this._row(row)),
      tags: [...tagCounts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi')),
    };
  }

  async countAll() {
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM blog_posts');
    return rows[0].total;
  }

  async countByStatus(status) {
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM blog_posts WHERE status = ?', [
      status,
    ]);
    return rows[0].total;
  }

  async countFlagged() {
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM blog_posts WHERE flagged = 1');
    return rows[0].total;
  }

  async slugExists(slug, excludeId = null) {
    let sql = 'SELECT id FROM blog_posts WHERE slug = ?';
    const params = [slug];
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    const [rows] = await pool.query(sql, params);
    return rows.length > 0;
  }

  async create(data) {
    const {
      slug,
      title,
      excerpt,
      content,
      thumbnail_url,
      featured_image,
      image_url,
      category_id,
      author_type,
      author_id,
      company_id,
      status,
      is_published,
      published_at,
      tags,
      seo_title,
      seo_description,
    } = data;
    const [result] = await pool.query(
      `INSERT INTO blog_posts
        (slug, title, excerpt, content, thumbnail_url, featured_image, category_id,
         author_type, author_id, company_id, status, is_published, published_at,
         tags, seo_title, seo_description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slug,
        title,
        excerpt || null,
        content || null,
        thumbnail_url || image_url || null,
        featured_image || null,
        category_id || null,
        author_type,
        author_id,
        company_id || null,
        status || 'draft',
        is_published ? 1 : 0,
        published_at || null,
        tags ? JSON.stringify(tags) : null,
        seo_title || null,
        seo_description || null,
      ]
    );
    return result.insertId;
  }

  async update(id, data) {
    if (data.image_url !== undefined && data.thumbnail_url === undefined) {
      data.thumbnail_url = data.image_url;
    }

    const fields = [];
    const vals = [];
    const map = [
      'slug',
      'title',
      'excerpt',
      'content',
      'thumbnail_url',
      'featured_image',
      'category_id',
      'company_id',
      'status',
      'is_published',
      'is_featured',
      'is_flagged',
      'rejection_reason',
      'scheduled_at',
      'published_at',
      'tags',
      'seo_title',
      'seo_description',
    ];
    for (const k of map) {
      if (data[k] !== undefined) {
        fields.push(`${k} = ?`);
        const v = data[k];
        if (k === 'tags') vals.push(v ? JSON.stringify(v) : null);
        else if (k === 'is_published' || k === 'is_featured' || k === 'is_flagged')
          vals.push(v ? 1 : 0);
        else vals.push(v);
      }
    }
    if (!fields.length) return 0;
    vals.push(id);
    const [result] = await pool.query(
      `UPDATE blog_posts SET ${fields.join(', ')} WHERE id = ?`,
      vals
    );
    return result.affectedRows;
  }

  async delete(id) {
    const [result] = await pool.query('DELETE FROM blog_posts WHERE id = ?', [id]);
    return result.affectedRows;
  }

  async softDelete(id) {
    const [result] = await pool.query('UPDATE blog_posts SET deleted_at = NOW() WHERE id = ?', [
      id,
    ]);
    return result.affectedRows;
  }

  async bulkDeleteByCompany(companyId) {
    const [result] = await pool.query(
      "UPDATE blog_posts SET deleted_at = NOW(), status = 'archived' WHERE company_id = ? AND deleted_at IS NULL",
      [companyId]
    );
    return result.affectedRows;
  }

  async restore(id) {
    const [result] = await pool.query('UPDATE blog_posts SET deleted_at = NULL WHERE id = ?', [id]);
    return result.affectedRows;
  }

  async incrementViewCount(id) {
    await pool.query('UPDATE blog_posts SET view_count = view_count + 1 WHERE id = ?', [id]);
  }
}

module.exports = new BlogRepository();
