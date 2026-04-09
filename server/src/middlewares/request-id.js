const { randomUUID } = require('crypto');

/**
 * Gán req.id và header X-Request-Id (echo từ client nếu có) để trace log.
 */
function requestIdMiddleware(req, res, next) {
  const fromClient = req.headers['x-request-id'];
  const id =
    typeof fromClient === 'string' && fromClient.trim().length > 0 && fromClient.length <= 128
      ? fromClient.trim()
      : randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}

module.exports = { requestIdMiddleware };
