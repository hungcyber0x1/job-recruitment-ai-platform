/**
 * Admin Chatbot Service
 * Logic tách riêng cho chatbot admin operations (dùng bởi chatbot tool executor).
 */
const { pool } = require('../config/database.config');

class AdminChatbotService {
  async getAnalytics({ startDate, endDate } = {}) {
    const [[totalConvs]] = await pool.query(
      `SELECT COUNT(*) as total FROM conversations WHERE created_at >= COALESCE(?, created_at) AND created_at <= COALESCE(?, NOW())`,
      [startDate || null, endDate || null]
    );
    const [[totalMsgs]] = await pool.query(
      `SELECT COUNT(*) as total FROM chat_messages WHERE created_at >= COALESCE(?, created_at) AND created_at <= COALESCE(?, NOW())`,
      [startDate || null, endDate || null]
    );
    const [[userCount]] = await pool.query(
      `SELECT COUNT(DISTINCT user_id) as total FROM conversations WHERE created_at >= COALESCE(?, created_at) AND created_at <= COALESCE(?, NOW())`,
      [startDate || null, endDate || null]
    );
    const [[avgPerConv]] = await pool.query(
      `SELECT AVG(msg_count) as avg FROM (SELECT conversation_id, COUNT(*) as msg_count FROM chat_messages WHERE created_at >= COALESCE(?, created_at) AND created_at <= COALESCE(?, NOW()) GROUP BY conversation_id) as sub`,
      [startDate || null, endDate || null]
    );
    const [topIntents] = await pool.query(
      `SELECT event_data as intent, COUNT(*) as count
       FROM chatbot_analytics_events
       WHERE event_type = 'intent_detected'
         AND created_at >= COALESCE(?, created_at)
         AND created_at <= COALESCE(?, NOW())
       GROUP BY event_data
       ORDER BY count DESC LIMIT 5`,
      [startDate || null, endDate || null]
    );

    return {
      totalConversations: totalConvs?.total || 0,
      totalMessages: totalMsgs?.total || 0,
      activeUsers: userCount?.total || 0,
      avgMessagesPerConversation: Math.round(avgPerConv?.avg || 0),
      topIntents: (topIntents || []).map(r => ({
        intent: r.intent,
        count: r.count,
      })),
    };
  }

  async getConversations({ page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT c.id, c.title, c.user_id, c.created_at, c.updated_at,
              u.full_name as user_name, u.email as user_email,
              (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = c.id) as message_count,
              (SELECT message FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
       FROM conversations c
       LEFT JOIN users u ON c.user_id = u.id
       ORDER BY c.updated_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [[countRow]] = await pool.query('SELECT COUNT(*) as total FROM conversations');
    return {
      data: rows,
      meta: { total: countRow?.total || 0, page, limitPerPage: limit },
    };
  }

  async getConversationDetail({ conversation_id }) {
    const [conv] = await pool.query(
      `SELECT c.id, c.title, c.user_id, c.created_at, c.updated_at,
              u.full_name as user_name, u.email as user_email, u.role as user_role
       FROM conversations c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [conversation_id]
    );
    if (!conv || conv.length === 0) throw new Error('Conversation not found');

    const [messages] = await pool.query(
      `SELECT cm.id, cm.message, cm.is_ai, cm.created_at
       FROM chat_messages cm
       WHERE cm.conversation_id = ?
       ORDER BY cm.created_at ASC`,
      [conversation_id]
    );

    return { ...conv[0], messages };
  }

  async getTemplates({} = {}) {
    const [rows] = await pool.query(
      `SELECT id, prompt_name, prompt_template, prompt_type, is_active, created_at
       FROM ai_prompts
       ORDER BY prompt_type, prompt_name`
    );
    return rows;
  }

  async getConfigurations({} = {}) {
    const [rows] = await pool.query(`SELECT setting_key, setting_value FROM system_settings WHERE setting_key LIKE 'ai_chatbot%'`);
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
