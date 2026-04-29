/**
 * Company Member Controller - Quản lý recruiter trong công ty
 */
const { CompanyMemberRepository, COMPANY_ROLES, COMPANY_ROLE_LABELS } = require('../models/CompanyMember');
const { AuditLogRepository, AUDIT_ACTIONS } = require('../models/AuditLog');
const { ApiResponse } = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

const listMembers = catchAsync(async (req, res) => {
  const user = req.user;
  const companyId = user.company_id || user.companyId;
  if (!companyId) {
    return ApiResponse.badRequest(res, 'Không tìm thấy công ty của bạn');
  }

  const members = await CompanyMemberRepository.findByCompany(companyId);
  return ApiResponse.success(res, members);
});

const inviteMember = catchAsync(async (req, res) => {
  const user = req.user;
  const { email, role, permissions } = req.body;
  const companyId = user.company_id || user.companyId;

  if (!companyId) {
    return ApiResponse.badRequest(res, 'Không tìm thấy công ty của bạn');
  }

  // Check permission
  const canManage = await CompanyMemberRepository.hasPermission(companyId, user.id, 'can_manage_applications');
  const isAdmin = await CompanyMemberRepository.isAdmin(companyId, user.id);
  if (!canManage && !isAdmin) {
    return ApiResponse.forbidden(res, 'Bạn không có quyền mời thành viên');
  }

  if (!email || !role) {
    return ApiResponse.badRequest(res, 'Email và vai trò là bắt buộc');
  }

  if (!Object.values(COMPANY_ROLES).includes(role)) {
    return ApiResponse.badRequest(res, 'Vai trò không hợp lệ');
  }

  // Tìm user theo email
  const { pool } = require('../config/database.config');
  const [userRows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (userRows.length === 0) {
    return ApiResponse.notFound(res, 'Không tìm thấy người dùng với email này');
  }
  const invitedUserId = userRows[0].id;

  const member = await CompanyMemberRepository.inviteMember(companyId, invitedUserId, role, permissions, user.id);

  await AuditLogRepository.log({
    userId: user.id,
    companyId,
    action: AUDIT_ACTIONS.COMPANY_MEMBER_INVITED,
    targetType: 'member',
    targetId: member.id,
    newValues: { email, role },
    ip: req.ip,
  });

  return ApiResponse.success(res, member, 'Đã mời thành viên thành công');
});

const updateRole = catchAsync(async (req, res) => {
  const user = req.user;
  const { userId } = req.params;
  const { role } = req.body;
  const companyId = user.company_id || user.companyId;

  if (!companyId) {
    return ApiResponse.badRequest(res, 'Không tìm thấy công ty');
  }

  const isAdmin = await CompanyMemberRepository.isAdmin(companyId, user.id);
  if (!isAdmin) {
    return ApiResponse.forbidden(res, 'Chỉ admin mới có quyền thay đổi vai trò');
  }

  try {
    const member = await CompanyMemberRepository.updateRole(companyId, parseInt(userId, 10), role, user.id);

    await AuditLogRepository.log({
      userId: user.id,
      companyId,
      action: AUDIT_ACTIONS.COMPANY_MEMBER_ROLE_CHANGED,
      targetType: 'member',
      targetId: parseInt(userId, 10),
      newValues: { role },
      ip: req.ip,
    });

    return ApiResponse.success(res, member, 'Đã cập nhật vai trò');
  } catch (err) {
    return ApiResponse.badRequest(res, err.message);
  }
});

const updatePermissions = catchAsync(async (req, res) => {
  const user = req.user;
  const { userId } = req.params;
  const { permissions } = req.body;
  const companyId = user.company_id || user.companyId;

  if (!companyId) {
    return ApiResponse.badRequest(res, 'Không tìm thấy công ty');
  }

  const isAdmin = await CompanyMemberRepository.isAdmin(companyId, user.id);
  if (!isAdmin) {
    return ApiResponse.forbidden(res, 'Chỉ admin mới có quyền cập nhật quyền');
  }

  await CompanyMemberRepository.updatePermissions(companyId, parseInt(userId, 10), permissions, user.id);

  await AuditLogRepository.log({
    userId: user.id,
    companyId,
    action: AUDIT_ACTIONS.COMPANY_MEMBER_ROLE_CHANGED,
    targetType: 'member',
    targetId: parseInt(userId, 10),
    newValues: { permissions },
    ip: req.ip,
  });

  return ApiResponse.success(res, null, 'Đã cập nhật quyền');
});

const removeMember = catchAsync(async (req, res) => {
  const user = req.user;
  const { userId } = req.params;
  const companyId = user.company_id || user.companyId;

  if (!companyId) {
    return ApiResponse.badRequest(res, 'Không tìm thấy công ty');
  }

  const isAdmin = await CompanyMemberRepository.isAdmin(companyId, user.id);
  if (!isAdmin) {
    return ApiResponse.forbidden(res, 'Chỉ admin mới có quyền xóa thành viên');
  }

  try {
    await CompanyMemberRepository.removeMember(companyId, parseInt(userId, 10), user.id);

    await AuditLogRepository.log({
      userId: user.id,
      companyId,
      action: AUDIT_ACTIONS.COMPANY_MEMBER_REMOVED,
      targetType: 'member',
      targetId: parseInt(userId, 10),
      ip: req.ip,
    });

    return ApiResponse.success(res, null, 'Đã xóa thành viên');
  } catch (err) {
    return ApiResponse.badRequest(res, err.message);
  }
});

const getMyPermissions = catchAsync(async (req, res) => {
  const user = req.user;
  const companyId = user.company_id || user.companyId;

  if (!companyId) {
    return ApiResponse.badRequest(res, 'Không tìm thấy công ty');
  }

  const member = await CompanyMemberRepository.findOne(companyId, user.id);
  if (!member) {
    return ApiResponse.notFound(res, 'Bạn không phải thành viên công ty');
  }

  return ApiResponse.success(res, {
    role: member.role,
    roleLabel: COMPANY_ROLE_LABELS[member.role] || member.role,
    permissions: {
      can_post_job: !!member.can_post_job,
      can_edit_job: !!member.can_edit_job,
      can_delete_job: !!member.can_delete_job,
      can_approve_job: !!member.can_approve_job,
      can_view_applications: !!member.can_view_applications,
      can_manage_applications: !!member.can_manage_applications,
      can_send_email: !!member.can_send_email,
      can_view_salary: !!member.can_view_salary,
      can_export_data: !!member.can_export_data,
    },
  });
});

module.exports = {
  listMembers,
  inviteMember,
  updateRole,
  updatePermissions,
  removeMember,
  getMyPermissions,
};
