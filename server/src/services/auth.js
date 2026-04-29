/**
 * Nghiệp vụ xác thực: đăng ký (transaction user + profile role), đăng nhập (bcrypt + JWT),
 * đổi mật khẩu. Token JWT chứa { id, role } — middleware protect đọc và nạp user từ DB.
 *
 * ⚠️  STATUS: Chỉ dùng cột `status`, không fallback về `is_active`
 * ⚠️   ROLE: Sử dụng 'recruiter' thay vì 'employer'
 * ⚠️   TABLE: Sử dụng `candidate_profiles` và `company_profiles`
 */
const UserRepository = require('../models/User');

const AppError = require('../utils/errorHandler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');
const { pool } = require('../config/database.config');
const { toUserContract } = require('../utils/user-contract');
const { USER_STATUS } = require('../utils/constants');

const REGISTER_ROLES = ['candidate', 'recruiter'];
const LEGACY_ROLE_ALIASES = {
  employer: 'recruiter',
};
let recruiterStorageRolePromise;

function normalizeAuthRole(role) {
  const normalizedRole = String(role ?? '').trim().toLowerCase();
  return LEGACY_ROLE_ALIASES[normalizedRole] || normalizedRole;
}

class AuthService {
  normalizeRole(role) {
    return normalizeAuthRole(role);
  }

  async getStoredRole(role, queryable = pool) {
    const normalizedRole = this.normalizeRole(role);
    if (normalizedRole !== 'recruiter') {
      return normalizedRole;
    }

    if (!recruiterStorageRolePromise) {
      recruiterStorageRolePromise = queryable
        .query("SHOW COLUMNS FROM users LIKE 'role'")
        .then(([rows]) => {
          const roleType = String(rows?.[0]?.Type ?? '').toLowerCase();
          return roleType.includes('recruiter') ? 'recruiter' : 'employer';
        })
        .catch((error) => {
          recruiterStorageRolePromise = null;
          throw error;
        });
    }

    return recruiterStorageRolePromise;
  }

  async insertRoleProfile(connection, role, userId, companyName) {
    if (role === 'candidate') {
      try {
        await connection.query('INSERT INTO candidate_profiles (user_id) VALUES (?)', [userId]);
      } catch (error) {
        if (error?.code !== 'ER_NO_SUCH_TABLE') {
          throw error;
        }
        await connection.query('INSERT INTO candidates (user_id) VALUES (?)', [userId]);
      }
      return;
    }

    if (role === 'recruiter') {
      try {
        await connection.query('INSERT INTO company_profiles (user_id, company_name) VALUES (?, ?)', [
          userId,
          companyName || 'Chưa cập nhật',
        ]);
      } catch (error) {
        if (error?.code !== 'ER_NO_SUCH_TABLE') {
          throw error;
        }
        await connection.query('INSERT INTO employers (user_id, company_name) VALUES (?, ?)', [
          userId,
          companyName || 'Chưa cập nhật',
        ]);
      }
    }
  }

  getEffectiveStatus(user = {}) {
    const rawStatus = String(user.status || '').trim().toLowerCase();

    if (rawStatus) {
      return rawStatus;
    }

    // Nếu không có status, mặc định là active
    return USER_STATUS.ACTIVE;
  }

  shouldIssueToken(user = {}) {
    const role = this.normalizeRole(user?.role);

    if (!user?.id || !role) {
      return false;
    }

    const status = this.getEffectiveStatus(user);

    if ([USER_STATUS.BANNED, USER_STATUS.SUSPENDED, 'blocked'].includes(status)) {
      return false;
    }

    if (role === 'recruiter' && [USER_STATUS.PENDING_VERIFICATION, 'pending'].includes(status)) {
      return false;
      // return false; // Tạm thời bỏ chặn cấp token cho nhà tuyển dụng pending
    }

    return true;
  }

  async register(userData) {
    const normalizedRole = this.normalizeRole(userData.role);

    if (!REGISTER_ROLES.includes(normalizedRole)) {
      throw new AppError('Role không hợp lệ', 400);
    }

    const existingUser = await UserRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError('Email đã được sử dụng', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Use a transaction to ensure user + profile are created atomically
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Determine initial status based on role
      // Thay đổi: Cho phép nhà tuyển dụng active ngay lập tức
      const initialStatus =
        normalizedRole === 'recruiter' ? USER_STATUS.PENDING_VERIFICATION : USER_STATUS.ACTIVE;
      const storedRole = await this.getStoredRole(normalizedRole, connection);

      // Create the base user record
      const [result] = await connection.query(
        'INSERT INTO users (email, password, role, first_name, last_name, status) VALUES (?, ?, ?, ?, ?, ?)',
        [
          userData.email,
          hashedPassword,
          storedRole,
          userData.first_name,
          userData.last_name,
          initialStatus,
        ]
      );
      const userId = result.insertId;

      // Create role-specific profile
      await this.insertRoleProfile(connection, normalizedRole, userId, userData.company_name);

      await connection.commit();

      // Fetch created user (without password)
      const user = await UserRepository.findById(userId);
      return {
        ...toUserContract(user),
        has_local_password: Boolean(user?.password),
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async login(email, password) {
    const user = await UserRepository.findByEmail(email);

    const role = user ? this.normalizeRole(user.role) : null;
    const effectiveStatus = user ? this.getEffectiveStatus(user) : null;

    if (user && [USER_STATUS.BANNED, USER_STATUS.SUSPENDED].includes(effectiveStatus)) {
      throw new AppError('Tài khoản đã bị khóa hoặc đánh dấu vi phạm', 403, 'ACCOUNT_SUSPENDED');
    }

    if (!user) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401, 'INVALID_CREDENTIALS');
    }

    if (role === 'recruiter' && [USER_STATUS.PENDING_VERIFICATION, 'pending'].includes(effectiveStatus)) {
      throw new AppError(
        'Tai khoan nha tuyen dung dang cho quan tri vien phe duyet',
        403,
        'RECRUITER_PENDING_APPROVAL'
      );
    }

    if (!user.password) {
      throw new AppError(
        'Tài khoản này đăng nhập bằng Google, Facebook hoặc GitHub — vui lòng dùng nút đăng nhập tương ứng',
        401,
        'OAUTH_ONLY_ACCOUNT'
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401, 'INVALID_CREDENTIALS');
    }

    const userContract = {
      ...toUserContract({
        ...user,
        role,
      }),
      has_local_password: Boolean(user?.password),
    };
    const token = this.generateToken({ ...user, role });
    return {
      user: userContract,
      token,
    };
  }

  async updatePassword(userId, currentPassword, newPassword) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.password) {
      throw new AppError(
        'Tài khoản chỉ đăng nhập qua mạng xã hội — không có mật khẩu cục bộ để đổi.',
        400
      );
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 401);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await UserRepository.updatePassword(userId, passwordHash);
    return true;
  }

  async unlinkOAuth(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    if (!user.password) {
      throw new AppError(
        'Tài khoản chỉ đăng nhập qua mạng xã hội — không có mật khẩu cục bộ để đổi.',
        400
      );
    }
    if (!user.oauth_provider) {
      throw new AppError('Chưa có tài khoản mạng xã hội liên kết', 400);
    }
    await UserRepository.unlinkOAuth(userId);
    return true;
  }

  generateToken(user) {
    return jwt.sign(
      { id: user.id, role: this.normalizeRole(user?.role) },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );
  }
}

module.exports = new AuthService();
