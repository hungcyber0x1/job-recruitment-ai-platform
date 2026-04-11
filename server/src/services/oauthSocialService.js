const { pool } = require('../config/database.config');
const UserRepository = require('../models/User');
const AuthService = require('./auth');
const AppError = require('../utils/errorHandler');

function stripUser(user) {
  if (!user) return user;
  const { password: _p, ...rest } = user;
  return rest;
}

function resolveRole(state) {
  if (state.intent === 'register') {
    return state.role === 'employer' ? 'employer' : 'candidate';
  }
  return 'candidate';
}

async function createOAuthUser(profile, role, provider, providerId) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const [result] = await connection.query(
      `INSERT INTO users (
        email, password, role, first_name, last_name, avatar_url,
        oauth_provider, oauth_provider_id, status, is_active
      ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 'active', 1)`,
      [
        profile.email,
        role,
        profile.firstName,
        profile.lastName,
        profile.avatarUrl,
        provider,
        providerId,
      ]
    );
    const userId = result.insertId;

    if (role === 'candidate') {
      await connection.query('INSERT INTO candidates (user_id) VALUES (?)', [userId]);
    } else if (role === 'employer') {
      const companyName =
        `${profile.firstName} ${profile.lastName}`.trim() ||
        profile.email.split('@')[0] ||
        'Doanh nghiệp';
      await connection.query('INSERT INTO employers (user_id, company_name) VALUES (?, ?)', [
        userId,
        companyName,
      ]);
    }

    await connection.commit();
    return UserRepository.findById(userId);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * @param {object} profile — từ oauthProviders.exchangeCode
 * @param {string} provider — google | facebook | github
 * @param {object} state — decodeState
 */
async function completeOAuthLogin(profile, provider, state) {
  if (!profile.email) {
    throw new AppError('Không lấy được email từ nhà cung cấp', 400);
  }
  profile.email = String(profile.email).trim().toLowerCase();

  if (state.intent === 'link' && state.userId) {
    const linkedOther = await UserRepository.findByOAuthProvider(provider, profile.providerId);
    if (linkedOther && linkedOther.id !== state.userId) {
      throw new AppError('Tài khoản mạng xã hội này đã được liên kết với user khác', 400);
    }

    const localUser = await UserRepository.findById(state.userId);
    if (!localUser) {
      throw new AppError('Không tìm thấy tài khoản', 404);
    }

    if (localUser.oauth_provider && localUser.oauth_provider !== provider) {
      throw new AppError(
        `Đã liên kết ${localUser.oauth_provider}. Hãy hủy liên kết trước khi dùng nhà cung cấp khác.`,
        400
      );
    }

    await UserRepository.linkOAuth(localUser.id, provider, profile.providerId, profile.avatarUrl);
    const fresh = await UserRepository.findById(localUser.id);
    const token = AuthService.generateToken(fresh);
    return { user: stripUser(fresh), token };
  }

  let user = await UserRepository.findByOAuthProvider(provider, profile.providerId);
  if (user) {
    const token = AuthService.generateToken(user);
    return { user: stripUser(user), token };
  }

  user = await UserRepository.findByEmail(profile.email);
  if (user) {
    if (user.oauth_provider && user.oauth_provider !== provider) {
      throw new AppError('Email này đã đăng ký bằng kênh đăng nhập khác', 400);
    }
    if (!user.oauth_provider_id) {
      await UserRepository.linkOAuth(user.id, provider, profile.providerId, profile.avatarUrl);
    }
    const fresh = await UserRepository.findById(user.id);
    const token = AuthService.generateToken(fresh);
    return { user: stripUser(fresh), token };
  }

  const role = resolveRole(state);
  try {
    const created = await createOAuthUser(profile, role, provider, profile.providerId);
    const token = AuthService.generateToken(created);
    return { user: stripUser(created), token };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const again = await UserRepository.findByEmail(profile.email);
      if (again) {
        await UserRepository.linkOAuth(again.id, provider, profile.providerId, profile.avatarUrl);
        const fresh = await UserRepository.findById(again.id);
        return { user: stripUser(fresh), token: AuthService.generateToken(fresh) };
      }
    }
    throw err;
  }
}

module.exports = { completeOAuthLogin };
