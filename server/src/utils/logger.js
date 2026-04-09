const winston = require('winston');
const path = require('path');

const normalizeMeta = (meta) => {
  if (meta instanceof Error) {
    return {
      errorName: meta.name,
      errorMessage: meta.message,
      stack: meta.stack,
    };
  }

  if (typeof meta === 'string') {
    return { detail: meta };
  }

  return meta;
};

const addErrorOverloadSupport = (loggerInstance) => {
  ['error', 'warn', 'info'].forEach((level) => {
    const original = loggerInstance[level].bind(loggerInstance);

    loggerInstance[level] = (message, meta) => {
      if (typeof message === 'string' && meta !== undefined) {
        return original(message, normalizeMeta(meta));
      }

      return original(message);
    };
  });

  return loggerInstance;
};

// Function to create a logger with dynamic service metadata
const createLogger = (serviceName) => {
  const loggerInstance = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    ),
    defaultMeta: { service: serviceName }, // Dynamic service metadata
    transports: [
      new winston.transports.File({
        filename: path.join(__dirname, '../../logs/error.log'),
        level: 'error',
      }),
      new winston.transports.File({ filename: path.join(__dirname, '../../logs/combined.log') }),
    ],
  });

  return addErrorOverloadSupport(loggerInstance);
};

// Export a default logger instance, e.g., for 'gateway-server'
const logger = createLogger('gateway-server');

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    })
  );
}

module.exports = logger;
