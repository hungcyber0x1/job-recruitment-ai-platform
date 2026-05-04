const { pool } = require('../config/database.config');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const DEFAULT_TOPIC = 'weekly_hiring_insights';
const DEFAULT_SOURCE = 'website';
const DEFAULT_CONSENT_TEXT =
  'Người dùng đồng ý nhận bản tin HireBOT và có thể hủy đăng ký bất cứ lúc nào.';

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function sanitizeToken(value, fallback, maxLength = 80) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, maxLength);

  return normalized || fallback;
}

function normalizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }

  try {
    return JSON.stringify(metadata).slice(0, 4000);
  } catch {
    return null;
  }
}

class NewsletterSubscriptionRepository {
  normalizeEmail(email) {
    return normalizeEmail(email);
  }

  isValidEmail(email) {
    const normalized = normalizeEmail(email);
    return normalized.length >= 6 && normalized.length <= 255 && EMAIL_REGEX.test(normalized);
  }

  async findByEmailAndTopic(email, topic = DEFAULT_TOPIC) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedTopic = sanitizeToken(topic, DEFAULT_TOPIC);

    const [rows] = await pool.query(
      `SELECT * FROM newsletter_subscriptions WHERE email = ? AND topic = ? LIMIT 1`,
      [normalizedEmail, normalizedTopic]
    );

    return rows[0] || null;
  }

  async subscribe({ email, topic, source, consentText, ipAddress, userAgent, metadata }) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedTopic = sanitizeToken(topic, DEFAULT_TOPIC);
    const normalizedSource = sanitizeToken(source, DEFAULT_SOURCE);
    const normalizedConsentText = String(consentText || DEFAULT_CONSENT_TEXT)
      .trim()
      .slice(0, 500);
    const normalizedUserAgent = userAgent ? String(userAgent).slice(0, 512) : null;
    const metadataJson = normalizeMetadata(metadata);

    const existing = await this.findByEmailAndTopic(normalizedEmail, normalizedTopic);
    const alreadySubscribed = existing?.status === 'subscribed';

    if (alreadySubscribed) {
      await pool.query(
        `UPDATE newsletter_subscriptions
         SET source = ?, ip_address = ?, user_agent = ?, metadata = COALESCE(?, metadata),
             last_subscribed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [normalizedSource, ipAddress || null, normalizedUserAgent, metadataJson, existing.id]
      );

      const subscription = await this.findByEmailAndTopic(normalizedEmail, normalizedTopic);
      return {
        subscription,
        result: 'already_subscribed',
      };
    }

    if (existing) {
      await pool.query(
        `UPDATE newsletter_subscriptions
         SET status = 'subscribed', source = ?, consent_text = ?, consented_at = CURRENT_TIMESTAMP,
             subscribed_at = CURRENT_TIMESTAMP, unsubscribed_at = NULL, last_subscribed_at = CURRENT_TIMESTAMP,
             ip_address = ?, user_agent = ?, metadata = ?
         WHERE id = ?`,
        [
          normalizedSource,
          normalizedConsentText,
          ipAddress || null,
          normalizedUserAgent,
          metadataJson,
          existing.id,
        ]
      );

      const subscription = await this.findByEmailAndTopic(normalizedEmail, normalizedTopic);
      return {
        subscription,
        result: 'reactivated',
      };
    }

    const [insertResult] = await pool.query(
      `INSERT INTO newsletter_subscriptions
       (email, status, topic, source, consent_text, consented_at, subscribed_at, last_subscribed_at,
        ip_address, user_agent, metadata)
       VALUES (?, 'subscribed', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?)`,
      [
        normalizedEmail,
        normalizedTopic,
        normalizedSource,
        normalizedConsentText,
        ipAddress || null,
        normalizedUserAgent,
        metadataJson,
      ]
    );

    const [rows] = await pool.query(`SELECT * FROM newsletter_subscriptions WHERE id = ?`, [
      insertResult.insertId,
    ]);

    return {
      subscription: rows[0] || null,
      result: 'created',
    };
  }
}

module.exports = new NewsletterSubscriptionRepository();
module.exports.DEFAULT_NEWSLETTER_TOPIC = DEFAULT_TOPIC;
module.exports.DEFAULT_NEWSLETTER_CONSENT_TEXT = DEFAULT_CONSENT_TEXT;
