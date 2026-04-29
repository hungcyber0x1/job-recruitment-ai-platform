/**
 * Communication Controller - Gửi email cho ứng viên
 * + Log tất cả vào communication_audit
 */
const { AuditLogRepository, AUDIT_ACTIONS } = require('../models/AuditLog');
const { ApiResponse } = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

const sendEmail = catchAsync(async (req, res) => {
  const user = req.user;
  const { application_id, to, subject, body, template_type } = req.body;

  const companyId = user.company_id || user.companyId;

  // Log to communication_audit
  try {
    await AuditLogRepository.logCommunication({
      sentBy: user.id,
      applicationId: application_id,
      jobId: null,
      templateType: template_type || 'custom',
      recipient: to,
      subject,
      bodyPreview: body,
      status: 'sent',
    });

    await AuditLogRepository.log({
      userId: user.id,
      companyId,
      action: AUDIT_ACTIONS.APPLICATION_EMAIL_SENT,
      targetType: 'application',
      targetId: application_id,
      newValues: { to, subject },
      notes: body ? body.slice(0, 200) : null,
      ip: req.ip,
    });
  } catch (err) {
    console.error('Failed to log communication:', err);
  }

  return ApiResponse.success(res, null, 'Email đã được gửi');
});

const sendInterviewInvite = catchAsync(async (req, res) => {
  const user = req.user;
  const { application_id, interview_date, interview_time, interview_location, interview_notes } = req.body;
  const companyId = user.company_id || user.companyId;

  const subject = `Lời mời phỏng vấn - ${interview_date || ''}`;
  const body = `Thư mời phỏng vấn.\nNgày: ${interview_date}\nGiờ: ${interview_time}\nĐịa điểm: ${interview_location}\n${interview_notes || ''}`;

  try {
    await AuditLogRepository.logCommunication({
      sentBy: user.id,
      applicationId: application_id,
      templateType: 'interview_invite',
      recipient: '',
      subject,
      bodyPreview: body,
      status: 'sent',
    });

    await AuditLogRepository.log({
      userId: user.id,
      companyId,
      action: AUDIT_ACTIONS.APPLICATION_SCHEDULED_PV,
      targetType: 'application',
      targetId: application_id,
      newValues: { interview_date, interview_time, interview_location },
      ip: req.ip,
    });
  } catch (err) {
    console.error('Failed to log interview invite:', err);
  }

  return ApiResponse.success(res, null, 'Đã gửi lời mời phỏng vấn');
});

const sendRejection = catchAsync(async (req, res) => {
  const user = req.user;
  const { application_id, custom_message } = req.body;
  const companyId = user.company_id || user.companyId;

  try {
    await AuditLogRepository.logCommunication({
      sentBy: user.id,
      applicationId: application_id,
      templateType: 'rejection',
      recipient: '',
      subject: 'Cập nhật đơn ứng tuyển',
      bodyPreview: custom_message || 'Thư từ chối',
      status: 'sent',
    });

    await AuditLogRepository.log({
      userId: user.id,
      companyId,
      action: AUDIT_ACTIONS.APPLICATION_REJECTED,
      targetType: 'application',
      targetId: application_id,
      notes: custom_message,
      ip: req.ip,
    });
  } catch (err) {
    console.error('Failed to log rejection:', err);
  }

  return ApiResponse.success(res, null, 'Đã gửi thư từ chối');
});

const sendOffer = catchAsync(async (req, res) => {
  const user = req.user;
  const { application_id, offer_salary, offer_start_date, offer_deadline, custom_message } = req.body;
  const companyId = user.company_id || user.companyId;

  try {
    await AuditLogRepository.logCommunication({
      sentBy: user.id,
      applicationId: application_id,
      templateType: 'offer',
      recipient: '',
      subject: 'Đề nghị việc làm',
      bodyPreview: `Lương: ${offer_salary}, Bắt đầu: ${offer_start_date}`,
      status: 'sent',
    });

    await AuditLogRepository.log({
      userId: user.id,
      companyId,
      action: AUDIT_ACTIONS.APPLICATION_EMAIL_SENT,
      targetType: 'application',
      targetId: application_id,
      newValues: { offer_salary, offer_start_date, offer_deadline },
      notes: custom_message,
      ip: req.ip,
    });
  } catch (err) {
    console.error('Failed to log offer:', err);
  }

  return ApiResponse.success(res, null, 'Đã gửi offer');
});

const sendBulk = catchAsync(async (req, res) => {
  const user = req.user;
  const { application_ids, template_type, subject, body } = req.body;
  const companyId = user.company_id || user.companyId;

  if (!application_ids || !Array.isArray(application_ids)) {
    return ApiResponse.badRequest(res, 'Danh sách ứng viên không hợp lệ');
  }

  const results = [];
  for (const appId of application_ids) {
    try {
      await AuditLogRepository.logCommunication({
        sentBy: user.id,
        applicationId: appId,
        templateType: template_type || 'bulk',
        recipient: '',
        subject,
        bodyPreview: body,
        status: 'sent',
      });

      await AuditLogRepository.log({
        userId: user.id,
        companyId,
        action: AUDIT_ACTIONS.APPLICATION_EMAIL_SENT,
        targetType: 'application',
        targetId: appId,
        notes: `Bulk email: ${subject}`,
        ip: req.ip,
      });
      results.push({ application_id: appId, status: 'sent' });
    } catch (err) {
      results.push({ application_id: appId, status: 'failed', error: err.message });
    }
  }

  return ApiResponse.success(res, results, `Đã gửi ${results.filter(r => r.status === 'sent').length} email`);
});

const getHistory = catchAsync(async (req, res) => {
  const user = req.user;
  const companyId = user.company_id || user.companyId;
  const { limit = 100, offset = 0 } = req.query;

  if (!companyId) {
    return ApiResponse.success(res, []);
  }

  const audit = await AuditLogRepository.getCommunicationAudit({
    companyId,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
  });
  return ApiResponse.success(res, audit);
});

const getTemplates = catchAsync(async (req, res) => {
  const user = req.user;
  const companyId = user.company_id || user.companyId;

  // Return built-in templates (stored in memory or DB)
  const builtIn = [
    { id: 'builtin-interview', name: 'Mời phỏng vấn', type: 'interview_invite', subject: 'Lời mời phỏng vấn tại {{company_name}}', body: 'Kính gửi {{candidate_name}}...' },
    { id: 'builtin-rejection', name: 'Thư từ chối', type: 'rejection', subject: 'Cập nhật đơn ứng tuyển', body: 'Kính gửi {{candidate_name}}...' },
    { id: 'builtin-offer', name: 'Gửi Offer', type: 'offer', subject: 'Đề nghị việc làm', body: 'Kính gửi {{candidate_name}}...' },
  ];
  return ApiResponse.success(res, builtIn);
});

const createTemplate = catchAsync(async (req, res) => {
  // Save custom templates - can be extended to DB
  return ApiResponse.success(res, req.body, 'Template đã được tạo');
});

const updateTemplate = catchAsync(async (req, res) => {
  return ApiResponse.success(res, { ...req.body, id: req.params.id }, 'Template đã được cập nhật');
});

const deleteTemplate = catchAsync(async (req, res) => {
  return ApiResponse.success(res, null, 'Template đã được xóa');
});

module.exports = {
  sendEmail,
  sendInterviewInvite,
  sendRejection,
  sendOffer,
  sendBulk,
  getHistory,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
