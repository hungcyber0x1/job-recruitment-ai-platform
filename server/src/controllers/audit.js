/**
 * Audit Controller - Xem audit trail cho recruiter
 */
const { AuditLogRepository, AUDIT_ACTION_LABELS } = require('../models/AuditLog');
const { ApiResponse } = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');
const { hasCompanyPermission } = require('../utils/company-access');

const getApplicationAudit = catchAsync(async (req, res) => {
  const { applicationId } = req.params;
  const { limit = 50 } = req.query;
  const isAdmin = req.user.role === 'admin';
  const companyId = req.user.company_id || req.user.companyId;

  if (!isAdmin && !companyId) {
    return ApiResponse.badRequest(res, 'KhÃ´ng tÃ¬m tháº¥y cÃ´ng ty');
  }

  if (!isAdmin && !hasCompanyPermission(req.user, 'can_view_applications')) {
    return ApiResponse.forbidden(res, 'Bạn không có quyền xem nhật ký kiểm toán hồ sơ');
  }

  const audit = await AuditLogRepository.getApplicationAudit(
    parseInt(applicationId, 10),
    isAdmin ? null : parseInt(companyId, 10),
    parseInt(limit, 10)
  );
  return ApiResponse.success(res, audit);
});

const getJobAudit = catchAsync(async (req, res) => {
  const { jobId } = req.params;
  const { limit = 50 } = req.query;
  const isAdmin = req.user.role === 'admin';
  const companyId = req.user.company_id || req.user.companyId;

  if (!isAdmin && !companyId) {
    return ApiResponse.badRequest(res, 'Không tìm thấy công ty');
  }

  if (!isAdmin && !hasCompanyPermission(req.user, 'can_manage_jobs')) {
    return ApiResponse.forbidden(res, 'Bạn không có quyền xem audit tin tuyển dụng');
  }

  const audit = await AuditLogRepository.getJobAudit(
    parseInt(jobId, 10),
    isAdmin ? null : parseInt(companyId, 10),
    parseInt(limit, 10)
  );
  return ApiResponse.success(res, audit);
});

const getCommunicationAudit = catchAsync(async (req, res) => {
  const user = req.user;
  const companyId = user.company_id || user.companyId;
  const { limit = 100, offset = 0 } = req.query;

  if (!companyId) {
    return ApiResponse.badRequest(res, 'Không tìm thấy công ty');
  }

  const audit = await AuditLogRepository.getCommunicationAudit({
    companyId,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
  });
  return ApiResponse.success(res, audit);
});

const getAuditTrail = catchAsync(async (req, res) => {
  const user = req.user;
  const companyId = user.company_id || user.companyId;
  const { targetType, targetId, limit = 100, offset = 0 } = req.query;

  if (!companyId) {
    return ApiResponse.badRequest(res, 'Không tìm thấy công ty');
  }

  const trail = await AuditLogRepository.getAuditTrail({
    companyId,
    targetType,
    targetId: targetId ? parseInt(targetId, 10) : undefined,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
  });

  return ApiResponse.success(res, {
    data: trail,
    actions: AUDIT_ACTION_LABELS,
  });
});

module.exports = {
  getApplicationAudit,
  getJobAudit,
  getCommunicationAudit,
  getAuditTrail,
};
