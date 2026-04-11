/**
 * Điểm vào process: nạp biến môi trường, HTTP server, Socket.IO (chat realtime),
 * kết nối MySQL (có retry), xử lý cổng bận và lỗi chưa bắt.
 */
require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./src/config/database.config');
const logger = require('./src/utils/logger');
const { getAllowedOrigins } = require('./src/utils/allowedOrigins');

const http = require('http');
const { Server } = require('socket.io');

const DEFAULT_PORT = Number(process.env.PORT || 5000);
const FALLBACK_PORT = Number(process.env.PORT_FALLBACK || DEFAULT_PORT + 1);
const MAX_FALLBACK_PORT = FALLBACK_PORT + 5;
const DB_RETRY_DELAY_MS = Number(process.env.DB_RETRY_DELAY_MS || 5000);
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: getAllowedOrigins(),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Đăng ký sự kiện socket (auth JWT, phòng theo user, chatbot).
require('./socket')(io);

function scheduleDbConnect() {
  const tryConnect = async () => {
    try {
      await connectDB();
    } catch (error) {
      logger.error(`Database connection failed. Retrying in ${DB_RETRY_DELAY_MS}ms`, error.message);
      setTimeout(tryConnect, DB_RETRY_DELAY_MS);
    }
  };
  tryConnect();
}

/** Lắng nghe cổng; nếu EADDRINUSE thì thử cổng dự phòng (dev nhiều instance). */
function listen(port) {
  server.once('error', (error) => {
    if (error.code !== 'EADDRINUSE') {
      logger.error('Failed to start server:', error);
      process.exit(1);
      return;
    }

    if (port === DEFAULT_PORT) {
      logger.warn(`Port ${port} is busy. Retrying on primary fallback port ${FALLBACK_PORT}`);
      listen(FALLBACK_PORT);
      return;
    }

    if (port < MAX_FALLBACK_PORT) {
      const nextPort = port + 1;
      logger.warn(`Port ${port} is also busy. Retrying on next available port ${nextPort}`);
      listen(nextPort);
      return;
    }

    logger.error('Failed to start server: Multiple ports already in use.', error);
    process.exit(1);
  });

  server.listen(port, () => {
    logger.info(
      `Server is running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`
    );
    scheduleDbConnect();
  });
}

function startServer() {
  listen(DEFAULT_PORT);
}

process.on('unhandledRejection', (reason) => {
  logger.error('UNHANDLED REJECTION — shutting down');
  if (reason instanceof Error) {
    logger.error(reason.name, reason.message);
  } else {
    logger.error(String(reason));
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION — shutting down');
  if (err instanceof Error) {
    logger.error(err.name, err.message);
  } else {
    logger.error(String(err));
  }
  process.exit(1);
});

startServer();
