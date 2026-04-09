jest.mock('../../src/services/chatbot', () => ({
  processMessage: jest.fn(),
  createConversation: jest.fn(),
  getSuggestedQuestions: jest.fn(),
}));

jest.mock('../../src/repositories/system-settings', () => ({
  getBoolean: jest.fn(),
}));

const controller = require('../../src/controllers/chatbot');
const ChatbotService = require('../../src/services/chatbot');
const SystemSettingsRepository = require('../../src/repositories/system-settings');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('ChatbotController feature flags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('blocks sendMessage when ai_chatbot is disabled', async () => {
    SystemSettingsRepository.getBoolean.mockResolvedValue(false);
    const req = {
      user: { id: 7 },
      body: { message: 'hello', conversationId: 1 },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.sendMessage(req, res, next);

    expect(SystemSettingsRepository.getBoolean).toHaveBeenCalledWith('ai_chatbot', true);
    expect(ChatbotService.processMessage).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'AI chatbot is currently disabled by admin settings',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('blocks suggested questions when ai_chatbot is disabled', async () => {
    SystemSettingsRepository.getBoolean.mockResolvedValue(false);
    const req = { user: { id: 7 } };
    const res = createRes();
    const next = jest.fn();

    await controller.getSuggestedQuestions(req, res, next);

    expect(ChatbotService.getSuggestedQuestions).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
  });

  test('bound suggested questions handler still works when passed as a plain callback', async () => {
    SystemSettingsRepository.getBoolean.mockResolvedValue(false);
    const req = { user: { id: 7 } };
    const res = createRes();
    const next = jest.fn();
    const handler = controller.getSuggestedQuestions;

    await handler(req, res, next);

    expect(ChatbotService.getSuggestedQuestions).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
    expect(next).not.toHaveBeenCalled();
  });
});
