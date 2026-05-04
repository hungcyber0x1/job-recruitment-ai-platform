const { pool } = require('../config/database.config');

const HomepageContentModel = {
  /**
   * Get all homepage sections with their content
   */
  async getAllSections() {
    const [sections] = await pool.query(
      'SELECT * FROM homepage_sections WHERE is_active = 1 ORDER BY display_order ASC'
    );
    return sections;
  },

  /**
   * Get section by key with all related content
   */
  async getSectionByKey(sectionKey) {
    const [sections] = await pool.query(
      'SELECT * FROM homepage_sections WHERE section_key = ? AND is_active = 1',
      [sectionKey]
    );
    return sections[0] || null;
  },

  /**
   * Get stats for a section
   */
  async getStats(sectionId) {
    const [stats] = await pool.query(
      'SELECT * FROM homepage_stats WHERE section_id = ? AND is_active = 1 ORDER BY display_order ASC',
      [sectionId]
    );
    return stats;
  },

  /**
   * Get testimonials for a section
   */
  async getTestimonials(sectionId) {
    const [testimonials] = await pool.query(
      'SELECT * FROM homepage_testimonials WHERE section_id = ? AND is_active = 1 ORDER BY display_order ASC',
      [sectionId]
    );
    return testimonials;
  },

  /**
   * Get partners for a section
   */
  async getPartners(sectionId) {
    const [partners] = await pool.query(
      'SELECT * FROM homepage_partners WHERE section_id = ? AND is_active = 1 ORDER BY display_order ASC',
      [sectionId]
    );
    return partners;
  },

  /**
   * Get full homepage data with all sections
   */
  async getFullHomepageData() {
    const sections = await this.getAllSections();
    const result = {};

    for (const section of sections) {
      switch (section.section_type) {
        case 'stats':
          result[section.section_key] = {
            ...section,
            items: await this.getStats(section.id),
          };
          break;
        case 'testimonials':
          result[section.section_key] = {
            ...section,
            items: await this.getTestimonials(section.id),
          };
          break;
        case 'logos':
        case 'partners':
          result[section.section_key] = {
            ...section,
            items: await this.getPartners(section.id),
          };
          break;
        default:
          result[section.section_key] = section;
      }
    }

    return result;
  },

  // ========== ADMIN METHODS ==========

  /**
   * Get all sections for admin (including inactive)
   */
  async getAllSectionsAdmin() {
    const [sections] = await pool.query(
      'SELECT * FROM homepage_sections ORDER BY display_order ASC'
    );
    return sections;
  },

  /**
   * Update section settings
   */
  async updateSection(sectionKey, data) {
    const allowedFields = ['title', 'subtitle', 'is_active', 'display_order', 'metadata'];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        if (field === 'metadata' && typeof data[field] === 'object') {
          values.push(JSON.stringify(data[field]));
        } else {
          values.push(data[field]);
        }
      }
    }

    if (updates.length === 0) return false;

    values.push(sectionKey);
    const [result] = await pool.query(
      `UPDATE homepage_sections SET ${updates.join(', ')} WHERE section_key = ?`,
      values
    );
    return result.affectedRows > 0;
  },

  /**
   * Create new section
   */
  async createSection(data) {
    const { section_key, section_type, title, subtitle, is_active, display_order, metadata } = data;
    const [result] = await pool.query(
      `INSERT INTO homepage_sections (section_key, section_type, title, subtitle, is_active, display_order, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        section_key,
        section_type,
        title || null,
        subtitle || null,
        is_active ?? true,
        display_order ?? 0,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
    return result.insertId;
  },

  /**
   * Add stat item
   */
  async addStat(sectionId, data) {
    const { icon, display_value, label, value_type, display_order } = data;
    const [result] = await pool.query(
      `INSERT INTO homepage_stats (section_id, icon, display_value, label, value_type, display_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sectionId, icon || 'users', display_value, label, value_type || 'text', display_order ?? 0]
    );
    return result.insertId;
  },

  /**
   * Update stat item
   */
  async updateStat(statId, data) {
    const allowedFields = [
      'icon',
      'display_value',
      'label',
      'value_type',
      'display_order',
      'is_active',
    ];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (updates.length === 0) return false;

    values.push(statId);
    const [result] = await pool.query(
      `UPDATE homepage_stats SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  },

  /**
   * Delete stat item
   */
  async deleteStat(statId) {
    const [result] = await pool.query('DELETE FROM homepage_stats WHERE id = ?', [statId]);
    return result.affectedRows > 0;
  },

  /**
   * Add testimonial
   */
  async addTestimonial(sectionId, data) {
    const { author_name, author_role, author_avatar, content, rating, display_order } = data;
    const [result] = await pool.query(
      `INSERT INTO homepage_testimonials (section_id, author_name, author_role, author_avatar, content, rating, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        sectionId,
        author_name,
        author_role || null,
        author_avatar || null,
        content,
        rating || 5,
        display_order ?? 0,
      ]
    );
    return result.insertId;
  },

  /**
   * Update testimonial
   */
  async updateTestimonial(testimonialId, data) {
    const allowedFields = [
      'author_name',
      'author_role',
      'author_avatar',
      'content',
      'rating',
      'display_order',
      'is_active',
    ];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (updates.length === 0) return false;

    values.push(testimonialId);
    const [result] = await pool.query(
      `UPDATE homepage_testimonials SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  },

  /**
   * Delete testimonial
   */
  async deleteTestimonial(testimonialId) {
    const [result] = await pool.query('DELETE FROM homepage_testimonials WHERE id = ?', [
      testimonialId,
    ]);
    return result.affectedRows > 0;
  },

  /**
   * Add partner
   */
  async addPartner(sectionId, data) {
    const { name, logo_url, logo_svg, website_url, display_order } = data;
    const [result] = await pool.query(
      `INSERT INTO homepage_partners (section_id, name, logo_url, logo_svg, website_url, display_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sectionId, name, logo_url || null, logo_svg || null, website_url || null, display_order ?? 0]
    );
    return result.insertId;
  },

  /**
   * Update partner
   */
  async updatePartner(partnerId, data) {
    const allowedFields = [
      'name',
      'logo_url',
      'logo_svg',
      'website_url',
      'display_order',
      'is_active',
    ];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (updates.length === 0) return false;

    values.push(partnerId);
    const [result] = await pool.query(
      `UPDATE homepage_partners SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  },

  /**
   * Delete partner
   */
  async deletePartner(partnerId) {
    const [result] = await pool.query('DELETE FROM homepage_partners WHERE id = ?', [partnerId]);
    return result.affectedRows > 0;
  },
};

module.exports = HomepageContentModel;
