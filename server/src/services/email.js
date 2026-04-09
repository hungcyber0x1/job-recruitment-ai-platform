const nodemailer = require('nodemailer');
const emailConfig = require('../config/email.config');
const logger = require('../utils/logger');
const { welcomeEmailTemplate, applicationStatusTemplate } = require('../utils/emailTemplates');

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

  async sendEmail(to, subject, html) {
    try {
      if (!emailConfig.auth.user || !emailConfig.auth.pass) {
        logger.warn('Email credentials not configured. Skipping email sending.');
        return false;
      }

      const info = await this.transporter.sendMail({
        from: emailConfig.from,
        to,
        subject,
        html,
      });

      logger.info(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error('Error sending email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(email, name) {
    // Use a default template if welcomeEmailTemplate is not defined or is a function
    const html =
      typeof welcomeEmailTemplate === 'function'
        ? welcomeEmailTemplate(name)
        : `<h1>Welcome ${name}!</h1><p>Thank you for joining our platform.</p>`;

    return this.sendEmail(email, 'Welcome to Job Recruitment AI Platform', html);
  }

  async sendApplicationStatusEmail(email, jobTitle, status) {
    const html =
      typeof applicationStatusTemplate === 'function'
        ? applicationStatusTemplate(jobTitle, status)
        : `<h1>Application Update</h1><p>Your application for ${jobTitle} is now: ${status}</p>`;

    return this.sendEmail(email, `Application Update: ${jobTitle}`, html);
  }
}

module.exports = new EmailService();
