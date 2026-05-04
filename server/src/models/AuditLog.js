/**
 * Audit Log Service - Ghi lại tất cả thao tác tuyển dụng
 *
 * Log:
 * - Ai đổi trạng thái ứng viên
 * - Ai sửa JD
 * - Ai gửi email
 * - Ai từ chối hồ sơ
 * - Ai phê duyệt/từ chối tin tuyển dụng
 */
const { pool } = require('../config/database.config');

const AUDIT_ACTIONS = {
  // Application actions
  APPLICATION_STATUS_CHANGE: 'application_status_change',
  APPLICATION_NOTE_ADDED: 'application_note_added',
  APPLICATION_EMAIL_SENT: 'application_email_sent',
  APPLICATION_SHORTLISTED: 'application_shortlisted',
  APPLICATION_REJECTED: 'application_rejected',
  APPLICATION_SCHEDULED_PV: 'application_interview_scheduled',

  // Job actions
  JOB_CREATED: 'job_created',
  JOB_UPDATED: 'job_updated',
  JOB_CLONED: 'job_cloned',
  JOB_STATUS_CHANGE: 'job_status_change',
  JOB_SUBMITTED_FOR_APPROVAL: 'job_submitted_for_approval',
  JOB_APPROVED: 'job_approved',
  JOB_REJECTED: 'job_rejected',

  // Company actions
  COMPANY_MEMBER_INVITED: 'company_member_invited',
  COMPANY_MEMBER_REMOVED: 'company_member_removed',
  COMPANY_MEMBER_ROLE_CHANGED: 'company_member_role_changed',
  COMPANY_PROFILE_UPDATED: 'company_profile_updated',

  // Auth actions
  LOGIN: 'login',
  LOGOUT: 'logout',
};

const AUDIT_ACTION_LABELS = {
  [AUDIT_ACTIONS.APPLICATION_STATUS_CHANGE]: 'Đổi trạng thái ứng viên',
  [AUDIT_ACTIONS.APPLICATION_NOTE_ADDED]: 'Thêm ghi chú',
  [AUDIT_ACTIONS.APPLICATION_EMAIL_SENT]: 'Gửi email',
  [AUDIT_ACTIONS.APPLICATION_SHORTLISTED]: 'Shortlist ứng viên',
  [AUDIT_ACTIONS.APPLICATION_REJECTED]: 'Từ chối hồ sơ',
  [AUDIT_ACTIONS.APPLICATION_SCHEDULED_PV]: 'Lên lịch phỏng vấn',
  [AUDIT_ACTIONS.JOB_CREATED]: 'Tạo tin tuyển dụng',
  [AUDIT_ACTIONS.JOB_UPDATED]: 'Sửa tin tuyển dụng',
  [AUDIT_ACTIONS.JOB_CLONED]: 'Nhân bản tin',
  [AUDIT_ACTIONS.JOB_STATUS_CHANGE]: 'Đổi trạng thái tin',
  [AUDIT_ACTIONS.JOB_SUBMITTED_FOR_APPROVAL]: 'Gửi duyệt tin',
  [AUDIT_ACTIONS.JOB_APPROVED]: 'Duyệt tin',
  [AUDIT_ACTIONS.JOB_REJECTED]: 'Từ chối tin',
  [AUDIT_ACTIONS.COMPANY_MEMBER_INVITED]: 'Mời thành viên',
  [AUDIT_ACTIONS.COMPANY_MEMBER_REMOVED]: 'Xóa thành viên',
  [AUDIT_ACTIONS.COMPANY_MEMBER_ROLE_CHANGED]: 'Đổi vai trò thành viên',
  [AUDIT_ACTIONS.COMPANY_PROFILE_UPDATED]: 'Cập nhật hồ sơ công ty',
  [AUDIT_ACTIONS.LOGIN]: 'Đăng nhập',
  [AUDIT_ACTIONS.LOGOUT]: 'Đăng xuất',
};

class AuditLogRepository {
  async log({
    userId,
    companyId,
    action,
    targetType,
    targetId,
    oldValues,
    newValues,
    notes,
    ip,
    userAgent,
  }) {
    const metadata = {
      company_id: companyId,
      target_type: targetType,
      target_id: targetId,
      old_values: oldValues,
      new_values: newValues,
      notes,
      action_label: AUDIT_ACTION_LABELS[action] || action,
    };
    const description =
      notes ||
      `${AUDIT_ACTION_LABELS[action] || action}${targetType ? ` • ${targetType}` : ''}${
        targetId ? ` #${targetId}` : ''
      }`;
    const query = `
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address, user_agent, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.query(query, [
      userId,
      action,
      targetType || null,
      targetId || null,
      description,
      ip || null,
      userAgent || null,
      JSON.stringify(metadata),
    ]);
  }

  async getAuditTrail({ companyId, targetType, targetId, limit = 100, offset = 0 }) {
    let query = `
      SELECT al.*, u.first_name, u.last_name, u.email
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (companyId) {
      query += ` AND JSON_EXTRACT(al.metadata, '$.company_id') = ?`;
      params.push(companyId);
    }
    if (targetType) {
      query += ` AND al.entity_type = ?`;
      params.push(targetType);
    }
    if (targetId) {
      query += ` AND al.entity_id = ?`;
      params.push(targetId);
    }

    query += ` ORDER BY al.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.query(query, params);
    return rows.map((row) => ({
      ...row,
      details: this._parseDetails(row.metadata),
      metadata: this._parseDetails(row.metadata),
      actionLabel: AUDIT_ACTION_LABELS[row.action] || row.action,
    }));
  }

  async getApplicationAudit(applicationId, companyId = null, limit = 50) {
    let query = `
      SELECT ah.*, u.first_name, u.last_name,
             al.ip_address
      FROM application_history ah
      JOIN applications a ON a.id = ah.application_id
      JOIN jobs j ON j.id = a.job_id
      LEFT JOIN users u ON ah.changed_by = u.id
      LEFT JOIN activity_logs al ON al.id = (
        SELECT id FROM activity_logs
        WHERE entity_type = 'application'
          AND entity_id = ah.application_id
        ORDER BY created_at DESC LIMIT 1
      )
      WHERE ah.application_id = ?
    `;
    const params = [applicationId];

    if (companyId) {
      query += ` AND j.company_id = ?`;
      params.push(companyId);
    }

    query += `
      ORDER BY ah.created_at DESC
      LIMIT ?
    `;
    params.push(parseInt(limit, 10));

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async getJobAudit(jobId, companyId = null, limit = 50) {
    let query = `
      SELECT jh.*, u.first_name, u.last_name, u.email
      FROM job_history jh
      JOIN jobs j ON j.id = jh.job_id
      LEFT JOIN users u ON jh.changed_by = u.id
      WHERE jh.job_id = ?
    `;
    const params = [jobId];

    if (companyId) {
      query += ` AND j.company_id = ?`;
      params.push(companyId);
    }

    query += `
      ORDER BY jh.created_at DESC
      LIMIT ?
    `;
    params.push(parseInt(limit, 10));

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async logJobChange(jobId, userId, action, oldValues, newValues, notes, ip) {
    const query = `
      INSERT INTO job_history (job_id, changed_by, action, old_values, new_values, notes, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await pool.query(query, [
      jobId,
      userId,
      action,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      notes || null,
      ip || null,
    ]);
  }

  async logCommunication(data) {
    const query = `
      INSERT INTO communication_audit
        (application_id, job_id, sent_by, template_type, recipient, subject, body_preview, status, error_message, email_log_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await pool.query(query, [
      data.applicationId || null,
      data.jobId || null,
      data.sentBy,
      data.templateType,
      data.recipient,
      data.subject || '',
      data.bodyPreview ? data.bodyPreview.slice(0, 500) : null,
      data.status || 'pending',
      data.errorMessage || null,
      data.emailLogId || null,
    ]);
  }

  async getCommunicationAudit({ companyId, limit = 100, offset = 0 }) {
    const query = `
      SELECT ca.*, u.first_name, u.last_name, u.email,
             j.title as job_title,
             a.id as application_id
      FROM communication_audit ca
      LEFT JOIN users u ON ca.sent_by = u.id
      LEFT JOIN jobs j ON ca.job_id = j.id
      LEFT JOIN applications a ON ca.application_id = a.id
      LEFT JOIN company_profiles cp ON j.company_id = cp.id
      WHERE cp.id = ? OR j.company_id = ?
      ORDER BY ca.sent_at DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(query, [
      companyId,
      companyId,
      parseInt(limit, 10),
      parseInt(offset, 10),
    ]);
    return rows;
  }

  _parseDetails(detailsStr) {
    try {
      return typeof detailsStr === 'string' ? JSON.parse(detailsStr) : detailsStr || {};
    } catch {
      return {};
    }
  }
}

module.exports = {
  AuditLogRepository: new AuditLogRepository(),
  AUDIT_ACTIONS,
  AUDIT_ACTION_LABELS,
};
