const { pool } = require('../config/database.config');

class BlogRepository {
  _row(row) {
    if (!row) return null;
    return {
      ...row,
      is_published: Boolean(row.is_published),
    };
  }

  async findPublished({ category, search, sort = 'newest', limit = 500, offset = 0 }) {
    let sql = `
      SELECT bp.id, bp.slug, bp.title, bp.excerpt, bp.image_url, bp.category,
             bp.author_type, bp.published_at AS published_at, bp.view_count,
             TRIM(CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,''))) AS author_name,
             e.company_name AS company_name
      FROM blog_posts bp
      LEFT JOIN users u ON u.id = bp.author_user_id
      LEFT JOIN employers e ON e.id = bp.employer_id
      WHERE bp.is_published = 1 AND bp.published_at IS NOT NULL
    `;
    const params = [];

    if (category && category !== 'Tất cả' && category !== 'all') {
      sql += ' AND bp.category = ?';
      params.push(category);
    }
    if (search && search.trim()) {
      sql += ' AND (bp.title LIKE ? OR bp.excerpt LIKE ?)';
      const t = `%${search.trim()}%`;
      params.push(t, t);
    }
    if (sort === 'popular') {
      sql += ' ORDER BY bp.view_count DESC, bp.published_at DESC';
    } else if (sort === 'oldest') {
      sql += ' ORDER BY bp.published_at ASC';
    } else {
      sql += ' ORDER BY bp.published_at DESC';
    }
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(sql, params);
    return rows.map((r) => this._row(r));
  }

  async findBySlugForPublic(slug) {
    const [rows] = await pool.query(
      `SELECT bp.*,
              TRIM(CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,''))) AS author_name,
              u.avatar_url AS author_avatar,
              e.company_name AS company_name
       FROM blog_posts bp
       LEFT JOIN users u ON u.id = bp.author_user_id
       LEFT JOIN employers e ON e.id = bp.employer_id
       WHERE bp.slug = ? AND bp.is_published = 1 AND bp.published_at IS NOT NULL`,
      [slug]
    );
    return this._row(rows[0]);
  }

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT bp.*,
              CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,'')) AS author_name
       FROM blog_posts bp
       LEFT JOIN users u ON u.id = bp.author_user_id
       WHERE bp.id = ?`,
      [id]
    );
    return this._row(rows[0]);
  }

  async countPublished({ category, search }) {
    let sql =
      'SELECT COUNT(*) AS c FROM blog_posts bp WHERE bp.is_published = 1 AND bp.published_at IS NOT NULL';
    const params = [];
    if (category && category !== 'Tất cả' && category !== 'all') {
      sql += ' AND bp.category = ?';
      params.push(category);
    }
    if (search && search.trim()) {
      sql += ' AND (bp.title LIKE ? OR bp.excerpt LIKE ?)';
      const t = `%${search.trim()}%`;
      params.push(t, t);
    }
    const [rows] = await pool.query(sql, params);
    return rows[0].c;
  }

  _adminListWhereClause({ search, authorType }) {
    let sql = `
      FROM blog_posts bp
      LEFT JOIN users u ON u.id = bp.author_user_id
      LEFT JOIN employers e ON e.id = bp.employer_id
      WHERE 1=1
    `;
    const params = [];
    if (authorType === 'admin' || authorType === 'employer') {
      sql += ' AND bp.author_type = ?';
      params.push(authorType);
    }
    if (search && search.trim()) {
      const t = `%${search.trim()}%`;
      sql += ` AND (
        bp.title LIKE ? OR bp.slug LIKE ? OR bp.excerpt LIKE ?
        OR bp.category LIKE ?
        OR e.company_name LIKE ?
        OR TRIM(CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,''))) LIKE ?
      )`;
      params.push(t, t, t, t, t, t);
    }
    return { sql, params };
  }

  async countAllAdmin({ search, authorType }) {
    const { sql: whereSql, params } = this._adminListWhereClause({ search, authorType });
    const sql = `SELECT COUNT(*) AS c ${whereSql}`;
    const [rows] = await pool.query(sql, params);
    return Number(rows[0]?.c) || 0;
  }

  async findAllAdmin({ search, authorType, limit = 1000, offset = 0 }) {
    const { sql: whereSql, params: whereParams } = this._adminListWhereClause({
      search,
      authorType,
    });
    let sql = `
      SELECT bp.*,
             TRIM(CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,''))) AS author_name,
             e.company_name AS company_name
      ${whereSql}
    `;
    const params = [...whereParams];
    sql += ' ORDER BY bp.updated_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const [rows] = await pool.query(sql, params);
    return rows.map((r) => this._row(r));
  }

  async findByEmployer(employerId, { limit = 50, offset = 0 }) {
    const [rows] = await pool.query(
      `SELECT bp.*,
              CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,'')) AS author_name
       FROM blog_posts bp
       JOIN users u ON u.id = bp.author_user_id
       WHERE bp.employer_id = ?
       ORDER BY bp.updated_at DESC
       LIMIT ? OFFSET ?`,
      [employerId, limit, offset]
    );
    return rows.map((r) => this._row(r));
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
      image_url,
      category,
      author_type,
      author_user_id,
      employer_id,
      is_published,
      published_at,
    } = data;
    const [result] = await pool.query(
      `INSERT INTO blog_posts
        (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slug,
        title,
        excerpt || null,
        content || null,
        image_url || null,
        category || 'Technology',
        author_type,
        author_user_id,
        employer_id || null,
        is_published ? 1 : 0,
        published_at || null,
      ]
    );
    return result.insertId;
  }

  async update(id, data) {
    const fields = [];
    const vals = [];
    const map = [
      'slug',
      'title',
      'excerpt',
      'content',
      'image_url',
      'category',
      'is_published',
      'published_at',
    ];
    for (const k of map) {
      if (data[k] !== undefined) {
        fields.push(`${k} = ?`);
        vals.push(k === 'is_published' ? (data[k] ? 1 : 0) : data[k]);
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

  async incrementViewCount(id) {
    await pool.query('UPDATE blog_posts SET view_count = view_count + 1 WHERE id = ?', [id]);
  }
}

module.exports = new BlogRepository();
