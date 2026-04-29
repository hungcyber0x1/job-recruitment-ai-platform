/**
 * Notification Service - Business logic cho notification center
 * Hỗ trợ tất cả roles: candidate, recruiter, admin
 */
const NotificationRepository = require('../models/Notification');
const UserRepository = require('../models/User');
const JobRepository = require('../models/Job');
const ApplicationRepository = require('../models/Application');
const CompanyRepository = require('../models/Company');
const AppError = require('../utils/errorHandler');
const { pool } = require('../config/database.config');

class NotificationService {
  constructor() {
    this.pool = pool;
  }
  /**
   * ========================
   * CANDIDATE NOTIFICATIONS
   * ========================
   */

  /**
   * Thông báo khi ứng viên nộp đơn
   */
  async notifyApplicationSubmitted(candidateId, applicationId, jobId) {
    const job = await JobRepository.findById(jobId);
    if (!job) return;

    await NotificationRepository.create({
      user_id: candidateId,
      type: 'application',
      category: 'application_submitted',
      title: 'Đã nộp đơn ứng tuyển',
      message: `Bạn đã ứng tuyển vị trí "${job.title}" tại ${job.company_name || 'công ty'}.`,
      data: { application_id: applicationId, job_id: jobId }
    });
  }

  /**
   * Thông báo khi trạng thái hồ sơ thay đổi
   */
  async notifyApplicationStatusChange(candidateId, applicationId, oldStatus, newStatus, notes) {
    const application = await ApplicationRepository.findById(applicationId);
    if (!application) return;

    const statusLabels = {
      submitted: 'Đã nộp',
      shortlisted: 'Lọt vào danh sách rút gọn',
      interview_scheduled: 'Lịch phỏng vấn đã đặt',
      interviewed: 'Đã phỏng vấn',
      offered: 'Nhận được đề nghị',
      hired: 'Đã được tuyển',
      rejected: 'Bị từ chối',
      withdrawn: 'Đã rút đơn'
    };

    const title = `Trạng thái: ${statusLabels[newStatus] || newStatus}`;
    const message = notes || 
      `Hồ sơ ứng tuyển của bạn đã được cập nhật sang "${statusLabels[newStatus] || newStatus}".`;

    await NotificationRepository.create({
      user_id: candidateId,
      type: 'application',
      category: 'application_status_change',
      title,
      message,
      data: { 
        application_id: applicationId, 
        old_status: oldStatus, 
        new_status: newStatus 
      }
    });
  }

  /**
   * Thông báo khi có lịch phỏng vấn mới
   */
  async notifyInterviewScheduled(candidateId, applicationId, interviewDetails) {
    const application = await ApplicationRepository.findById(applicationId);
    if (!application) return;

    const { date, time, location, type } = interviewDetails;
    
    let message = `Lịch phỏng vấn đã được sắp xếp.`;
    if (date) message += `\n📅 Ngày: ${date}`;
    if (time) message += `\n🕐 Giờ: ${time}`;
    if (location) message += `\n📍 Địa điểm: ${location}`;
    if (type) message += `\n💼 Hình thức: ${type}`;

    await NotificationRepository.create({
      user_id: candidateId,
      type: 'interview',
      category: 'interview_scheduled',
      title: 'Lịch phỏng vấn mới',
      message,
      data: { application_id: applicationId, interview: interviewDetails }
    });
  }

  /**
   * Thông báo khi nhận được offer
   */
  async notifyOfferReceived(candidateId, applicationId, offerDetails) {
    const application = await ApplicationRepository.findById(applicationId);
    if (!application) return;

    const message = `Chúc mừng! Bạn nhận được đề nghị tuyển dụng cho vị trí "${application.job_title}".\n` +
      `Hãy xem chi tiết và phản hồi nhà tuyển dụng.`;

    await NotificationRepository.create({
      user_id: candidateId,
      type: 'interview',
      category: 'offer_received',
      title: 'Bạn nhận được đề nghị tuyển dụng!',
      message,
      data: { application_id: applicationId, offer: offerDetails }
    });
  }

  /**
   * ========================
   * RECRUITER NOTIFICATIONS
   * ========================
   */

  /**
   * Thông báo khi có ứng viên mới ứng tuyển
   */
  async notifyNewApplicant(recruiterId, applicationId, candidateInfo) {
    const { candidate_name, job_title, application_date } = candidateInfo;

    await NotificationRepository.create({
      user_id: recruiterId,
      type: 'application',
      category: 'new_applicant',
      title: 'Ứng viên mới ứng tuyển',
      message: `${candidate_name || 'Một ứng viên'} vừa ứng tuyển vào vị trí "${job_title}".\n` +
        `Ngày nộp: ${application_date || 'Hôm nay'}`,
      data: { application_id: applicationId }
    });
  }

  /**
   * Thông báo khi job sắp hết hạn
   */
  async notifyJobExpiringSoon(recruiterId, jobId, daysRemaining) {
    const job = await JobRepository.findById(jobId);
    if (!job) return;

    const message = daysRemaining === 0
      ? `Tin tuyển dụng "${job.title}" sẽ hết hạn hôm nay. Hãy gia hạn nếu bạn vẫn đang tuyển.`
      : `Tin tuyển dụng "${job.title}" sẽ hết hạn sau ${daysRemaining} ngày.`;

    await NotificationRepository.create({
      user_id: recruiterId,
      type: 'job_expiring',
      category: 'job_expiring',
      title: 'Tin tuyển dụng sắp hết hạn',
      message,
      data: { job_id: jobId, days_remaining: daysRemaining }
    });
  }

  /**
   * Thông báo khi có lịch phỏng vấn sắp tới
   */
  async notifyInterviewReminder(recruiterId, applicationId, interviewDetails) {
    const application = await ApplicationRepository.findById(applicationId);
    if (!application) return;

    const { date, time, candidate_name } = interviewDetails;

    const message = `Nhắc nhở: Lịch phỏng vấn với ${candidate_name || 'ứng viên'} vào ${date || 'sắp tới'}` +
      (time ? ` lúc ${time}` : '') + '.';

    await NotificationRepository.create({
      user_id: recruiterId,
      type: 'interview',
      category: 'interview_reminder',
      title: 'Nhắc nhở lịch phỏng vấn',
      message,
      data: { application_id: applicationId, interview: interviewDetails }
    });
  }

  /**
   * Thông báo khi ứng viên chấp nhận/từ chối offer
   */
  async notifyOfferResponse(recruiterId, applicationId, accepted) {
    const application = await ApplicationRepository.findById(applicationId);
    if (!application) return;

    const title = accepted ? 'Ứng viên chấp nhận đề nghị!' : 'Ứng viên từ chối đề nghị';
    const message = accepted
      ? `Tuyệt vời! Ứng viên đã chấp nhận đề nghị tuyển dụng cho vị trí "${application.job_title}".`
      : `Ứng viên đã từ chối đề nghị tuyển dụng cho vị trí "${application.job_title}".`;

    await NotificationRepository.create({
      user_id: recruiterId,
      type: 'application',
      category: accepted ? 'offer_accepted' : 'offer_declined',
      title,
      message,
      data: { application_id: applicationId }
    });
  }

  /**
   * Thông báo khi có tin nhắn trong hội thoại tuyển dụng.
   */
  async notifyRecruitmentMessage(recipientId, payload = {}) {
    const {
      title = 'Tin nhắn mới',
      senderName = 'người dùng',
      message = '',
      data = null,
    } = payload;

    await NotificationRepository.create({
      user_id: recipientId,
      type: 'message',
      category: 'recruitment_message',
      title,
      message: message || `Bạn có tin nhắn mới từ ${senderName}.`,
      data
    });
  }

  /**
   * ========================
   * ADMIN NOTIFICATIONS
   * ========================
   */

  /**
   * Thông báo khi có công ty chờ duyệt
   */
  async notifyPendingCompany(adminIds, companyId, companyName) {
    const notifications = adminIds.map(adminId => ({
      user_id: adminId,
      type: 'moderation',
      category: 'pending_company',
      title: 'Công ty chờ duyệt',
      message: `Công ty "${companyName}" vừa đăng ký và đang chờ xác minh.`,
      data: { company_id: companyId }
    }));

    await NotificationRepository.createBatch(notifications);
  }

  /**
   * Thông báo khi có tin tuyển dụng chờ duyệt
   */
  async notifyPendingJob(adminIds, jobId, jobTitle, companyName) {
    const notifications = adminIds.map(adminId => ({
      user_id: adminId,
      type: 'moderation',
      category: 'pending_job',
      title: 'Tin tuyển dụng chờ duyệt',
      message: `Tin tuyển dụng "${jobTitle}" từ ${companyName || 'một công ty'} đang chờ kiểm duyệt.`,
      data: { job_id: jobId }
    }));

    await NotificationRepository.createBatch(notifications);
  }

  /**
   * Thông báo khi có báo cáo vi phạm mới
   */
  async notifyNewReport(adminIds, reportId, reportType, reporterInfo) {
    const notifications = adminIds.map(adminId => ({
      user_id: adminId,
      type: 'report',
      category: 'new_report',
      title: 'Báo cáo vi phạm mới',
      message: `Có báo cáo vi phạm mới về "${reportType}" từ ${reporterInfo || 'người dùng'}.`,
      data: { report_id: reportId, report_type: reportType }
    }));

    await NotificationRepository.createBatch(notifications);
  }

  /**
   * Thông báo khi có vi phạm được phát hiện tự động
   */
  async notifyAutoDetectedViolation(adminIds, jobId, jobTitle, violations) {
    const notifications = adminIds.map(adminId => ({
      user_id: adminId,
      type: 'moderation',
      category: 'auto_detected_violation',
      title: 'Phát hiện vi phạm tự động',
      message: `Tin tuyển dụng "${jobTitle}" có ${violations.length} vấn đề cần kiểm tra: ${violations.join(', ')}.`,
      data: { job_id: jobId, violations }
    }));

    await NotificationRepository.createBatch(notifications);
  }

  /**
   * ========================
   * SYSTEM NOTIFICATIONS
   * ========================
   */

  /**
   * Gửi thông báo hệ thống cho user
   */
  async sendSystemNotification(userId, title, message, data = null) {
    await NotificationRepository.create({
      user_id: userId,
      type: 'system',
      category: 'general',
      title,
      message,
      data
    });
  }

  /**
   * Gửi thông báo hàng loạt cho nhiều users
   */
  async sendBulkNotification(userIds, title, message, data = null) {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type: 'system',
      category: 'bulk',
      title,
      message,
      data
    }));

    return await NotificationRepository.createBatch(notifications);
  }

  /**
   * ========================
   * NOTIFICATION MANAGEMENT
   * ========================
   */

  /**
   * Lấy danh sách thông báo của user
   */
  async getUserNotifications(userId, options = {}) {
    return await NotificationRepository.findByUser(userId, options);
  }

  /**
   * Lấy số thông báo chưa đọc
   */
  async getUnreadCount(userId) {
    return await NotificationRepository.countUnread(userId);
  }

  /**
   * Đánh dấu đã đọc
   */
  async markAsRead(notificationId, userId) {
    const notification = await NotificationRepository.findById(notificationId);
    if (!notification) {
      throw new AppError('Không tìm thấy thông báo', 404);
    }
    if (notification.user_id !== userId) {
      throw new AppError('Bạn không có quyền đánh dấu thông báo này', 403);
    }
    return await NotificationRepository.markAsRead(notificationId, userId);
  }

  /**
   * Đánh dấu tất cả đã đọc
   */
  async markAllAsRead(userId) {
    return await NotificationRepository.markAllAsRead(userId);
  }

  /**
   * Xóa thông báo
   */
  async deleteNotification(notificationId, userId) {
    return await NotificationRepository.delete(notificationId, userId);
  }

  /**
   * Xóa tất cả thông báo đã đọc
   */
  async clearReadNotifications(userId) {
    return await NotificationRepository.deleteRead(userId);
  }

  /**
   * Lấy thống kê thông báo
   */
  async getNotificationStats(userId) {
    return await NotificationRepository.getStatsByType(userId);
  }

  /**
   * ========================
   * BATCH JOB EXPIRING CHECK
   * ========================
   */

  /**
   * Kiểm tra và gửi thông báo job sắp hết hạn (chạy định kỳ)
   */
  async checkExpiringJobs() {
    // Lấy tất cả recruiter có jobs published sắp hết hạn trong 3 ngày
    const [expiringJobs] = await this.pool.query(`
      SELECT j.id as job_id, j.title, j.recruiter_id, j.deadline,
             DATEDIFF(j.deadline, CURDATE()) as days_remaining
      FROM jobs j
      WHERE j.status = 'published'
        AND j.deleted_at IS NULL
        AND j.deadline IS NOT NULL
        AND DATEDIFF(j.deadline, CURDATE()) BETWEEN 0 AND 3
        AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.data->>'$.job_id' = j.id 
            AND n.category = 'job_expiring'
            AND DATE(n.created_at) = CURDATE()
        )
    `);

    for (const job of expiringJobs) {
      await this.notifyJobExpiringSoon(job.recruiter_id, job.job_id, job.days_remaining);
    }

    return expiringJobs.length;
  }
}

module.exports = new NotificationService();
