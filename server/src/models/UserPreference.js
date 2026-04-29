const BaseRepository = require('./Base');

const TABLE_NAME = 'user_preferences';

const DEFAULT_NOTIFICATION_PREFERENCES = {
  application_update: true,
  interview_invite: true,
  company_news: false,
  market_insights: false,
  marketing: false,
};

const EMAIL_FREQUENCIES = ['realtime', 'daily', 'weekly'];

function normalizeBoolean(value, fallback = false) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const normalized = String(value).trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

function normalizeEmailFrequency(value, fallback = 'daily') {
  const normalized = String(value || '').trim().toLowerCase();
  return EMAIL_FREQUENCIES.includes(normalized) ? normalized : fallback;
}

function parsePreferenceJson(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeNotificationPreferences(value, fallback = DEFAULT_NOTIFICATION_PREFERENCES) {
  const incoming = parsePreferenceJson(value);
  const merged = { ...fallback };

  Object.keys(DEFAULT_NOTIFICATION_PREFERENCES).forEach((key) => {
    if (incoming[key] !== undefined) {
      merged[key] = normalizeBoolean(incoming[key], DEFAULT_NOTIFICATION_PREFERENCES[key]);
    }
  });

  return merged;
}

class UserPreferenceRepository extends BaseRepository {
  constructor() {
    super(TABLE_NAME);
    this.schemaPromise = null;
  }

  async ensureSchema() {
    if (!this.schemaPromise) {
      this.schemaPromise = this._ensureSchema().catch((error) => {
        this.schemaPromise = null;
        throw error;
      });
    }
    return this.schemaPromise;
  }

  async _ensureSchema() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL UNIQUE,
        notification_preferences JSON NULL,
        email_frequency ENUM('realtime', 'daily', 'weekly') NOT NULL DEFAULT 'daily',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_preferences_user
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await this._ensureColumn(
      'notification_preferences',
      'ALTER TABLE user_preferences ADD COLUMN notification_preferences JSON NULL'
    );
    await this._ensureColumn(
      'email_frequency',
      "ALTER TABLE user_preferences ADD COLUMN email_frequency ENUM('realtime', 'daily', 'weekly') NOT NULL DEFAULT 'daily'"
    );
  }

  async _ensureColumn(column, alterSql) {
    const [rows] = await this.pool.query(`SHOW COLUMNS FROM ${TABLE_NAME} LIKE ?`, [column]);
    if (rows.length === 0) {
      await this.pool.query(alterSql);
    }
  }

  async findByUserId(userId) {
    await this.ensureSchema();
    const [rows] = await this.pool.query(`SELECT * FROM ${TABLE_NAME} WHERE user_id = ? LIMIT 1`, [
      userId,
    ]);
    return rows[0] || null;
  }

  async upsert(userId, data = {}) {
    await this.ensureSchema();

    const payload = {};
    if (data.notification_preferences !== undefined) {
      payload.notification_preferences = JSON.stringify(
        normalizeNotificationPreferences(data.notification_preferences)
      );
    }
    if (data.email_frequency !== undefined) {
      payload.email_frequency = normalizeEmailFrequency(data.email_frequency);
    }

    const keys = Object.keys(payload);
    if (keys.length === 0) return this.findByUserId(userId);

    const columns = ['user_id', ...keys];
    const placeholders = columns.map(() => '?').join(', ');
    const updates = keys.map((key) => `${key} = VALUES(${key})`).join(', ');
    const values = [userId, ...keys.map((key) => payload[key])];

    await this.pool.query(
      `INSERT INTO ${TABLE_NAME} (${columns.join(', ')})
       VALUES (${placeholders})
       ON DUPLICATE KEY UPDATE ${updates}, updated_at = CURRENT_TIMESTAMP`,
      values
    );

    return this.findByUserId(userId);
  }

  toPreferenceContract(row = null) {
    return {
      notification_preferences: normalizeNotificationPreferences(row?.notification_preferences),
      email_frequency: normalizeEmailFrequency(row?.email_frequency),
    };
  }

  mergeIntoUser(user = {}, preferenceRow = null) {
    return {
      ...user,
      ...this.toPreferenceContract(preferenceRow),
    };
  }
}

module.exports = new UserPreferenceRepository();
module.exports.DEFAULT_NOTIFICATION_PREFERENCES = DEFAULT_NOTIFICATION_PREFERENCES;
module.exports.normalizeNotificationPreferences = normalizeNotificationPreferences;
module.exports.normalizeEmailFrequency = normalizeEmailFrequency;
module.exports.UserPreferenceRepository = UserPreferenceRepository;
