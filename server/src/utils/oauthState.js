const crypto = require('crypto');
const jwtConfig = require('../config/jwt.config');

const getSecret = () => {
  const o = process.env.OAUTH_STATE_SECRET;
  const t = typeof o === 'string' ? o.trim() : '';
  if (t.length > 0) return t;
  return jwtConfig.secret;
};

/**
 * State HMAC để chống giả mạo; hết hạn sau 20 phút.
 */
function encodeState(payload) {
  const intent =
    payload.intent === 'register' ? 'register' : payload.intent === 'link' ? 'link' : 'login';
  const data = {
    intent,
    role: ['candidate', 'employer'].includes(payload.role) ? payload.role : 'candidate',
    t: Date.now(),
  };
  if (intent === 'link' && payload.userId != null) {
    const uid = Number(payload.userId);
    if (Number.isFinite(uid) && uid > 0) {
      data.userId = uid;
    }
  }
  const dataStr = JSON.stringify(data);
  const sig = crypto.createHmac('sha256', getSecret()).update(dataStr).digest('hex');
  return Buffer.from(JSON.stringify({ data, sig })).toString('base64url');
}

function decodeState(state) {
  if (!state || typeof state !== 'string') {
    throw new Error('Thiếu state OAuth');
  }
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
  } catch {
    throw new Error('State OAuth không hợp lệ hoặc bị hỏng');
  }
  const { data, sig } = parsed || {};
  if (!data || typeof data !== 'object' || Array.isArray(data) || typeof sig !== 'string') {
    throw new Error('State OAuth không hợp lệ');
  }
  if (typeof data.t !== 'number' || !Number.isFinite(data.t)) {
    throw new Error('State OAuth không hợp lệ');
  }
  const dataStr = JSON.stringify(data);
  const expected = crypto.createHmac('sha256', getSecret()).update(dataStr).digest('hex');
  if (sig !== expected) {
    throw new Error('State OAuth không hợp lệ');
  }
  if (Date.now() - data.t > 20 * 60 * 1000) {
    throw new Error('Phiên đăng nhập OAuth đã hết hạn');
  }
  return data;
}

module.exports = { encodeState, decodeState };
