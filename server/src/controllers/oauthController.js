const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');
const { encodeState, decodeState } = require('../utils/oauthState');
const { getAuthorizationUrl, exchangeCode } = require('../services/oauthProviders');
const { completeOAuthLogin } = require('../services/oauthSocialService');

const PROVIDERS = ['google', 'facebook', 'github'];

function envHas(key) {
  const v = process.env[key];
  return typeof v === 'string' && v.trim().length > 0;
}

/** Trả về provider nào đã có đủ biến môi trường (để client ẩn/hiện nút) */
exports.oauthStatus = (req, res) => {
  res.json({
    success: true,
    providers: {
      google: envHas('GOOGLE_CLIENT_ID') && envHas('GOOGLE_CLIENT_SECRET'),
      facebook: envHas('FACEBOOK_APP_ID') && envHas('FACEBOOK_APP_SECRET'),
      github: envHas('GITHUB_CLIENT_ID') && envHas('GITHUB_CLIENT_SECRET'),
    },
  });
};

function frontendBase() {
  return (process.env.AUTH_FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
}

function redirectError(res, message) {
  res.redirect(`${frontendBase()}/oauth/callback?error=${encodeURIComponent(message)}`);
}

function redirectSuccess(res, token) {
  res.redirect(`${frontendBase()}/oauth/callback#token=${encodeURIComponent(token)}`);
}

exports.startOAuth = async (req, res) => {
  const { provider } = req.params;
  if (!PROVIDERS.includes(provider)) {
    return redirectError(res, 'Provider không hợp lệ');
  }
  try {
    let intent = req.query.intent === 'register' ? 'register' : 'login';
    let role = req.query.role === 'employer' ? 'employer' : 'candidate';
    let userId;

    const linkToken = req.query.link_token;
    if (typeof linkToken === 'string' && linkToken.trim()) {
      const decoded = jwt.verify(linkToken.trim(), jwtConfig.secret);
      if (!decoded?.id) {
        return redirectError(res, 'Phiên liên kết không hợp lệ');
      }
      intent = 'link';
      userId = decoded.id;
      role = 'candidate';
    }

    const state = encodeState({ intent, role, userId });
    const url = getAuthorizationUrl(provider, state);
    return res.redirect(url);
  } catch (err) {
    return redirectError(res, err.message || 'Không thể bắt đầu đăng nhập OAuth');
  }
};

exports.oauthCallback = async (req, res) => {
  const { provider } = req.params;
  if (!PROVIDERS.includes(provider)) {
    return redirectError(res, 'Provider không hợp lệ');
  }

  const { code, state, error: oauthError } = req.query;

  if (oauthError) {
    return redirectError(res, typeof oauthError === 'string' ? oauthError : 'Đăng nhập bị hủy');
  }

  if (!code || !state) {
    return redirectError(res, 'Thiếu mã xác thực từ nhà cung cấp');
  }

  try {
    const decoded = decodeState(state);
    const profile = await exchangeCode(provider, code);
    const { token } = await completeOAuthLogin(profile, provider, decoded);
    return redirectSuccess(res, token);
  } catch (err) {
    const msg =
      err.response?.data?.error_description ||
      err.response?.data?.error?.message ||
      err.message ||
      'Đăng nhập OAuth thất bại';
    return redirectError(res, msg);
  }
};
