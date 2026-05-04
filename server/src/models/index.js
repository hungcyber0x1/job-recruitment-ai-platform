/**
 * Models barrel export
 * Cho phép import từ một chỗ: require('../models')
 */
const UserRepository = require('./User');
const JobRepository = require('./Job');
const ApplicationRepository = require('./Application');
const CompanyRepository = require('./Company');
const CandidateRepository = require('./Candidate');
const ActivityLogRepository = require('./ActivityLog');
const AuditLogRepository = require('./AuditLog');
const SystemSettingsRepository = require('./SystemSettings');
const BlogRepository = require('./Blog');
const CategoryRepository = require('./Category');
const SkillRepository = require('./Skill');
const NotificationRepository = require('./Notification');
const SupportTicketRepository = require('./SupportTicket');
const ResumeAnalysisRepository = require('./ResumeAnalysis');

module.exports = {
  UserRepository,
  JobRepository,
  ApplicationRepository,
  CompanyRepository,
  CandidateRepository,
  ActivityLogRepository,
  AuditLogRepository,
  SystemSettingsRepository,
  BlogRepository,
  CategoryRepository,
  SkillRepository,
  NotificationRepository,
  SupportTicketRepository,
  ResumeAnalysisRepository,
};
