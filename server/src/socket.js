/**
 * Socket.IO: JWT lúc handshake, phòng `user_{id}` cho realtime,
 * sự kiện chatbot (tôn trọng cài đặt feature flag từ admin).
 *
 * STATUS: Chỉ dùng cột `status`, không dùng `is_active`
 */
const jwt = require('jsonwebtoken');
const jwtConfig = require('./config/jwt.config');
const UserRepository = require('./models/User');
const SystemSettingsRepository = require('./models/SystemSettings');
const ChatbotService = require('./services/chatbot');
const { checkUserQuota, incrementUserQuota } = require('./middlewares/rate-limiter');
const logger = require('./utils/logger');

/** Kiem tra user co bi block khong (locked/banned/inactive/has locked_at) */
function isUserBlocked(user) {
  const rawStatus = user.status || '';
  const effectiveStatus = String(rawStatus).trim().toLowerCase();
  return (
    effectiveStatus === 'locked' ||
    effectiveStatus === 'banned' ||
    effectiveStatus === 'inactive' ||
    Boolean(user.locked_at)
  );
}

module.exports = (io) => {
  // Chuỗi xác thực: bắt buộc token và user có status hợp lệ.
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token || socket.handshake.headers['authorization']?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, jwtConfig.secret);
      const user = await UserRepository.findById(decoded.id);

      if (!user) {
        return next(new Error('Authentication error: Invalid user'));
      }

      if (isUserBlocked(user)) {
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
      let quotaBeforeIncrement = null;

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

        // Check quota BEFORE processing (remaining is pre-decrement count)
        quotaBeforeIncrement = await checkUserQuota(socket.user.id);
        if (!quotaBeforeIncrement.allowed) {
          socket.emit('chat:error', {
            message: `Bạn đã dùng hết quota tin nhắn hôm nay (${quotaBeforeIncrement.limit}/${quotaBeforeIncrement.limit}). Vui lòng thử lại vào ngày mai.`,
            quota: quotaBeforeIncrement,
          });
          return;
        }

        // Emit typing indicator start
        socket.emit('chat:typing', { isTyping: true });

        const result = await ChatbotService.processMessage(
          socket.user.id,
          trimmed,
          conversationId,
          async (chunk) => {
            socket.emit('chat:chunk', { chunk });
          }
        );

        // Increment quota after successful processing (moved into try block to ensure atomicity)
        await incrementUserQuota(socket.user.id);

        // Emit typing indicator stop
        socket.emit('chat:typing', { isTyping: false });

        // remaining is already correct (pre-decrement), no subtraction needed
        socket.emit('chat:response', {
          message: result.message,
          conversationId: result.conversationId,
          timestamp: new Date(),
          quota: {
            remaining: Math.max(0, quotaBeforeIncrement.remaining),
            limit: quotaBeforeIncrement.limit,
          },
        });
      } catch (error) {
        logger.error('Socket Chat Error:', error);
        socket.emit('chat:typing', { isTyping: false });
        socket.emit('chat:error', { message: 'Failed to process message' });
      }
    });

    socket.on('chat:typing', (_data) => {
      // Typing indicator handled client-side; server relays to other room members if needed
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.id}`);
    });

    socket.on('auth:invalidated', () => {
      logger.info(`Auth invalidated for socket: ${socket.id}`);
    });
  });

  // Global error handler for failed connections (engine-level)
  io.engine.on('connection_error', (err) => {
    logger.error(`Socket.IO engine error: ${err.message} (code: ${err.code})`);
  });
};
