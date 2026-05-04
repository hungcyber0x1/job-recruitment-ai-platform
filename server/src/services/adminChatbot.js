/**
 * Admin Chatbot Service
 * Logic tách riêng cho chatbot admin operations (dùng bởi chatbot tool executor).
 */
const { pool } = require('../config/database.config');

const USER_NAME_SQL = `
  NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), '')
`;

function buildDateFilter(alias = 'created_at', { startDate, endDate } = {}) {
  const clauses = [];
  const params = [];

  if (startDate) {
    clauses.push(`${alias} >= ?`);
    params.push(startDate);
  }

  if (endDate) {
    clauses.push(`${alias} <= ?`);
    params.push(endDate);
  }

  return {
    sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}

function parseIntentLabel(rawValue) {
  if (!rawValue) return 'Không xác định';

  try {
    const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    if (typeof parsed === 'string') return parsed;
    return parsed?.intent || parsed?.category || parsed?.type || JSON.stringify(parsed);
  } catch {
    return String(rawValue);
  }
}

class AdminChatbotService {
  async getAnalytics({ startDate, endDate } = {}) {
    const conversationFilter = buildDateFilter('created_at', { startDate, endDate });
    const messageFilter = buildDateFilter('created_at', { startDate, endDate });
    const eventFilter = buildDateFilter('created_at', { startDate, endDate });

    const [[totalConvs]] = await pool.query(
      `SELECT COUNT(*) as total FROM conversations ${conversationFilter.sql}`,
      conversationFilter.params
    );
    const [[totalMsgs]] = await pool.query(
      `SELECT COUNT(*) as total FROM chat_messages ${messageFilter.sql}`,
      messageFilter.params
    );
    const [[userCount]] = await pool.query(
      `SELECT COUNT(DISTINCT user_id) as total FROM conversations ${conversationFilter.sql}`,
      conversationFilter.params
    );
    const [[avgPerConv]] = await pool.query(
      `SELECT AVG(msg_count) as avg
         FROM (
           SELECT conversation_id, COUNT(*) as msg_count
             FROM chat_messages
             ${messageFilter.sql}
            GROUP BY conversation_id
         ) as sub`,
      messageFilter.params
    );
    const [[positiveFeedback]] = await pool.query(
      `SELECT COUNT(*) as total
         FROM chat_messages
        WHERE feedback = 'positive'
          ${startDate ? 'AND created_at >= ?' : ''}
          ${endDate ? 'AND created_at <= ?' : ''}`,
      [startDate, endDate].filter(Boolean)
    );
    const [[feedbackTotal]] = await pool.query(
      `SELECT COUNT(*) as total
         FROM chat_messages
        WHERE feedback IN ('positive', 'negative')
          ${startDate ? 'AND created_at >= ?' : ''}
          ${endDate ? 'AND created_at <= ?' : ''}`,
      [startDate, endDate].filter(Boolean)
    );
    const [topIntents] = await pool.query(
      `SELECT event_data as intent, COUNT(*) as count
         FROM chatbot_analytics_events
        WHERE event_type = 'intent_detected'
          ${eventFilter.sql ? `AND ${eventFilter.sql.replace(/^WHERE\s+/i, '')}` : ''}
        GROUP BY event_data
        ORDER BY count DESC
        LIMIT 5`,
      eventFilter.params
    );
    const [chartData] = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as sessions
         FROM conversations
         ${conversationFilter.sql}
        GROUP BY DATE(created_at)
        ORDER BY date ASC`,
      conversationFilter.params
    );

    const feedbackCount = Number(feedbackTotal?.total || 0);
    const satisfaction =
      feedbackCount > 0
        ? Number(((Number(positiveFeedback?.total || 0) / feedbackCount) * 5).toFixed(1))
        : null;

    return {
      totalConversations: Number(totalConvs?.total || 0),
      totalMessages: Number(totalMsgs?.total || 0),
      activeUsers: Number(userCount?.total || 0),
      avgMessagesPerConversation: Math.round(Number(avgPerConv?.avg || 0)),
      satisfaction,
      chartData: (chartData || []).map((row) => ({
        name: row.date,
        date: row.date,
        sessions: Number(row.sessions || 0),
      })),
      topIntents: (topIntents || []).map((row) => ({
        intent: parseIntentLabel(row.intent),
        count: Number(row.count || 0),
      })),
    };
  }

  async getConversations({ page = 1, limit = 20 } = {}) {
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (safePage - 1) * safeLimit;

    const [rows] = await pool.query(
      `SELECT c.id,
              c.title,
              c.user_id,
              c.created_at,
              c.updated_at,
              COALESCE(${USER_NAME_SQL}, u.email, 'Người dùng ẩn danh') as user_name,
              u.email as user_email,
              u.role as user_role,
              (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = c.id) as message_count,
              (SELECT message
                 FROM chat_messages
                WHERE conversation_id = c.id AND is_ai = 0
                ORDER BY created_at DESC, id DESC
                LIMIT 1) as last_question,
              (SELECT message
                 FROM chat_messages
                WHERE conversation_id = c.id
                ORDER BY created_at DESC, id DESC
                LIMIT 1) as last_message
         FROM conversations c
         LEFT JOIN users u ON c.user_id = u.id
        ORDER BY c.updated_at DESC
        LIMIT ? OFFSET ?`,
      [safeLimit, offset]
    );
    const [[countRow]] = await pool.query('SELECT COUNT(*) as total FROM conversations');
    return {
      data: rows.map((row) => ({
        ...row,
        question: row.last_question || row.last_message || '',
        message_count: Number(row.message_count || 0),
      })),
      meta: {
        total: Number(countRow?.total || 0),
        page: safePage,
        limitPerPage: safeLimit,
      },
    };
  }

  async getConversationDetail({ conversation_id }) {
    const [conv] = await pool.query(
      `SELECT c.id,
              c.title,
              c.user_id,
              c.created_at,
              c.updated_at,
              COALESCE(${USER_NAME_SQL}, u.email, 'Người dùng ẩn danh') as user_name,
              u.email as user_email,
              u.role as user_role
         FROM conversations c
         LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = ?`,
      [conversation_id]
    );
    if (!conv || conv.length === 0) throw new Error('Conversation not found');

    const [messages] = await pool.query(
      `SELECT cm.id, cm.message, cm.is_ai, cm.feedback, cm.created_at
         FROM chat_messages cm
        WHERE cm.conversation_id = ?
        ORDER BY cm.created_at ASC, cm.id ASC`,
      [conversation_id]
    );

    return { ...conv[0], messages };
  }

  async getTemplates() {
    const [rows] = await pool.query(
      `SELECT id, prompt_name, prompt_template, prompt_type, is_active, created_at
       FROM ai_prompts
       ORDER BY prompt_type, prompt_name`
    );
    return rows;
  }

  async getConfigurations() {
    const [rows] = await pool.query(
      `SELECT setting_key, setting_value FROM system_settings WHERE setting_key LIKE 'ai_chatbot%'`
    );
    const config = {};
    for (const row of rows) {
      try {
        config[row.setting_key] = JSON.parse(row.setting_value);
      } catch {
        config[row.setting_key] = row.setting_value;
      }
    }
    return config;
  }

  async updateConfigurations(adminId, ip, userAgent, updates) {
    const SystemSettingsRepository = require('../models/SystemSettings');
    const { AuditLogRepository } = require('../models');

    for (const [key, value] of Object.entries(updates)) {
      await SystemSettingsRepository.update(key, String(value));

      if (AuditLogRepository) {
        try {
          await AuditLogRepository.log({
            userId: adminId,
            action: 'chatbot_config_update',
            targetType: 'chatbot_config',
            targetId: null,
            oldValues: { key },
            newValues: { key, value },
            notes: `Updated via chatbot by admin ${adminId}`,
            ip,
            userAgent,
          });
        } catch (e) {
          // ignore audit errors
        }
      }
    }
    return { success: true };
  }
}

module.exports = new AdminChatbotService();
