/**
 * Điểm vào process: nạp biến môi trường, HTTP server, Socket.IO (chat realtime),
 * kết nối MySQL (có retry), xử lý cổng bận và lỗi chưa bắt.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const app = require('./app');
const { connectDB, closeDB } = require('./config/database.config');
const logger = require('./utils/logger');
const { getAllowedOrigins } = require('./utils/allowedOrigins');

const http = require('http');
const { Server } = require('socket.io');

const DEFAULT_PORT = 5000;
const PRIMARY_PORT = normalizePort(process.env.PORT, DEFAULT_PORT);
const DB_RETRY_DELAY_MS = Number(process.env.DB_RETRY_DELAY_MS || 5000);
const PORT_FALLBACK_ATTEMPTS = Math.max(
  0,
  Number.parseInt(process.env.PORT_FALLBACK_ATTEMPTS || '10', 10) || 0
);
const ENABLE_PORT_FALLBACK =
  process.env.NODE_ENV !== 'production' && process.env.PORT_FALLBACK_DISABLED !== 'true';
const PORT_CANDIDATES = buildPortCandidates(PRIMARY_PORT);
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

function normalizePort(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isInteger(parsed) && parsed > 0 && parsed < 65536) {
    return parsed;
  }
  return fallback;
}

function parsePortList(raw) {
  return String(raw || '')
    .split(',')
    .map((port) => normalizePort(port.trim(), 0))
    .filter(Boolean);
}

function buildPortCandidates(primaryPort) {
  const configuredFallbacks = parsePortList(
    process.env.PORT_FALLBACKS || process.env.PORT_FALLBACK
  );
  const candidates = [primaryPort, ...configuredFallbacks];

  if (ENABLE_PORT_FALLBACK) {
    for (let offset = 1; offset <= PORT_FALLBACK_ATTEMPTS; offset += 1) {
      candidates.push(primaryPort + offset);
    }
  }

  return [...new Set(candidates.filter((port) => port > 0 && port < 65536))];
}

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

/** Lắng nghe cổng; dev sẽ thử PORT_FALLBACK/port kế tiếp nếu EADDRINUSE. */
function listen(portCandidates, index = 0) {
  const candidates = Array.isArray(portCandidates) ? portCandidates : [portCandidates];
  const port = candidates[index];

  if (!port) {
    logger.error('No valid port available. Set PORT to a value between 1 and 65535.');
    process.exit(1);
    return;
  }

  const onError = (error) => {
    server.removeListener('listening', onListening);

    if (error.code === 'EADDRINUSE') {
      const nextPort = candidates[index + 1];

      if (nextPort) {
        logger.warn(`Port ${port} is already in use. Trying fallback port ${nextPort}.`);
        listen(candidates, index + 1);
        return;
      }

      logger.error(
        `Port ${port} is already in use. Stop the process using this port or set PORT_FALLBACK/PORT_FALLBACKS.`
      );
      process.exit(1);
      return;
    }
    logger.error('Failed to start server:', error);
    process.exit(1);
  };

  function onListening() {
    server.removeListener('error', onError);
    process.env.PORT = String(port);
    logger.info(
      `Server is running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`
    );

    if (port !== PRIMARY_PORT) {
      logger.warn(
        `Server started on fallback port ${port}. If this is the only gateway instance, update client/.env VITE_DEV_PROXY_TARGET and VITE_SOCKET_ORIGIN to http://127.0.0.1:${port}.`
      );
    }

    scheduleDbConnect();
  }

  server.once('error', onError);
  server.once('listening', onListening);
  server.listen(port);
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
      } catch {
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
  listen(PORT_CANDIDATES);
}

startServer();
