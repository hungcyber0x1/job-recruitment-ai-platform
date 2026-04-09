const BaseRepository = require('./base');

class CategoryRepository extends BaseRepository {
  constructor() {
    super('categories');
  }

  async findByName(name) {
    const [rows] = await this.pool.query('SELECT * FROM categories WHERE name = ?', [name]);
    return rows[0];
  }
}

module.exports = new CategoryRepository();
