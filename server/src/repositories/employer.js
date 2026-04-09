const BaseRepository = require('./base');

class EmployerRepository extends BaseRepository {
  constructor() {
    super('employers');
  }

  async findByUserId(userId) {
    const query = `
      SELECT e.*, u.email, u.first_name, u.last_name, u.avatar_url 
      FROM employers e
      JOIN users u ON e.user_id = u.id
      WHERE e.user_id = ?
    `;
    const [rows] = await this.pool.query(query, [userId]);
    return rows[0];
  }
}

module.exports = new EmployerRepository();
