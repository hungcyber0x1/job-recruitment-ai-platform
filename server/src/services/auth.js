/**
 * Nghiệp vụ xác thực: đăng ký (transaction user + profile role), đăng nhập (bcrypt + JWT),
 * đổi mật khẩu. Token JWT chứa { id, role } — middleware protect đọc và nạp user từ DB.
 */
const UserRepository = require('../repositories/user');

const AppError = require('../utils/errorHandler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');
const { pool } = require('../config/database.config');

const REGISTER_ROLES = ['candidate', 'employer'];

class AuthService {
  async register(userData) {
    if (!REGISTER_ROLES.includes(userData.role)) {
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
      // Create the base user record
      const [result] = await connection.query(
        'INSERT INTO users (email, password, role, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
        [userData.email, hashedPassword, userData.role, userData.first_name, userData.last_name]
      );
      const userId = result.insertId;

      // Create role-specific profile
      if (userData.role === 'candidate') {
        await connection.query('INSERT INTO candidates (user_id) VALUES (?)', [userId]);
      } else if (userData.role === 'employer') {
        await connection.query('INSERT INTO employers (user_id, company_name) VALUES (?, ?)', [
          userId,
          userData.company_name || 'Chưa cập nhật',
        ]);
      }

      await connection.commit();

      // Fetch created user (without password)
      const user = await UserRepository.findById(userId);
      const { password, ...userWithoutPassword } = user;
      return { ...userWithoutPassword, has_local_password: !!password };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async login(email, password) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    if (!user.is_active) {
      throw new AppError('Tài khoản đã bị vô hiệu hóa', 403);
    }

    if (!user.password) {
      throw new AppError(
        'Tài khoản này đăng nhập bằng Google, Facebook hoặc GitHub — vui lòng dùng nút đăng nhập tương ứng',
        401
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    const token = this.generateToken(user);
    const { password: passwordHash, ...userWithoutPassword } = user;

    return {
      user: { ...userWithoutPassword, has_local_password: !!passwordHash },
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
        'Không thể hủy liên kết: bạn cần đặt mật khẩu cục bộ trước để vẫn đăng nhập được.',
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
    return jwt.sign({ id: user.id, role: user.role }, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    });
  }
}

module.exports = new AuthService();
