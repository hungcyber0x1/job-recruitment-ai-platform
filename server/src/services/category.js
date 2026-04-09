const { pool } = require('../config/database.config');

class CategoryService {
  async getAllCategories() {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    return rows;
  }

  async getCategoryById(id) {
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0];
  }

  async createCategory(data) {
    const { name, description, icon_url } = data;
    const [result] = await pool.query(
      'INSERT INTO categories (name, description, icon_url) VALUES (?, ?, ?)',
      [name, description || null, icon_url || null]
    );
    return this.getCategoryById(result.insertId);
  }

  async updateCategory(id, data) {
    const { name, description, icon_url } = data;
    await pool.query('UPDATE categories SET name = ?, description = ?, icon_url = ? WHERE id = ?', [
      name,
      description || null,
      icon_url || null,
      id,
    ]);
    return this.getCategoryById(id);
  }

  async deleteCategory(id) {
    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new CategoryService();
