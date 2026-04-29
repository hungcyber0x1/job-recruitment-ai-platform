/**
 * Chat Repository
 *
 * Cung cấp JSDoc type definitions cho hệ thống không dùng ORM.
 * Tables: chatbot_conversations, chatbot_messages
 *
 * Cấu trúc mới:
 * - chatbot_conversations: Phiên trò chuyện
 * - chatbot_messages: Tin nhắn trong phiên
 */

const BaseRepository = require('./Base');

class ChatRepository extends BaseRepository {
  constructor() {
    super('chatbot_messages');
  }

  async findConversation(conversationId) {
    const query = `
      SELECT cm.*, 
             CASE 
               WHEN cm.sender_type = 'user' THEN u.first_name 
               ELSE 'AI Assistant' 
             END as sender_name
      FROM chatbot_messages cm
      LEFT JOIN users u ON cm.sender_id = u.id AND cm.sender_type = 'user'
      WHERE cm.conversation_id = ? 
      ORDER BY cm.created_at ASC
    `;
    const [rows] = await this.pool.query(query, [conversationId]);
    return rows;
  }

  async findUserConversations(userId) {
    const query = `
      SELECT cc.*,
             (SELECT cm.message FROM chatbot_messages cm 
              WHERE cm.conversation_id = cc.id 
              ORDER BY cm.created_at DESC LIMIT 1) as last_message,
             (SELECT cm.created_at FROM chatbot_messages cm 
              WHERE cm.conversation_id = cc.id 
              ORDER BY cm.created_at DESC LIMIT 1) as last_message_at
      FROM chatbot_conversations cc
      WHERE cc.candidate_id = ? OR cc.recruiter_id = ?
      ORDER BY cc.started_at DESC
    `;
    const [rows] = await this.pool.query(query, [userId, userId]);
    return rows;
  }

  async saveMessage(messageData) {
    return await this.create(messageData);
  }

  async createConversation(data) {
    const { pool } = require('../config/database.config');
    const { candidate_id, recruiter_id, session_type, context_data } = data;
    
    const [result] = await pool.query(
      `INSERT INTO chatbot_conversations (candidate_id, recruiter_id, session_type, context_data, started_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [candidate_id || null, recruiter_id || null, session_type || 'general', context_data ? JSON.stringify(context_data) : null]
    );
    
    return result.insertId;
  }

  async updateConversationStatus(conversationId, status) {
    const { pool } = require('../config/database.config');
    const updateData = status === 'closed' ? ', ended_at = NOW()' : '';
    const [result] = await pool.query(
      `UPDATE chatbot_conversations SET status = ?${updateData} WHERE id = ?`,
      [status, conversationId]
    );
    return result.affectedRows > 0;
  }

  async getOrCreateConversation(userId, sessionType = 'general') {
    const { pool } = require('../config/database.config');
    
    // Check for existing active conversation
    const [existing] = await pool.query(
      `SELECT * FROM chatbot_conversations 
       WHERE (candidate_id = ? OR recruiter_id = ?) 
       AND status = 'active'
       ORDER BY started_at DESC LIMIT 1`,
      [userId, userId]
    );
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    // Create new conversation
    const [result] = await pool.query(
      `INSERT INTO chatbot_conversations (candidate_id, recruiter_id, session_type, started_at)
       VALUES (?, ?, ?, NOW())`,
      [userId, userId, sessionType]
    );
    
    const [newConv] = await pool.query(
      'SELECT * FROM chatbot_conversations WHERE id = ?',
      [result.insertId]
    );
    
    return newConv[0];
  }
}

module.exports = new ChatRepository();
