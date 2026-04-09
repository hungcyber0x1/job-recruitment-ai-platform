const AIService = require('./ai');
const { pool } = require('../config/database.config');
const logger = require('../utils/logger');

class ChatbotService {
  // Process message in conversation
  async processMessage(userId, message, conversationId = null) {
    try {
      // If no conversation ID, create a new one
      if (!conversationId) {
        const conversation = await this.createConversation(userId, 'New Conversation');
        conversationId = conversation.id;
      }

      // Verify user owns this conversation
      await this._verifyConversationOwnership(userId, conversationId);

      // 1. Save user message to database
      await pool.query(
        'INSERT INTO chat_messages (sender_id, conversation_id, message, is_ai) VALUES (?, ?, ?, ?)',
        [userId, conversationId, message, false]
      );

      // Track analytics
      await this._trackEvent(conversationId, userId, 'message_sent', {
        message_length: message.length,
      });

      // 2. Get conversation context (last 10 messages)
      const [contextMessages] = await pool.query(
        'SELECT message, is_ai FROM chat_messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 10',
        [conversationId]
      );

      // Thứ tự thời gian (cũ → mới). Bỏ tin user vừa lưu ở cuối — generateCareerAdvice gửi lượt đó qua sendMessage().
      const chronological = [...contextMessages].reverse();
      const historyForAi = chronological.length > 0 ? chronological.slice(0, -1) : [];

      // 3. Get user info for context
      const [userRows] = await pool.query('SELECT role, first_name FROM users WHERE id = ?', [
        userId,
      ]);
      const userRow = userRows[0] || { role: 'candidate', first_name: null };

      // 4. Get AI response with context
      const aiResponse = await AIService.generateCareerAdvice(userRow, message, historyForAi);

      // 5. Save AI response to database
      await pool.query(
        'INSERT INTO chat_messages (sender_id, conversation_id, message, is_ai) VALUES (?, ?, ?, ?)',
        [userId, conversationId, aiResponse, true]
      );

      // Track analytics
      await this._trackEvent(conversationId, userId, 'message_received', {
        message_length: aiResponse.length,
      });

      // Update conversation timestamp
      await pool.query('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
        conversationId,
      ]);

      return {
        message: aiResponse,
        conversationId,
      };
    } catch (error) {
      logger.error('Error processing message:', error);
      throw error;
    }
  }

  // Get chat history for a conversation
  async getChatHistory(userId, conversationId = null) {
    try {
      let query, params;

      if (conversationId) {
        // Verify ownership
        await this._verifyConversationOwnership(userId, conversationId);

        query = `
                    SELECT id, message, is_ai, attachment_url, attachment_type, created_at 
                    FROM chat_messages 
                    WHERE conversation_id = ? 
                    ORDER BY created_at ASC
                `;
        params = [conversationId];
      } else {
        // Get all messages for user across all conversations
        query = `
                    SELECT cm.id, cm.message, cm.is_ai, cm.attachment_url, cm.attachment_type, cm.created_at, cm.conversation_id
                    FROM chat_messages cm
                    INNER JOIN conversations c ON cm.conversation_id = c.id
                    WHERE c.user_id = ?
                    ORDER BY cm.created_at ASC
                `;
        params = [userId];
      }

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      logger.error('Error fetching chat history:', error);
      throw error;
    }
  }

  // Create new conversation
  async createConversation(userId, title = 'New Conversation') {
    try {
      const [result] = await pool.query(
        'INSERT INTO conversations (user_id, title) VALUES (?, ?)',
        [userId, title]
      );

      // Track analytics
      await this._trackEvent(result.insertId, userId, 'conversation_created', { title });

      return {
        id: result.insertId,
        title,
        created_at: new Date(),
      };
    } catch (error) {
      logger.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Get user's conversations
  async getUserConversations(userId) {
    try {
      const [rows] = await pool.query(
        `
                SELECT 
                    c.id,
                    c.title,
                    c.created_at,
                    c.updated_at,
                    COUNT(cm.id) as message_count,
                    MAX(cm.created_at) as last_message_at
                FROM conversations c
                LEFT JOIN chat_messages cm ON c.id = cm.conversation_id
                WHERE c.user_id = ?
                GROUP BY c.id
                ORDER BY c.updated_at DESC
            `,
        [userId]
      );

      return rows;
    } catch (error) {
      logger.error('Error fetching conversations:', error);
      throw error;
    }
  }

  // Update conversation title
  async updateConversationTitle(userId, conversationId, title) {
    try {
      await this._verifyConversationOwnership(userId, conversationId);

      await pool.query('UPDATE conversations SET title = ? WHERE id = ?', [title, conversationId]);
    } catch (error) {
      logger.error('Error updating conversation:', error);
      throw error;
    }
  }

  // Delete conversation
  async deleteConversation(userId, conversationId) {
    try {
      await this._verifyConversationOwnership(userId, conversationId);

      await pool.query('DELETE FROM conversations WHERE id = ?', [conversationId]);
    } catch (error) {
      logger.error('Error deleting conversation:', error);
      throw error;
    }
  }

  // Clear conversation messages
  async clearConversationMessages(userId, conversationId) {
    try {
      await this._verifyConversationOwnership(userId, conversationId);

      await pool.query('DELETE FROM chat_messages WHERE conversation_id = ?', [conversationId]);
    } catch (error) {
      logger.error('Error clearing messages:', error);
      throw error;
    }
  }

  // Get suggested questions based on user context
  async getSuggestedQuestions(userId) {
    try {
      // Get user role and recent activity
      await pool.query('SELECT role FROM users WHERE id = ?', [userId]);

      // Get prompt templates
      const [templates] = await pool.query(
        'SELECT display_name as title, prompt_template as content, category FROM ai_prompts WHERE is_active = 1 ORDER BY RAND() LIMIT 5'
      );

      return templates;
    } catch (error) {
      logger.error('Error getting suggested questions:', error);
      throw error;
    }
  }

  // Process file upload
  async processFileUpload(userId, fileData, conversationId) {
    try {
      if (!conversationId) {
        const conversation = await this.createConversation(userId, 'File Analysis');
        conversationId = conversation.id;
      }

      await this._verifyConversationOwnership(userId, conversationId);

      // Save file message
      await pool.query(
        'INSERT INTO chat_messages (sender_id, conversation_id, message, is_ai, attachment_url, attachment_type) VALUES (?, ?, ?, ?, ?, ?)',
        [
          userId,
          conversationId,
          `Uploaded file: ${fileData.name}`,
          false,
          fileData.url,
          fileData.type,
        ]
      );

      // Track analytics
      await this._trackEvent(conversationId, userId, 'file_uploaded', {
        file_type: fileData.type,
        file_name: fileData.name,
      });

      // Generate AI response about the file
      const aiPrompt = `User has uploaded a ${fileData.type} file. Please provide guidance on how you can help analyze this document, especially if it's a CV/resume.`;
      const [userRows] = await pool.query('SELECT role, first_name FROM users WHERE id = ?', [
        userId,
      ]);
      const userRow = userRows[0] || { role: 'candidate', first_name: null };
      const aiResponse = await AIService.generateCareerAdvice(userRow, aiPrompt, []);

      // Save AI response
      await pool.query(
        'INSERT INTO chat_messages (sender_id, conversation_id, message, is_ai) VALUES (?, ?, ?, ?)',
        [userId, conversationId, aiResponse, true]
      );

      return {
        conversationId,
        fileData,
        aiResponse,
      };
    } catch (error) {
      logger.error('Error processing file upload:', error);
      throw error;
    }
  }

  // Helper: Verify conversation ownership
  async _verifyConversationOwnership(userId, conversationId) {
    const [rows] = await pool.query('SELECT user_id FROM conversations WHERE id = ?', [
      conversationId,
    ]);

    if (rows.length === 0) {
      throw new Error('Conversation not found');
    }

    if (rows[0].user_id !== userId) {
      throw new Error('Unauthorized access to conversation');
    }
  }

  // Helper: Track analytics event
  async _trackEvent(conversationId, userId, eventType, metadata = {}) {
    try {
      await pool.query(
        'INSERT INTO chatbot_analytics (conversation_id, user_id, event_type, metadata) VALUES (?, ?, ?, ?)',
        [conversationId, userId, eventType, JSON.stringify(metadata)]
      );
    } catch (error) {
      // Don't fail the main operation if analytics fails
      logger.error('Error tracking analytics:', error);
    }
  }
}

module.exports = new ChatbotService();
