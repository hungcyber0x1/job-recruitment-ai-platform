const { pool } = require('../config/database.config');
const UserRepository = require('../models/User');
const AuthService = require('./auth');
const AppError = require('../utils/errorHandler');

/**
 * OAuth Social Service - Xử lý đăng nhập/đăng ký qua mạng xã hội
 * ⚠️  STATUS: Chỉ dùng cột `status` trong logic, nhưng đồng bộ cả `is_active` cho tương thích DB
 */

function stripUser(user) {
  if (!user) return user;
  const { password: _p, password_hash: _ph, ...rest } = user;
  return rest;
}

function resolveRole(state) {
  if (state.intent === 'register') {
    return state.role === 'recruiter' ? 'recruiter' : 'candidate';
  }
  return 'candidate';
}

async function createOAuthUser(profile, role, provider, providerId) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    /**
     * Chỉ định status='active' cho OAuth user mới.
     * Cột is_active được đặt =1 để đồng bộ DB (legacy support).
     */
    const result = await UserRepository.createAuthUser(connection, {
      email: profile.email,
      passwordHash: null,
      role,
      firstName: profile.firstName,
      lastName: profile.lastName,
      status: 'active',
    });
    const userId = result.insertId;

    const authColumns = await UserRepository.getColumnMap(connection);
    const oauthFields = [];
    const oauthParams = [];
    const setOauthField = (field, value) => {
      if (!authColumns.has(field)) return;
      oauthFields.push(`${field} = ?`);
      oauthParams.push(value);
    };

    setOauthField('avatar_url', profile.avatarUrl);
    setOauthField('oauth_provider', provider);
    setOauthField('oauth_provider_id', providerId);

    if (oauthFields.length > 0) {
      oauthParams.push(userId);
      await connection.query(
        `UPDATE users SET ${oauthFields.join(', ')} WHERE id = ?`,
        oauthParams
      );
    }

    const companyName =
      `${profile.firstName} ${profile.lastName}`.trim() ||
      profile.email.split('@')[0] ||
      'Doanh nghiệp';
    await AuthService.insertRoleProfile(connection, role, userId, companyName);

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
    await UserRepository.recordSuccessfulLogin(fresh.id);
    return { user: stripUser(fresh), token };
  }

  let user = await UserRepository.findByOAuthProvider(provider, profile.providerId);
  if (user) {
    const token = AuthService.generateToken(user);
    await UserRepository.recordSuccessfulLogin(user.id);
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
    await UserRepository.recordSuccessfulLogin(fresh.id);
    return { user: stripUser(fresh), token };
  }

  const role = resolveRole(state);
  try {
    const created = await createOAuthUser(profile, role, provider, profile.providerId);
    const token = AuthService.generateToken(created);
    await UserRepository.recordSuccessfulLogin(created.id);
    return { user: stripUser(created), token };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const again = await UserRepository.findByEmail(profile.email);
      if (again) {
        await UserRepository.linkOAuth(again.id, provider, profile.providerId, profile.avatarUrl);
        const fresh = await UserRepository.findById(again.id);
        const token = AuthService.generateToken(fresh);
        await UserRepository.recordSuccessfulLogin(fresh.id);
        return { user: stripUser(fresh), token };
      }
    }
    throw err;
  }
}

module.exports = { completeOAuthLogin };
