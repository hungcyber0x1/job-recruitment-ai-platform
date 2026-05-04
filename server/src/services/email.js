const nodemailer = require('nodemailer');
const emailConfig = require('../config/email.config');
const logger = require('../utils/logger');
const templates = require('../utils/emailTemplates');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: emailConfig.service,
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass,
      },
    });
  }

  // ─── Core send method ───────────────────────────────────────────────────────
  async sendEmail(to, subject, html) {
    const EmailLogRepository = require('../models/EmailLog');
    let status = 'sent';
    let errorMessage = null;

    try {
      if (!emailConfig.auth.user || !emailConfig.auth.pass) {
        logger.warn('Email credentials not configured. Skipping email sending.');
        status = 'failed';
        errorMessage = 'Email credentials not configured';
        await EmailLogRepository.create({
          recipient: to,
          subject,
          body_html: html,
          status,
          error_message: errorMessage,
        });
        return false;
      }

      const info = await this.transporter.sendMail({
        from: emailConfig.from,
        to,
        subject,
        html,
      });

      logger.info(`Email sent: ${info.messageId}`);
      await EmailLogRepository.create({ recipient: to, subject, body_html: html, status: 'sent' });
      return true;
    } catch (error) {
      logger.error('Error sending email:', error);
      try {
        await EmailLogRepository.create({
          recipient: to,
          subject,
          body_html: html,
          status: 'failed',
          error_message: error.message,
        });
      } catch (_) {
        /* ignore secondary failure */
      }
      return false;
    }
  }

  // ─── Legacy methods (kept for backward compatibility) ────────────────────────
  async sendWelcomeEmail(email, name) {
    return this.sendEmail(
      email,
      `Chào mừng ${name} đến với HireBOT!`,
      templates.welcomeEmail(name)
    );
  }

  async sendApplicationStatusEmail(email, jobTitle, status) {
    const html = templates.applicationStatusTemplate
      ? templates.applicationStatusTemplate(jobTitle, status)
      : `<p>Đơn ứng tuyển cho <strong>${jobTitle}</strong> đã chuyển sang: <strong>${status}</strong>.</p>`;
    return this.sendEmail(email, `Cập nhật đơn ứng tuyển: ${jobTitle}`, html);
  }

  async sendAccountApprovalEmail(email, name) {
    return this.sendEmail(
      email,
      'Chúc mừng! Tài khoản nhà tuyển dụng của bạn đã được phê duyệt',
      templates.accountApproved(name)
    );
  }

  // ─── Pipeline stage emails ───────────────────────────────────────────────────

  /**
   * Gửi email khi ứng viên nộp đơn thành công
   */
  async sendApplicationSubmitted(email, { candidateName, jobTitle, companyName }) {
    return this.sendEmail(
      email,
      `Đơn ứng tuyển vị trí "${jobTitle}" đã được gửi`,
      templates.applicationSubmitted(candidateName, jobTitle, companyName)
    );
  }

  /**
   * Gửi email khi lịch phỏng vấn được sắp xếp
   */
  async sendInterviewScheduled(email, details) {
    const round = details.round || 1;
    return this.sendEmail(
      email,
      `📅 Lịch phỏng vấn vòng ${round} — ${details.jobTitle}`,
      templates.interviewScheduled(details)
    );
  }

  /**
   * Gửi email khi candidate nhận được offer
   */
  async sendOfferReceived(email, details) {
    return this.sendEmail(
      email,
      `🎉 Bạn nhận được đề nghị tuyển dụng từ ${details.companyName}`,
      templates.offerReceived(details)
    );
  }

  /**
   * Gửi email khi đơn bị từ chối
   */
  async sendApplicationRejected(email, details) {
    return this.sendEmail(
      email,
      `Kết quả ứng tuyển vị trí "${details.jobTitle}"`,
      templates.applicationRejected(details)
    );
  }

  /**
   * Gửi email khi ứng viên được hired
   */
  async sendApplicationHired(email, details) {
    return this.sendEmail(
      email,
      `🎊 Chúc mừng! Bạn đã được tuyển vào vị trí "${details.jobTitle}"`,
      templates.applicationHired(details)
    );
  }

  /**
   * Gửi email cho recruiter khi ứng viên rút đơn
   */
  async sendApplicationWithdrawn(email, details) {
    return this.sendEmail(
      email,
      `Ứng viên ${details.candidateName} vừa rút đơn — ${details.jobTitle}`,
      templates.applicationWithdrawn(details)
    );
  }
}

module.exports = new EmailService();
