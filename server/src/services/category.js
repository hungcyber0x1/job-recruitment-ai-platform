const { pool } = require('../config/database.config');
const { slugify } = require('../utils/stringHelper');

class CategoryService {
  async slugExists(slug, excludeId = null) {
    const sql =
      excludeId == null
        ? 'SELECT id FROM categories WHERE slug = ? LIMIT 1'
        : 'SELECT id FROM categories WHERE slug = ? AND id <> ? LIMIT 1';
    const params = excludeId == null ? [slug] : [slug, excludeId];
    const [rows] = await pool.query(sql, params);
    return Boolean(rows[0]);
  }

  async ensureUniqueSlug(source, excludeId = null) {
    const baseSlug = slugify(String(source || '').trim()) || 'category';
    let candidate = baseSlug;
    let suffix = 1;

    while (await this.slugExists(candidate, excludeId)) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  buildSelectQuery(whereSql = 'c.is_active = 1') {
    return `
      SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.parent_id,
        c.icon,
        c.icon AS icon_url,
        c.sort_order,
        c.is_active,
        c.created_at,
        c.updated_at,
        COUNT(DISTINCT CASE
          WHEN j.deleted_at IS NULL
            AND j.status = 'published'
            AND cp.deleted_at IS NULL THEN j.id
          ELSE NULL
        END) AS job_count,
        COUNT(DISTINCT CASE
          WHEN s.is_active = 1 THEN s.id
          ELSE NULL
        END) AS skill_count
      FROM categories c
      LEFT JOIN jobs j ON j.category_id = c.id
      LEFT JOIN company_profiles cp ON j.company_id = cp.id
      LEFT JOIN skills s ON s.category_id = c.id
      WHERE ${whereSql}
      GROUP BY
        c.id,
        c.name,
        c.slug,
        c.description,
        c.parent_id,
        c.icon,
        c.sort_order,
        c.is_active,
        c.created_at,
        c.updated_at
      ORDER BY c.sort_order ASC, c.name ASC
    `;
  }

  async getAllCategories(options = {}) {
    const includeInactive = options.includeInactive === true;
    const [rows] = await pool.query(
      this.buildSelectQuery(includeInactive ? '1 = 1' : 'c.is_active = 1')
    );
    return rows;
  }

  async getCategoryById(id, options = {}) {
    const includeInactive = options.includeInactive === true;
    const [rows] = await pool.query(
      `${this.buildSelectQuery(includeInactive ? 'c.id = ?' : 'c.id = ? AND c.is_active = 1')} LIMIT 1`,
      [id]
    );
    return rows[0];
  }

  async createCategory(data) {
    const name = String(data?.name || '').trim();
    const description = data?.description ? String(data.description).trim() : null;
    const icon = data?.icon ?? data?.icon_url ?? null;
    const parentId = data?.parent_id ? Number(data.parent_id) : null;
    const sortOrder = Number.isFinite(Number(data?.sort_order)) ? Number(data.sort_order) : 0;
    const isActive =
      data?.is_active === undefined || data?.is_active === null
        ? 1
        : Number(Boolean(data.is_active));
    const slug = await this.ensureUniqueSlug(data?.slug || name);

    const [result] = await pool.query(
      `
        INSERT INTO categories (name, slug, description, parent_id, icon, sort_order, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [name, slug, description, parentId, icon, sortOrder, isActive]
    );

    return this.getCategoryById(result.insertId, { includeInactive: true });
  }

  async updateCategory(id, data) {
    const existing = await this.getCategoryById(id, { includeInactive: true });
    if (!existing) return null;

    const nextName = String(data?.name ?? existing.name ?? '').trim();
    const nextDescription =
      data?.description !== undefined
        ? String(data.description || '').trim() || null
        : existing.description || null;
    const nextIcon =
      data?.icon !== undefined || data?.icon_url !== undefined
        ? (data.icon ?? data.icon_url ?? null)
        : existing.icon || existing.icon_url || null;
    const nextParentId =
      data?.parent_id !== undefined
        ? data.parent_id
          ? Number(data.parent_id)
          : null
        : existing.parent_id || null;
    const nextSortOrder =
      data?.sort_order !== undefined
        ? Number.isFinite(Number(data.sort_order))
          ? Number(data.sort_order)
          : existing.sort_order || 0
        : existing.sort_order || 0;
    const nextIsActive =
      data?.is_active !== undefined
        ? Number(Boolean(data.is_active))
        : Number(existing.is_active ?? 1);
    const nextSlug = await this.ensureUniqueSlug(
      data?.slug || (data?.name ? nextName : existing.slug),
      id
    );

    await pool.query(
      `
        UPDATE categories
        SET name = ?, slug = ?, description = ?, parent_id = ?, icon = ?, sort_order = ?, is_active = ?
        WHERE id = ?
      `,
      [nextName, nextSlug, nextDescription, nextParentId, nextIcon, nextSortOrder, nextIsActive, id]
    );

    return this.getCategoryById(id, { includeInactive: true });
  }

  async deleteCategory(id) {
    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new CategoryService();
