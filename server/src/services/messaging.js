const path = require('path');
const CandidateRepository = require('../models/Candidate');
const RecruitmentMessageRepository = require('../models/RecruitmentMessage');
const SystemSettingsRepository = require('../models/SystemSettings');
const NotificationService = require('./notification');
const AppError = require('../utils/errorHandler');
const logger = require('../utils/logger');
const { privateUploadsRoot } = require('../config/paths');
const { resolveRecruiterCompanyContext } = require('../utils/company-access');

const MAX_MESSAGE_LENGTH = 4000;
const SPAM_MAX_PER_MINUTE = 12;
const SPAM_DUPLICATE_LIMIT = 3;
const VALID_USER_STATUS = new Set(['', 'active']);
const ALLOWED_MESSAGE_TYPES = new Set(['text', 'file', 'interview_invite', 'job_info']);
const ALLOWED_ATTACHMENT_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.ppt', '.pptx']);

function normalizeRole(role) {
  const normalized = String(role || '').trim().toLowerCase();
  return normalized === 'employer' ? 'recruiter' : normalized;
}

function getDisplayName(...values) {
  return values.map((value) => String(value || '').trim()).filter(Boolean).join(' ') || null;
}

function previewText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 180);
}

function parsePositiveInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isActiveStatus(value) {
  return VALID_USER_STATUS.has(String(value || '').trim().toLowerCase());
}

function hasDeletedAt(value) {
  return value !== null && value !== undefined && value !== '';
}

function cleanText(value, maxLength = MAX_MESSAGE_LENGTH) {
  return String(value || '').replaceAll(String.fromCharCode(0), '').trim().slice(0, maxLength);
}

function safeFilename(value) {
  return path.basename(String(value || '')).replace(/[^a-zA-Z0-9._-]/g, '');
}

class MessagingService {
  async _getAccessContext(user) {
    const role = normalizeRole(user?.role);

    if (!user?.id || !['candidate', 'recruiter', 'admin'].includes(role)) {
      throw new AppError('Messaging is available for candidates, recruiters, and admins only', 403);
    }

    if (role === 'candidate') {
      const candidate = await CandidateRepository.findByUserId(user.id);
      if (!candidate) throw new AppError('Candidate profile is required to use messages', 403);
      return { role, userId: user.id, candidateId: candidate.id, companyId: null, candidate };
    }

    if (role === 'recruiter') {
      const company = await resolveRecruiterCompanyContext(user);
      if (!company) throw new AppError('Company profile is required to use messages', 403);
      return { role, userId: user.id, companyId: company.id, company };
    }

    return { role, userId: user.id, companyId: null };
  }

  _assertValidApplicationContext(context) {
    if (!context) throw new AppError('Application not found', 404);

    if (hasDeletedAt(context.company_deleted_at)) {
      throw new AppError('Company account is no longer available for messaging', 403);
    }

    if (hasDeletedAt(context.candidate_deleted_at) || !isActiveStatus(context.candidate_status)) {
      throw new AppError('Candidate account is not eligible for messaging', 403);
    }

    if (!context.recruiter_user_id) {
      throw new AppError('This application does not have an assigned recruiter', 400);
    }

    if (hasDeletedAt(context.recruiter_deleted_at) || !isActiveStatus(context.recruiter_status)) {
      throw new AppError('Recruiter account is not eligible for messaging', 403);
    }
  }

  _assertApplicationAccess(context, access) {
    this._assertValidApplicationContext(context);

    if (access.role === 'candidate' && Number(context.candidate_user_id) !== Number(access.userId)) {
      throw new AppError('Not authorized to open this application conversation', 403);
    }

    if (access.role === 'recruiter' && Number(context.company_id) !== Number(access.companyId)) {
      throw new AppError('Not authorized to open this application conversation', 403);
    }
  }

  _assertConversationAccess(conversation, access, { allowDeleted = false } = {}) {
    if (!conversation) throw new AppError('Conversation not found', 404);

    if (access.role === 'candidate') {
      if (Number(conversation.candidate_user_id) !== Number(access.userId)) {
        throw new AppError('Not authorized to access this conversation', 403);
      }
      if (!allowDeleted && hasDeletedAt(conversation.candidate_deleted_at)) {
        throw new AppError('Conversation not found', 404);
      }
    }

    if (access.role === 'recruiter') {
      if (Number(conversation.company_id) !== Number(access.companyId)) {
        throw new AppError('Not authorized to access this conversation', 403);
      }
      if (!allowDeleted && hasDeletedAt(conversation.recruiter_deleted_at)) {
        throw new AppError('Conversation not found', 404);
      }
    }
  }

  _assertConversationActorsValid(conversation) {
    if (hasDeletedAt(conversation.company_deleted_at)) {
      throw new AppError('Company account is no longer available for messaging', 403);
    }

    if (hasDeletedAt(conversation.candidate_user_deleted_at) || !isActiveStatus(conversation.candidate_status)) {
      throw new AppError('Candidate account is not eligible for messaging', 403);
    }

    if (hasDeletedAt(conversation.recruiter_user_deleted_at) || !isActiveStatus(conversation.recruiter_status)) {
      throw new AppError('Recruiter account is not eligible for messaging', 403);
    }
  }

  _assertCanSend(conversation, access) {
    this._assertConversationAccess(conversation, access);
    this._assertConversationActorsValid(conversation);

    if (conversation.status === 'closed') {
      throw new AppError('Conversation is closed', 403);
    }

    if (conversation.status === 'blocked' || conversation.blocked_by_viewer || conversation.blocked_by_counterpart) {
      throw new AppError('Conversation is blocked', 403);
    }
  }

  async _assertNotSpam(access, conversationId, body) {
    if (access.role === 'admin') return;

    const counters = await RecruitmentMessageRepository.countRecentMessages({
      senderId: access.userId,
      conversationId,
      body: previewText(body),
    });

    if (counters.last_minute_count >= SPAM_MAX_PER_MINUTE) {
      throw new AppError('Bạn đang gửi tin nhắn quá nhanh. Vui lòng thử lại sau ít phút.', 429, 'MESSAGE_SPAM_RATE_LIMIT');
    }

    if (counters.duplicate_count >= SPAM_DUPLICATE_LIMIT) {
      throw new AppError('Tin nhắn trùng lặp quá nhiều. Vui lòng điều chỉnh nội dung trước khi gửi.', 429, 'MESSAGE_DUPLICATE_LIMIT');
    }
  }

  _buildBaseMetadata(conversation, metadata = {}) {
    return {
      ...metadata,
      application_id: conversation.application_id || null,
      job_id: conversation.job_id || null,
      company_id: conversation.company_id || null,
      candidate_user_id: conversation.candidate_user_id || null,
      recruiter_user_id: conversation.recruiter_user_id || null,
    };
  }

  async listConversations(user, options = {}) {
    const access = await this._getAccessContext(user);
    const conversations = await RecruitmentMessageRepository.findConversations({
      viewerId: access.userId,
      viewerRole: access.role,
      companyId: access.companyId,
      limit: options.limit,
      offset: options.offset,
      search: options.search,
      jobId: options.jobId || options.job_id,
      status: options.status,
      includeArchived: options.includeArchived || options.include_archived,
      archived: options.archived,
    });

    const unreadTotal = conversations.reduce(
      (total, item) => total + Number(item.unread_count || 0),
      0
    );

    return {
      conversations,
      unread_total: unreadTotal,
    };
  }

  async openConversationByApplication(user, applicationId) {
    const access = await this._getAccessContext(user);
    const context = await RecruitmentMessageRepository.findApplicationContext(applicationId);
    this._assertApplicationAccess(context, access);

    let conversation = await RecruitmentMessageRepository.findConversationByApplicationId(
      applicationId,
      { viewerId: access.userId, viewerRole: access.role }
    );

    if (!conversation) {
      const conversationId = await RecruitmentMessageRepository.upsertConversationForApplication(
        context,
        access.userId
      );
      conversation = await RecruitmentMessageRepository.findConversationById(conversationId, {
        viewerId: access.userId,
        viewerRole: access.role,
      });
    }

    this._assertConversationAccess(conversation, access);
    await RecruitmentMessageRepository.markConversationRead(conversation.id, access.role, access.userId);

    const messages = await RecruitmentMessageRepository.findMessages(conversation.id);
    return { conversation, messages };
  }

  async startConversation(user, payload = {}) {
    const access = await this._getAccessContext(user);
    const applicationId = parsePositiveInt(payload.application_id || payload.applicationId);

    if (applicationId) {
      const result = await this.openConversationByApplication(user, applicationId);
      if (payload.initial_message) {
        await this.sendMessage(user, result.conversation.id, payload.initial_message);
        return this.getConversation(user, result.conversation.id);
      }
      return result;
    }

    const jobId = parsePositiveInt(payload.job_id || payload.jobId);
    const initialMessage = cleanText(payload.initial_message || payload.initialMessage || '', MAX_MESSAGE_LENGTH);
    let conversationId = null;

    if (access.role === 'recruiter') {
      const candidate = await RecruitmentMessageRepository.findCandidateContext({
        candidateId: payload.candidate_id || payload.candidateId,
        candidateUserId: payload.candidate_user_id || payload.candidateUserId,
      });
      if (!candidate) throw new AppError('Candidate not found or not eligible for messaging', 404);

      if (jobId) {
        const applicationContext = await RecruitmentMessageRepository.findApplicationContextByCandidateAndJob(
          candidate.candidate_user_id,
          jobId
        );
        if (applicationContext) {
          this._assertApplicationAccess(applicationContext, access);
          conversationId = await RecruitmentMessageRepository.upsertConversationForApplication(applicationContext, access.userId);
        }
      }

      if (!conversationId) {
        const companyContext = await RecruitmentMessageRepository.findCompanyMessagingContext(access.companyId, jobId);
        if (!companyContext) throw new AppError('Company or job context is not available for messaging', 404);
        if (hasDeletedAt(companyContext.recruiter_deleted_at) || !isActiveStatus(companyContext.recruiter_status)) {
          throw new AppError('Recruiter account is not eligible for messaging', 403);
        }

        const existing = await RecruitmentMessageRepository.findConversationByParticipants({
          candidateUserId: candidate.candidate_user_id,
          recruiterUserId: companyContext.recruiter_user_id || access.userId,
          companyId: access.companyId,
          jobId: jobId || null,
          applicationId: null,
          conversationType: 'recruiter_initiated',
          viewer: { viewerId: access.userId, viewerRole: access.role },
        });

        conversationId = existing?.id || await RecruitmentMessageRepository.createConversation({
          jobId: jobId || null,
          candidateUserId: candidate.candidate_user_id,
          recruiterUserId: companyContext.recruiter_user_id || access.userId,
          companyId: access.companyId,
          conversationType: 'recruiter_initiated',
          initiatedByUserId: access.userId,
          preview: 'Nhà tuyển dụng đã chủ động mở hội thoại',
        });
      }
    } else if (access.role === 'candidate') {
      const companyId = parsePositiveInt(payload.company_id || payload.companyId);
      if (!companyId) throw new AppError('Company is required to start a free chat', 400);
      const companyContext = await RecruitmentMessageRepository.findCompanyMessagingContext(companyId, jobId);
      if (!companyContext) throw new AppError('Company is not available for messaging', 404);
      if (hasDeletedAt(companyContext.recruiter_deleted_at) || !isActiveStatus(companyContext.recruiter_status)) {
        throw new AppError('Recruiter account is not eligible for messaging', 403);
      }

      if (jobId) {
        const applicationContext = await RecruitmentMessageRepository.findApplicationContextByCandidateAndJob(
          access.userId,
          jobId
        );
        if (applicationContext) {
          this._assertApplicationAccess(applicationContext, access);
          conversationId = await RecruitmentMessageRepository.upsertConversationForApplication(applicationContext, access.userId);
        }
      }

      if (!conversationId) {
        const freeChatEnabled = await SystemSettingsRepository.getBoolean('recruitment_free_chat_enabled', false);
        if (!freeChatEnabled) {
          throw new AppError('Bạn chỉ có thể nhắn tin sau khi đã ứng tuyển công việc.', 403, 'FREE_CHAT_DISABLED');
        }

        const existing = await RecruitmentMessageRepository.findConversationByParticipants({
          candidateUserId: access.userId,
          recruiterUserId: companyContext.recruiter_user_id || companyContext.owner_user_id,
          companyId,
          jobId: jobId || null,
          applicationId: null,
          conversationType: 'free_chat',
          viewer: { viewerId: access.userId, viewerRole: access.role },
        });

        conversationId = existing?.id || await RecruitmentMessageRepository.createConversation({
          jobId: jobId || null,
          candidateUserId: access.userId,
          recruiterUserId: companyContext.recruiter_user_id || companyContext.owner_user_id,
          companyId,
          conversationType: 'free_chat',
          initiatedByUserId: access.userId,
          preview: 'Ứng viên đã mở hội thoại tự do',
        });
      }
    } else {
      throw new AppError('Admin cannot start a new recruitment conversation from this endpoint', 403);
    }

    if (initialMessage) {
      await this.sendMessage(user, conversationId, initialMessage);
    }

    return this.getConversation(user, conversationId);
  }

  async getConversation(user, conversationId, options = {}) {
    const access = await this._getAccessContext(user);
    const conversation = await RecruitmentMessageRepository.findConversationById(conversationId, {
      viewerId: access.userId,
      viewerRole: access.role,
    });

    this._assertConversationAccess(conversation, access);
    await RecruitmentMessageRepository.markMessagesDelivered(conversationId, access.userId);

    const messages = await RecruitmentMessageRepository.findMessages(conversationId, options);
    return { conversation, messages };
  }

  async markRead(user, conversationId) {
    const access = await this._getAccessContext(user);
    const conversation = await RecruitmentMessageRepository.findConversationById(conversationId, {
      viewerId: access.userId,
      viewerRole: access.role,
    });

    this._assertConversationAccess(conversation, access);
    await RecruitmentMessageRepository.markConversationRead(conversationId, access.role, access.userId);
    return true;
  }

  async sendMessage(user, conversationId, payload) {
    const access = await this._getAccessContext(user);
    const conversation = await RecruitmentMessageRepository.findConversationById(conversationId, {
      viewerId: access.userId,
      viewerRole: access.role,
    });

    this._assertCanSend(conversation, access);

    const isPayloadObject = payload && typeof payload === 'object' && !Array.isArray(payload);
    const body = cleanText(isPayloadObject ? payload.body : payload, MAX_MESSAGE_LENGTH);
    const messageType = isPayloadObject ? String(payload.messageType || payload.message_type || 'text').trim() : 'text';
    const metadata = isPayloadObject && payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {};
    const attachment = isPayloadObject ? payload.attachment : null;

    if (!ALLOWED_MESSAGE_TYPES.has(messageType)) {
      throw new AppError('Message type is not supported', 400);
    }

    if (!body && !attachment) throw new AppError('Message body is required', 400);
    if (body.length > MAX_MESSAGE_LENGTH) throw new AppError('Message is too long', 400);

    await this._assertNotSpam(access, conversationId, attachment?.name ? `${body} ${attachment.name}` : body);

    const senderRole = access.role === 'admin' ? 'admin' : access.role;
    const message = await RecruitmentMessageRepository.createMessage({
      conversationId,
      senderId: access.userId,
      senderRole,
      body,
      messageType: attachment ? 'file' : messageType,
      attachment,
      metadata: this._buildBaseMetadata(conversation, metadata),
    });

    this._notifyRecipients({
      access,
      conversation,
      body: attachment?.name ? `📎 ${attachment.name}${body ? ` · ${body}` : ''}` : body,
    }).catch((error) => {
      logger.error('Failed to create message notification:', error.message);
    });

    return message;
  }

  _validateAttachment(file) {
    if (!file) throw new AppError('Attachment file is required', 400);
    const extension = path.extname(file.originalname || file.filename || '').toLowerCase();
    if (!ALLOWED_ATTACHMENT_EXTENSIONS.has(extension)) {
      throw new AppError('Chỉ chấp nhận file PDF, Word hoặc PowerPoint cho CV/portfolio', 400);
    }
  }

  async sendAttachment(user, conversationId, { body = '', file } = {}) {
    this._validateAttachment(file);
    const filename = safeFilename(file.filename);
    if (!filename) throw new AppError('Invalid attachment filename', 400);

    const attachment = {
      url: `/api/messages/attachments/${encodeURIComponent(filename)}`,
      name: path.basename(file.originalname || filename),
      mime: file.mimetype,
      size: file.size,
      filename,
    };

    return this.sendMessage(user, conversationId, {
      body,
      messageType: 'file',
      attachment,
      metadata: {
        upload_kind: 'cv_portfolio',
        storage: 'private',
      },
    });
  }

  async sendInterviewInvite(user, conversationId, payload = {}) {
    const access = await this._getAccessContext(user);
    if (!['recruiter', 'admin'].includes(access.role)) {
      throw new AppError('Only recruiters can send interview invitations', 403);
    }

    const when = cleanText(payload.scheduled_at || payload.scheduledAt || payload.time || '', 120);
    const mode = cleanText(payload.mode || payload.interview_type || payload.interviewType || '', 80);
    const location = cleanText(payload.location || payload.meeting_link || payload.meetingLink || '', 500);
    const note = cleanText(payload.note || payload.message || '', 1200);

    if (!when) throw new AppError('Interview time is required', 400);

    const body = [
      'Lời mời phỏng vấn',
      `Thời gian: ${when}`,
      mode ? `Hình thức: ${mode}` : null,
      location ? `Địa điểm/Link: ${location}` : null,
      note ? `Ghi chú: ${note}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    return this.sendMessage(user, conversationId, {
      body,
      messageType: 'interview_invite',
      metadata: {
        interview: {
          scheduled_at: when,
          mode: mode || null,
          location: location || null,
          note: note || null,
        },
      },
    });
  }

  async sendJobInfo(user, conversationId, payload = {}) {
    const access = await this._getAccessContext(user);
    if (!['recruiter', 'admin'].includes(access.role)) {
      throw new AppError('Only recruiters can send job information', 403);
    }

    const conversation = await RecruitmentMessageRepository.findConversationById(conversationId, {
      viewerId: access.userId,
      viewerRole: access.role,
    });
    this._assertCanSend(conversation, access);

    const title = cleanText(payload.title || conversation.job_title || 'Thông tin công việc', 180);
    const summary = cleanText(payload.summary || payload.description || '', 1500);
    const link = cleanText(payload.link || payload.url || (conversation.job_id ? `/jobs/${conversation.job_id}` : ''), 500);

    const body = [
      `Thông tin công việc: ${title}`,
      summary || null,
      link ? `Xem chi tiết: ${link}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    return this.sendMessage(user, conversationId, {
      body,
      messageType: 'job_info',
      metadata: {
        job_info: {
          job_id: conversation.job_id || null,
          title,
          summary: summary || null,
          link: link || null,
        },
      },
    });
  }

  async archiveConversation(user, conversationId, archived = true) {
    const access = await this._getAccessContext(user);
    const conversation = await RecruitmentMessageRepository.findConversationById(conversationId, {
      viewerId: access.userId,
      viewerRole: access.role,
    });
    this._assertConversationAccess(conversation, access);
    await RecruitmentMessageRepository.archiveConversation(conversationId, access.role, archived);
    return true;
  }

  async deleteConversation(user, conversationId) {
    const access = await this._getAccessContext(user);
    const conversation = await RecruitmentMessageRepository.findConversationById(conversationId, {
      viewerId: access.userId,
      viewerRole: access.role,
    });
    this._assertConversationAccess(conversation, access);
    await RecruitmentMessageRepository.deleteConversationForRole(conversationId, access.role);
    return true;
  }

  async blockConversation(user, conversationId, blocked = true) {
    const access = await this._getAccessContext(user);
    const conversation = await RecruitmentMessageRepository.findConversationById(conversationId, {
      viewerId: access.userId,
      viewerRole: access.role,
    });
    this._assertConversationAccess(conversation, access);
    await RecruitmentMessageRepository.setBlockState(conversationId, access.role, blocked);
    return true;
  }

  async getAttachment(user, filename) {
    const access = await this._getAccessContext(user);
    const cleanFilename = safeFilename(filename);
    if (!cleanFilename || cleanFilename !== String(filename || '')) {
      throw new AppError('Attachment not found', 404);
    }

    const attachment = await RecruitmentMessageRepository.findAttachmentByFilename(cleanFilename, {
      viewerId: access.userId,
      viewerRole: access.role,
      companyId: access.companyId,
    });

    if (!attachment) throw new AppError('Attachment not found', 404);

    return {
      path: path.join(privateUploadsRoot, 'messages', cleanFilename),
      name: attachment.attachment_name || cleanFilename,
      mime: attachment.attachment_mime || 'application/octet-stream',
    };
  }

  async _notifyRecipients({ access, conversation, body }) {
    const senderName =
      access.role === 'candidate'
        ? getDisplayName(conversation.candidate_name) || 'Ung vien'
        : access.role === 'recruiter'
          ? conversation.company_name || getDisplayName(conversation.recruiter_name) || 'Nha tuyen dung'
          : 'Quan tri vien';

    const recipients = [];
    if (access.role === 'candidate') {
      recipients.push({
        id: conversation.recruiter_user_id,
        title: `Tin nhan moi tu ${conversation.candidate_name || 'ung vien'}`,
      });
    } else if (access.role === 'recruiter') {
      recipients.push({
        id: conversation.candidate_user_id,
        title: `Tin nhan moi tu ${conversation.company_name || 'nha tuyen dung'}`,
      });
    } else if (access.role === 'admin') {
      recipients.push(
        { id: conversation.candidate_user_id, title: 'Tin nhan tu quan tri vien' },
        { id: conversation.recruiter_user_id, title: 'Tin nhan tu quan tri vien' }
      );
    }

    const data = {
      conversation_id: conversation.id,
      application_id: conversation.application_id,
      job_id: conversation.job_id,
      company_id: conversation.company_id,
    };

    await Promise.all(
      recipients
        .filter((recipient) => recipient.id && Number(recipient.id) !== Number(access.userId))
        .map((recipient) =>
          NotificationService.notifyRecruitmentMessage(recipient.id, {
            title: recipient.title,
            senderName,
            message: previewText(body),
            data,
          })
        )
    );
  }
}

module.exports = new MessagingService();
