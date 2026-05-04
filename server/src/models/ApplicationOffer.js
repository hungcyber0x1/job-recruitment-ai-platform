/**
 * ApplicationOfferRepository
 * Quản lý thông tin offer gửi cho ứng viên.
 * Table: application_offers
 */
const BaseRepository = require('./Base');

class ApplicationOfferRepository extends BaseRepository {
  constructor() {
    super('application_offers');
  }

  /**
   * Tạo hoặc cập nhật offer cho một application.
   * Mỗi application chỉ có 1 offer tại một thời điểm (UNIQUE trên application_id).
   */
  async upsert({
    application_id,
    salary_offered,
    salary_currency,
    response_deadline,
    start_date,
    benefits,
    offer_letter_url,
    notes,
    created_by,
  }) {
    // Dùng INSERT ... ON DUPLICATE KEY UPDATE
    const [result] = await this.pool.query(
      `INSERT INTO application_offers
        (application_id, salary_offered, salary_currency, response_deadline, start_date, benefits, offer_letter_url, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         salary_offered    = VALUES(salary_offered),
         salary_currency   = VALUES(salary_currency),
         response_deadline = VALUES(response_deadline),
         start_date        = VALUES(start_date),
         benefits          = VALUES(benefits),
         offer_letter_url  = VALUES(offer_letter_url),
         notes             = VALUES(notes),
         candidate_response = 'pending',
         responded_at      = NULL,
         updated_at        = NOW()`,
      [
        application_id,
        salary_offered ?? null,
        salary_currency ?? 'VND',
        response_deadline ?? null,
        start_date ?? null,
        benefits ?? null,
        offer_letter_url ?? null,
        notes ?? null,
        created_by ?? null,
      ]
    );

    const [rows] = await this.pool.query(
      'SELECT * FROM application_offers WHERE application_id = ?',
      [application_id]
    );
    return rows[0] || null;
  }

  /**
   * Lấy offer của một application.
   */
  async findByApplication(applicationId) {
    const [rows] = await this.pool.query(
      'SELECT * FROM application_offers WHERE application_id = ?',
      [applicationId]
    );
    return rows[0] || null;
  }

  /**
   * Cập nhật phản hồi của ứng viên (accepted/declined).
   */
  async recordResponse(applicationId, response) {
    await this.pool.query(
      `UPDATE application_offers
       SET candidate_response = ?, responded_at = NOW()
       WHERE application_id = ?`,
      [response, applicationId]
    );
  }
}

module.exports = new ApplicationOfferRepository();
module.exports.ApplicationOfferRepository = ApplicationOfferRepository;
