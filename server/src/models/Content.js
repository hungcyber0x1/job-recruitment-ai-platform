const { pool } = require('../config/database.config');

class ContentRepository {
  // Pages
  async findAllPages() {
    const [rows] = await pool.query('SELECT * FROM content_pages ORDER BY slug');
    return rows;
  }
  async savedPage(pageData) {
    // Upsert
    const { slug, title, content, type, isPublished } = pageData;
    const [result] = await pool.query(
      `INSERT INTO content_pages (slug, title, content, page_type, is_published) 
            VALUES (?, ?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE title=?, content=?, page_type=?, is_published=?`,
      [slug, title, content, type, isPublished, title, content, type, isPublished]
    );
    return result;
  }

  // Banners
  async findAllBanners() {
    const [rows] = await pool.query('SELECT * FROM banners ORDER BY priority DESC');
    return rows;
  }
  async createBanner(bannerData) {
    const imageUrl = bannerData.imageUrl || bannerData.image_url;
    const linkUrl = bannerData.linkUrl || bannerData.link_url;
    const position = bannerData.position;
    const isActive = bannerData.isActive ?? bannerData.is_active ?? true;
    const priority = bannerData.priority ?? 0;
    const [result] = await pool.query(
      'INSERT INTO banners (image_url, link_url, position, is_active, priority) VALUES (?, ?, ?, ?, ?)',
      [imageUrl, linkUrl, position, isActive, priority]
    );
    return result.insertId;
  }
  async deleteBanner(id) {
    await pool.query('DELETE FROM banners WHERE id = ?', [id]);
  }
}

module.exports = new ContentRepository();
