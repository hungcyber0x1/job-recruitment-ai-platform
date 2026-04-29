/**
 * Điểm vào process: nạp biến môi trường, HTTP server, Socket.IO (chat realtime),
 * kết nối MySQL (có retry), xử lý cổng bận và lỗi chưa bắt.
 */
require('dotenv').config();
const app = require('./app');
const { connectDB, closeDB } = require('./src/config/database.config');
const logger = require('./src/utils/logger');
const { getAllowedOrigins } = require('./src/utils/allowedOrigins');

const http = require('http');
const { Server } = require('socket.io');

const DEFAULT_PORT = Number(process.env.PORT || 5000);
const DB_RETRY_DELAY_MS = Number(process.env.DB_RETRY_DELAY_MS || 5000);
const server = http.createServer(app);
const activeSockets = new Set();
let isShuttingDown = false;

const io = new Server(server, {
  cors: {
    origin: getAllowedOrigins(),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Đăng ký sự kiện socket (auth JWT, phòng theo user, chatbot).
require('./socket')(io);

server.on('connection', (socket) => {
  activeSockets.add(socket);
  socket.on('close', () => {
    activeSockets.delete(socket);
  });
});

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

/** Lắng nghe cổng; nếu EADDRINUSE thì exit để nodemon tự retry sau khi port được giải phóng. */
function listen(port) {
  server.once('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(
        `Port ${port} is already in use. Exiting so nodemon can retry after the port is freed.`
      );
      process.exit(1);
      return;
    }
    logger.error('Failed to start server:', error);
    process.exit(1);
  });

  server.listen(port, () => {
    logger.info(
      `Server is running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`
    );
    scheduleDbConnect();
  });
}

function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`${signal} received — shutting down gracefully`);

  const forceShutdownTimer = setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    for (const socket of activeSockets) {
      try {
        socket.destroy();
      } catch (_error) {
        // Ignore best-effort cleanup errors while forcing shutdown.
      }
    }
    process.exit(1);
  }, 10000);

  if (typeof forceShutdownTimer.unref === 'function') {
    forceShutdownTimer.unref();
  }

  io.close(() => {
    logger.info('Socket.IO server closed');
  });

  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      await closeDB();
      clearTimeout(forceShutdownTimer);
      logger.info('Process terminated successfully');
      process.exit(0);
    } catch (err) {
      clearTimeout(forceShutdownTimer);
      logger.error('Error during shutdown:', err.message);
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('UNHANDLED REJECTION — shutting down');
  if (reason instanceof Error) {
    logger.error(reason.name, reason.message);
  } else {
    logger.error(String(reason));
  }
  shutdown('UNHANDLED_REJECTION');
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION — shutting down');
  if (err instanceof Error) {
    logger.error(err.name, err.message);
  } else {
    logger.error(String(err));
  }
  shutdown('UNCAUGHT_EXCEPTION');
});

function startServer() {
  listen(DEFAULT_PORT);
}

startServer();
