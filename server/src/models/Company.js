const BaseRepository = require('./Base');

class CompanyRepository extends BaseRepository {
  constructor() {
    super('employers');
  }

  _buildFiltersQuery(filters = {}) {
    let whereClause = 'WHERE u.deleted_at IS NULL';
    const params = [];

    if (filters.search) {
      whereClause += ` AND (e.company_name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.industry) {
      whereClause += ` AND e.industry LIKE ?`;
      params.push(`%${filters.industry}%`);
    }

    if (filters.is_verified !== undefined && filters.is_verified !== 'all') {
      whereClause += ` AND e.is_verified = ?`;
      params.push(filters.is_verified === 'true' || filters.is_verified === true);
    }

    return { whereClause, params };
  }

  async findAllWithFilters(filters = {}) {
    const { whereClause, params } = this._buildFiltersQuery(filters);
    let query = `
            SELECT e.*, u.email, u.first_name, u.last_name, 
             (SELECT COUNT(*) FROM jobs j WHERE j.employer_id = e.id AND j.deleted_at IS NULL) as job_count
            FROM employers e
            JOIN users u ON e.user_id = u.id
            ${whereClause}
         `;

    query += ` ORDER BY e.created_at DESC`;

    const queryParams = [...params];
    const parsedLimit = Number.parseInt(filters.limit, 10);
    const parsedOffset = Number.parseInt(filters.offset, 10);

    if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
      query += ` LIMIT ?`;
      queryParams.push(parsedLimit);
    }

    if (Number.isFinite(parsedLimit) && Number.isFinite(parsedOffset) && parsedOffset >= 0) {
      query += ` OFFSET ?`;
      queryParams.push(parsedOffset);
    }

    const [rows] = await this.pool.query(query, queryParams);
    return rows;
  }

  async countWithFilters(filters = {}) {
    const { whereClause, params } = this._buildFiltersQuery(filters);
    const [rows] = await this.pool.query(
      `
        SELECT COUNT(*) AS total
        FROM employers e
        JOIN users u ON e.user_id = u.id
        ${whereClause}
      `,
      params
    );

    return Number(rows[0]?.total || 0);
  }

  async countByVerification(isVerified) {
    const [rows] = await this.pool.query(
      'SELECT COUNT(*) AS total FROM employers WHERE is_verified = ?',
      [Boolean(isVerified)]
    );
    return rows[0].total;
  }

  async verifyCompany(id, isVerified) {
    const [result] = await this.pool.query('UPDATE employers SET is_verified = ? WHERE id = ?', [
      isVerified,
      id,
    ]);
    return result.affectedRows > 0;
  }

  async findByIdWithDetails(id) {
    const [rows] = await this.pool.query(
      `SELECT e.*, u.email, u.first_name, u.last_name, u.phone AS user_phone, u.avatar_url,
              (SELECT COUNT(*) FROM jobs j WHERE j.employer_id = e.id AND j.deleted_at IS NULL) AS job_count,
              (SELECT COUNT(*) FROM applications a
                 JOIN jobs j ON a.job_id = j.id
                WHERE j.employer_id = e.id AND j.deleted_at IS NULL) AS application_count
         FROM employers e
         JOIN users u ON e.user_id = u.id
        WHERE e.id = ?`,
      [id]
    );

    return rows[0];
  }
}

module.exports = new CompanyRepository();
