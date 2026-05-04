/**
 * API Express monolith: middleware toàn cục, auth, REST nội bộ (không proxy microservice).
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const routes = require('./routes/index');
const authRoutes = require('./routes/auth');
const errorMiddleware = require('./middlewares/error');
const { generalLimiter } = require('./middlewares/rate-limiter');
const { auditMiddleware } = require('./middlewares/audit');
const { requestIdMiddleware } = require('./middlewares/request-id');
const { getAllowedOrigins } = require('./utils/allowedOrigins');
const { uploadsRoot, clientDistRoot } = require('./config/paths');

const app = express();
const clientIndexPath = path.join(clientDistRoot, 'index.html');
const hasClientBuild = fs.existsSync(clientIndexPath);

app.use(requestIdMiddleware);

morgan.token('req-id', (req) => req.id || '-');

require('./config/swagger')(app);

const allowedOrigins = getAllowedOrigins();

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    const corsError = new Error(`CORS: Origin ${origin} not allowed`);
    corsError.statusCode = 403;
    corsError.status = 'fail';
    corsError.isOperational = true;
    callback(corsError);
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", ...allowedOrigins],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
  })
);
app.use(cors(corsOptions));

app.use(
  morgan(
    process.env.NODE_ENV === 'production'
      ? ':req-id :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'
      : ':req-id :method :url :status :response-time ms - :res[content-length]'
  )
);

// Blog / rich text cần payload lớn hơn 10kb; giữ mức vừa phải để tránh abuse.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/uploads', express.static(uploadsRoot));

app.use(auditMiddleware);

app.use('/api', generalLimiter);

app.use('/api/auth', authRoutes);
app.use('/api', routes);

if (hasClientBuild) {
  app.use(express.static(clientDistRoot));
  app.get(
    /^\/(?!api(?:\/|$)|uploads(?:\/|$)|socket\.io(?:\/|$)|api-docs(?:\/|$)).*/,
    (_req, res) => {
      res.sendFile(clientIndexPath);
    }
  );
}

app.use((req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  err.statusCode = 404;
  next(err);
});

app.use(errorMiddleware);

module.exports = app;
