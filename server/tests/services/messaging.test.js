jest.mock('../../src/models/Candidate', () => ({
  findByUserId: jest.fn(),
}));

jest.mock('../../src/models/Company', () => ({
  findById: jest.fn(),
  findByUserId: jest.fn(),
}));

jest.mock('../../src/models/CompanyMember', () => ({
  COMPANY_ROLES: {
    OWNER: 'owner',
    ADMIN: 'admin',
    RECRUITER: 'recruiter',
  },
  PERMISSION_FIELDS: ['can_manage_applications', 'can_edit_job'],
  CompanyMemberRepository: {
    findByUser: jest.fn(),
  },
}));

jest.mock('../../src/models/RecruitmentMessage', () => ({
  findConversations: jest.fn(),
  findApplicationContext: jest.fn(),
  findConversationByApplicationId: jest.fn(),
  upsertConversationForApplication: jest.fn(),
  findConversationById: jest.fn(),
  findMessages: jest.fn(),
  createMessage: jest.fn(),
  markConversationRead: jest.fn(),
  markMessagesDelivered: jest.fn(),
  countRecentMessages: jest.fn(),
  archiveConversation: jest.fn(),
  deleteConversationForRole: jest.fn(),
  setBlockState: jest.fn(),
  findAttachmentByFilename: jest.fn(),
}));

jest.mock('../../src/models/SystemSettings', () => ({
  getBoolean: jest.fn(),
}));

jest.mock('../../src/services/notification', () => ({
  notifyRecruitmentMessage: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

const CandidateRepository = require('../../src/models/Candidate');
const CompanyRepository = require('../../src/models/Company');
const RecruitmentMessageRepository = require('../../src/models/RecruitmentMessage');
const NotificationService = require('../../src/services/notification');
const MessagingService = require('../../src/services/messaging');

const applicationContext = {
  application_id: 1001,
  candidate_id: 301,
  candidate_user_id: 11,
  candidate_status: 'active',
  candidate_deleted_at: null,
  recruiter_user_id: 22,
  recruiter_status: 'active',
  recruiter_deleted_at: null,
  company_id: 44,
  company_deleted_at: null,
  job_id: 900,
  job_title: 'Frontend Engineer',
  company_name: 'Acme Tech',
  candidate_name: 'Linh Tran',
};

const conversation = {
  id: 501,
  application_id: 1001,
  candidate_user_id: 11,
  recruiter_user_id: 22,
  company_id: 44,
  job_id: 900,
  job_title: 'Frontend Engineer',
  company_name: 'Acme Tech',
  candidate_name: 'Linh Tran',
  candidate_status: 'active',
  recruiter_status: 'active',
  candidate_user_deleted_at: null,
  recruiter_user_deleted_at: null,
  company_deleted_at: null,
  candidate_deleted_at: null,
  recruiter_deleted_at: null,
  blocked_by_viewer: 0,
  blocked_by_counterpart: 0,
  status: 'active',
};

describe('MessagingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    CandidateRepository.findByUserId.mockResolvedValue(null);
    CompanyRepository.findById.mockResolvedValue(null);
    CompanyRepository.findByUserId.mockResolvedValue(null);
    RecruitmentMessageRepository.findMessages.mockResolvedValue([]);
    RecruitmentMessageRepository.markConversationRead.mockResolvedValue(true);
    RecruitmentMessageRepository.markMessagesDelivered.mockResolvedValue(true);
    RecruitmentMessageRepository.countRecentMessages.mockResolvedValue({ total: 0, duplicates: 0 });
  });

  it('opens a new application-scoped conversation for the owning candidate', async () => {
    CandidateRepository.findByUserId.mockResolvedValue({ id: 301, user_id: 11 });
    RecruitmentMessageRepository.findApplicationContext.mockResolvedValue(applicationContext);
    RecruitmentMessageRepository.findConversationByApplicationId.mockResolvedValue(null);
    RecruitmentMessageRepository.upsertConversationForApplication.mockResolvedValue(501);
    RecruitmentMessageRepository.findConversationById.mockResolvedValue(conversation);

    const result = await MessagingService.openConversationByApplication(
      { id: 11, role: 'candidate' },
      1001
    );

    expect(RecruitmentMessageRepository.upsertConversationForApplication).toHaveBeenCalledWith(
      applicationContext,
      11
    );
    expect(RecruitmentMessageRepository.markConversationRead).toHaveBeenCalledWith(
      501,
      'candidate',
      11
    );
    expect(result).toEqual({ conversation, messages: [] });
  });

  it('blocks a recruiter from opening another company application conversation', async () => {
    CompanyRepository.findByUserId.mockResolvedValue({ id: 99 });
    RecruitmentMessageRepository.findApplicationContext.mockResolvedValue(applicationContext);

    await expect(
      MessagingService.openConversationByApplication({ id: 22, role: 'recruiter' }, 1001)
    ).rejects.toMatchObject({
      statusCode: 403,
      message: 'Not authorized to open this application conversation',
    });

    expect(RecruitmentMessageRepository.upsertConversationForApplication).not.toHaveBeenCalled();
  });

  it('sends a recruiter message and notifies the candidate recipient', async () => {
    CompanyRepository.findByUserId.mockResolvedValue({ id: 44 });
    RecruitmentMessageRepository.findConversationById.mockResolvedValue(conversation);
    RecruitmentMessageRepository.createMessage.mockResolvedValue({
      id: 7001,
      conversation_id: 501,
      sender_id: 22,
      sender_role: 'recruiter',
      body: 'Chao ban, minh hen phong van nhe.',
      status: 'sent',
    });

    const result = await MessagingService.sendMessage(
      { id: 22, role: 'recruiter' },
      501,
      'Chao ban, minh hen phong van nhe.'
    );

    expect(result.id).toBe(7001);
    expect(RecruitmentMessageRepository.countRecentMessages).toHaveBeenCalledWith({
      senderId: 22,
      conversationId: 501,
      body: 'Chao ban, minh hen phong van nhe.',
    });
    expect(RecruitmentMessageRepository.createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 501,
        senderId: 22,
        senderRole: 'recruiter',
        body: 'Chao ban, minh hen phong van nhe.',
        messageType: 'text',
        metadata: expect.objectContaining({
          application_id: 1001,
          job_id: 900,
          company_id: 44,
        }),
      })
    );
    expect(NotificationService.notifyRecruitmentMessage).toHaveBeenCalledWith(
      11,
      expect.objectContaining({
        title: 'Tin nhan moi tu Acme Tech',
        data: expect.objectContaining({
          conversation_id: 501,
          application_id: 1001,
          job_id: 900,
          company_id: 44,
        }),
      })
    );
  });

  it('rejects empty messages before touching the repository', async () => {
    CompanyRepository.findByUserId.mockResolvedValue({ id: 44 });
    RecruitmentMessageRepository.findConversationById.mockResolvedValue(conversation);

    await expect(
      MessagingService.sendMessage({ id: 22, role: 'recruiter' }, 501, '   ')
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Message body is required',
    });

    expect(RecruitmentMessageRepository.createMessage).not.toHaveBeenCalled();
  });

  it('rejects messages when the conversation is blocked', async () => {
    CandidateRepository.findByUserId.mockResolvedValue({ id: 301, user_id: 11 });
    RecruitmentMessageRepository.findConversationById.mockResolvedValue({
      ...conversation,
      blocked_by_viewer: 1,
    });

    await expect(
      MessagingService.sendMessage({ id: 11, role: 'candidate' }, 501, 'Em xin gui CV moi.')
    ).rejects.toMatchObject({
      statusCode: 403,
      message: 'Conversation is blocked',
    });

    expect(RecruitmentMessageRepository.createMessage).not.toHaveBeenCalled();
  });

  it('creates file messages with attachment metadata', async () => {
    CandidateRepository.findByUserId.mockResolvedValue({ id: 301, user_id: 11 });
    RecruitmentMessageRepository.findConversationById.mockResolvedValue(conversation);
    RecruitmentMessageRepository.createMessage.mockResolvedValue({
      id: 7002,
      conversation_id: 501,
      sender_id: 11,
      sender_role: 'candidate',
      message_type: 'file',
      attachment_name: 'portfolio.pdf',
    });

    const result = await MessagingService.sendAttachment({ id: 11, role: 'candidate' }, 501, {
      body: 'Em gui portfolio.',
      file: {
        filename: 'message_attachment-123.pdf',
        originalname: 'portfolio.pdf',
        mimetype: 'application/pdf',
        size: 1024,
      },
    });

    expect(result.id).toBe(7002);
    expect(RecruitmentMessageRepository.createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        messageType: 'file',
        attachment: expect.objectContaining({
          name: 'portfolio.pdf',
          mime: 'application/pdf',
          size: 1024,
          filename: 'message_attachment-123.pdf',
          url: '/api/messages/attachments/message_attachment-123.pdf',
        }),
      })
    );
  });
});
