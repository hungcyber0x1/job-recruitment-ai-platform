/**
 * Company Member Repository - Quản lý recruiter trong công ty
 * Hỗ trợ: invite, phân quyền, revoke
 */
const { pool } = require('../config/database.config');

const COMPANY_ROLES = {
  OWNER:     'owner',
  ADMIN:     'admin',
  RECRUITER: 'recruiter',
};

const COMPANY_ROLE_LABELS = {
  owner:     'Chủ sở hữu',
  admin:     'Quản trị viên',
  recruiter: 'Nhà tuyển dụng',
};

const PERMISSION_FIELDS = [
  'can_post_job', 'can_edit_job', 'can_delete_job', 'can_approve_job',
  'can_view_applications', 'can_manage_applications', 'can_send_email',
  'can_view_salary', 'can_export_data',
];

class CompanyMemberRepository {
  async _findOwner(companyId) {
    const [rows] = await pool.query(`
      SELECT
        cp.id AS company_id,
        cp.user_id,
        'owner' AS role,
        'active' AS status,
        cp.created_at AS joined_at,
        NULL AS invited_by,
        1 AS can_post_job,
        1 AS can_edit_job,
        1 AS can_delete_job,
        1 AS can_approve_job,
        1 AS can_view_applications,
        1 AS can_manage_applications,
        1 AS can_send_email,
        1 AS can_view_salary,
        1 AS can_export_data,
        u.email,
        u.first_name,
        u.last_name,
        u.avatar_url,
        NULL AS invited_by_first_name,
        NULL AS invited_by_last_name
      FROM company_profiles cp
      JOIN users u ON u.id = cp.user_id
      WHERE cp.id = ? AND cp.deleted_at IS NULL AND u.deleted_at IS NULL
      LIMIT 1
    `, [companyId]);

    return rows[0] || null;
  }

  async findByCompany(companyId) {
    const [rows] = await pool.query(`
      SELECT cm.*, u.email, u.first_name, u.last_name, u.avatar_url,
             inv.first_name as invited_by_first_name, inv.last_name as invited_by_last_name
      FROM company_members cm
      JOIN users u ON cm.user_id = u.id
      LEFT JOIN users inv ON cm.invited_by = inv.id
      WHERE cm.company_id = ? AND cm.status = 'active'
      ORDER BY cm.role = 'owner' DESC, cm.role = 'admin' DESC, cm.joined_at ASC
    `, [companyId]);

    const owner = await this._findOwner(companyId);
    if (owner && !rows.some((member) => Number(member.user_id) === Number(owner.user_id))) {
      rows.unshift(owner);
    }

    return rows;
  }

  async findByUser(userId) {
    const [rows] = await pool.query(`
      SELECT cm.*, cp.company_name, cp.company_logo, cp.industry
      FROM company_members cm
      JOIN company_profiles cp ON cm.company_id = cp.id
      WHERE cm.user_id = ? AND cm.status = 'active'
    `, [userId]);
    return rows;
  }

  async findOne(companyId, userId) {
    const [rows] = await pool.query(`
      SELECT cm.*, u.email, u.first_name, u.last_name
      FROM company_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.company_id = ? AND cm.user_id = ?
      ORDER BY cm.status = 'active' DESC, cm.joined_at ASC
      LIMIT 1
    `, [companyId, userId]);
    if (rows[0]) {
      return rows[0];
    }

    const owner = await this._findOwner(companyId);
    if (owner && Number(owner.user_id) === Number(userId)) {
      return owner;
    }

    return null;
  }

  async isMember(companyId, userId) {
    const member = await this.findOne(companyId, userId);
    return !!member && member.status === 'active';
  }

  async hasPermission(companyId, userId, permission) {
    if (!PERMISSION_FIELDS.includes(permission)) return false;
    const member = await this.findOne(companyId, userId);
    if (!member || member.status !== 'active') return false;
    if (member.role === COMPANY_ROLES.OWNER) return true;
    return member[permission] === 1 || member[permission] === true;
  }

  async isOwner(companyId, userId) {
    const member = await this.findOne(companyId, userId);
    return member?.status === 'active' && member?.role === COMPANY_ROLES.OWNER;
  }

  async isAdmin(companyId, userId) {
    const member = await this.findOne(companyId, userId);
    return member?.status === 'active' && (member?.role === COMPANY_ROLES.OWNER || member?.role === COMPANY_ROLES.ADMIN);
  }

  async inviteMember(companyId, userId, role, permissions, invitedBy) {
    const existing = await this.findOne(companyId, userId);
    if (existing) {
      if (existing.status === 'active') {
        throw new Error('Người dùng đã là thành viên của công ty');
      }
      await pool.query(`
        UPDATE company_members SET status = 'active', role = ?, invited_by = ?
        WHERE company_id = ? AND user_id = ?
      `, [role, invitedBy, companyId, userId]);
      return this.findOne(companyId, userId);
    }

    const perms = {};
    for (const field of PERMISSION_FIELDS) {
      perms[field] = (permissions && permissions[field] !== undefined)
        ? permissions[field]
        : this._defaultPermission(field, role);
    }

    await pool.query(`
      INSERT INTO company_members
        (company_id, user_id, role, invited_by,
         can_post_job, can_edit_job, can_delete_job, can_approve_job,
         can_view_applications, can_manage_applications, can_send_email,
         can_view_salary, can_export_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      companyId, userId, role, invitedBy,
      perms.can_post_job, perms.can_edit_job, perms.can_delete_job, perms.can_approve_job,
      perms.can_view_applications, perms.can_manage_applications, perms.can_send_email,
      perms.can_view_salary, perms.can_export_data,
    ]);
    return this.findOne(companyId, userId);
  }

  async updatePermissions(companyId, userId, permissions) {
    const updates = [];
    const params = [];
    for (const field of PERMISSION_FIELDS) {
      if (permissions[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(permissions[field] ? 1 : 0);
      }
    }
    if (updates.length === 0) return;
    params.push(companyId, userId);
    await pool.query(
      `UPDATE company_members SET ${updates.join(', ')} WHERE company_id = ? AND user_id = ?`,
      params
    );
  }

  async updateRole(companyId, userId, newRole) {
    const member = await this.findOne(companyId, userId);
    if (member?.role === COMPANY_ROLES.OWNER) {
      throw new Error('Không thể thay đổi quyền của chủ sở hữu công ty');
    }
    await pool.query(
      `UPDATE company_members SET role = ? WHERE company_id = ? AND user_id = ?`,
      [newRole, companyId, userId]
    );
  }

  async removeMember(companyId, userId) {
    const member = await this.findOne(companyId, userId);
    if (member?.role === COMPANY_ROLES.OWNER) {
      throw new Error('Không thể xóa chủ sở hữu công ty');
    }
    await pool.query(
      `UPDATE company_members SET status = 'inactive' WHERE company_id = ? AND user_id = ?`,
      [companyId, userId]
    );
  }

  async bulkDeleteByCompany(companyId) {
    const [result] = await pool.query(
      'UPDATE company_members SET status = \'inactive\' WHERE company_id = ?',
      [companyId]
    );
    return result.affectedRows;
  }

  async getUserIdsByCompany(companyId) {
    const [rows] = await pool.query(
      'SELECT user_id FROM company_members WHERE company_id = ? AND status = \'active\'',
      [companyId]
    );
    const userIds = rows.map(r => r.user_id);
    const owner = await this._findOwner(companyId);

    if (owner && !userIds.includes(owner.user_id)) {
      userIds.unshift(owner.user_id);
    }

    return userIds;
  }

  _defaultPermission(field, role) {
    if (role === COMPANY_ROLES.OWNER) return true;
    if (role === COMPANY_ROLES.ADMIN) {
      return ['can_post_job', 'can_edit_job', 'can_view_applications', 'can_manage_applications', 'can_send_email'].includes(field);
    }
    return ['can_post_job', 'can_view_applications'].includes(field);
  }
}

module.exports = {
  CompanyMemberRepository: new CompanyMemberRepository(),
  COMPANY_ROLES,
  COMPANY_ROLE_LABELS,
  PERMISSION_FIELDS,
};
