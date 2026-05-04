const { pool } = require('../config/database.config');

class SystemSettingsRepository {
  _coerceBoolean(value, defaultValue = true) {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }
    return defaultValue;
  }

  /** Một round-trip thay vì N lần getBoolean — dùng cho /settings/feature-flags. */
  async getBooleansForKeys(keys, defaultValue = true) {
    if (!keys?.length) return {};
    const placeholders = keys.map(() => '?').join(',');
    const [rows] = await pool.query(
      `SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN (${placeholders})`,
      keys
    );
    const out = {};
    for (const key of keys) {
      out[key] = defaultValue;
    }
    for (const row of rows) {
      out[row.setting_key] = this._coerceBoolean(row.setting_value, defaultValue);
    }
    return out;
  }

  async findAll() {
    const [rows] = await pool.query('SELECT * FROM system_settings');
    return rows;
  }

  async findByKey(key) {
    const [rows] = await pool.query(
      'SELECT setting_value FROM system_settings WHERE setting_key = ? LIMIT 1',
      [key]
    );
    return rows[0]?.setting_value;
  }

  async getBoolean(key, defaultValue = false) {
    const value = await this.findByKey(key);
    return this._coerceBoolean(value, defaultValue);
  }

  async getJSON(key, defaultValue = null) {
    const value = await this.findByKey(key);
    if (value === undefined || value === null || value === '') return defaultValue;

    if (typeof value === 'object') return value;

    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return defaultValue;
      }
    }

    return defaultValue;
  }

  _serializeValue(value) {
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return String(value);
    if (value && typeof value === 'object') return JSON.stringify(value);
    return value == null ? '' : String(value);
  }

  async update(key, value) {
    const serializedValue = this._serializeValue(value);
    const [result] = await pool.query(
      'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
      [key, serializedValue, serializedValue]
    );
    return result;
  }
}

module.exports = new SystemSettingsRepository();
