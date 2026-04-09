/**
 * Socket.IO: JWT lúc handshake, phòng `user_{id}` cho realtime,
 * sự kiện chatbot (tôn trọng cài đặt feature flag từ admin).
 */
const jwt = require('jsonwebtoken');
const jwtConfig = require('./config/jwt.config');
const UserRepository = require('./repositories/user');
const SystemSettingsRepository = require('./repositories/system-settings');
const ChatbotService = require('./services/chatbot');
const logger = require('./utils/logger');

module.exports = (io) => {
  // Chuỗi xác thực: bắt buộc token và user còn hoạt động.
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token || socket.handshake.headers['authorization']?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, jwtConfig.secret);
      const user = await UserRepository.findById(decoded.id);

      if (!user || !user.is_active) {
        return next(new Error('Authentication error: Invalid user'));
      }

      socket.user = user;
      next();
    } catch (err) {
      logger.error('Socket Auth Error:', err);
      next(new Error('Authentication error: ' + err.message));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User connected to socket: ${socket.user.email} (${socket.id})`);
    socket.join(`user_${socket.user.id}`);

    socket.on('chat:message', async (data) => {
      try {
        const chatbotEnabled = await SystemSettingsRepository.getBoolean('ai_chatbot', true);
        if (!chatbotEnabled) {
          socket.emit('chat:error', {
            message: 'AI chatbot is currently disabled by admin settings',
          });
          return;
        }

        const { message, conversationId } = data || {};
        const trimmed = typeof message === 'string' ? message.trim() : '';
        if (!trimmed) {
          socket.emit('chat:error', { message: 'Message is required' });
          return;
        }

        const result = await ChatbotService.processMessage(socket.user.id, trimmed, conversationId);

        socket.emit('chat:response', {
          message: result.message,
          conversationId: result.conversationId,
          timestamp: new Date(),
        });
      } catch (error) {
        logger.error('Socket Chat Error:', error);
        socket.emit('chat:error', { message: 'Failed to process message' });
      }
    });

    socket.on('chat:typing', (_data) => {});

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.id}`);
    });
  });
};
