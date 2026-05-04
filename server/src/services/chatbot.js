const AIService = require('./ai');
const { pool } = require('../config/database.config');
const logger = require('../utils/logger');
const { detectIntent, getIntentSuggestedQuestions } = require('./intentDetector');
const { detectAdminIntents, buildToolContext } = require('./adminIntentDetector');
const { executeAdminTool } = require('./adminToolExecutor');

/**
 * Conversation summarization threshold - after this many messages total (user+AI), summarize.
 * Each exchange = 2 messages, so 12 total = 6 exchanges.
 */
const SUMMARIZE_THRESHOLD = 24;

/**
 * Max messages to keep after summarization (partial history kept alongside summary)
 */
const SUMMARIZED_HISTORY_KEEP = 6;

/**
 * Validation constants cho AI responses
 */
const AI_RESPONSE_LIMITS = {
  maxLength: 5000, // Giới hạn độ dài response
};

/**
 * Patterns cần cảnh báo hoặc block
 */
const FORBIDDEN_PATTERNS = {
  // Từ khóa cấm trong phản hồi AI
  bannedPhrases: [
    /tuyển dụng ngay/i,
    /chắc chắn được nhận/i,
    /đảm bảo 100%/i,
    /quyết định cuối cùng/i,
    /tôi quyết định/i,
    /ra quyết định thay/i,
    /phán quyết tuyệt đối/i,
  ],
  // Legal/financial certainty patterns
  legalPatterns: [
    /bạn nên kiện/i,
    /đây là quyền lợi của bạn.*pháp lý/i,
    /luật.*quy định.*chắc chắn/i,
  ],
};

/**
 * Kiểm tra và sanitize AI response
 * @param {string} response - Phản hồi từ AI
 * @returns {{text: string, flagged: boolean, warnings: string[]}}
 */
function validateAndSanitizeResponse(response) {
  const warnings = [];
  let flagged = false;
  let text = response;

  // 1. Kiểm tra độ dài
  if (text.length > AI_RESPONSE_LIMITS.maxLength) {
    text =
      text.substring(0, AI_RESPONSE_LIMITS.maxLength) +
      '...\n\n[Lưu ý: Phản hồi đã bị cắt ngắn do quá dài.]';
    warnings.push('Response truncated due to length');
  }

  // 2. Kiểm tra các pattern cấm
  for (const pattern of FORBIDDEN_PATTERNS.bannedPhrases) {
    if (pattern.test(text)) {
      flagged = true;
      warnings.push(`Banned phrase detected: ${pattern.source}`);
      logger.warn(`AI response flagged for banned phrase: ${pattern.source}`);
    }
  }

  // 3. Kiểm tra legal certainty patterns
  for (const pattern of FORBIDDEN_PATTERNS.legalPatterns) {
    if (pattern.test(text)) {
      warnings.push('Legal/financial certainty pattern detected - may need disclaimer');
    }
  }

  // 4. Thêm disclaimer nếu cần
  if (flagged || warnings.length > 0) {
    const disclaimer =
      '\n\n---\n⚠️ **Lưu ý quan trọng**: Tôi chỉ là trợ lý tư vấn nghề nghiệp, không thể thay thế tư vấn chuyên gia (pháp lý, tài chính). Mọi quyết định cuối cùng là của bạn.';

    if (!text.includes(disclaimer)) {
      text = text.trim() + disclaimer;
    }
  }

  return { text, flagged, warnings };
}

class ChatbotService {
  constructor() {
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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        owner_user_id BIGINT UNSIGNED NULL,
        title VARCHAR(255) DEFAULT 'New Conversation',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_conversations_user_updated (user_id, updated_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await this._ensureColumn(
      'conversations',
      'user_id',
      'ALTER TABLE conversations ADD COLUMN user_id BIGINT UNSIGNED NULL AFTER id'
    );
    await pool.query(
      'UPDATE conversations SET user_id = COALESCE(user_id, owner_user_id) WHERE user_id IS NULL'
    );
    await this._ensureColumn(
      'conversations',
      'title',
      "ALTER TABLE conversations ADD COLUMN title VARCHAR(255) DEFAULT 'New Conversation' AFTER user_id"
    );

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        sender_id BIGINT UNSIGNED NULL,
        conversation_id BIGINT UNSIGNED NOT NULL,
        message TEXT NOT NULL,
        is_ai BOOLEAN DEFAULT FALSE,
        attachment_url VARCHAR(255) NULL,
        attachment_type VARCHAR(50) NULL,
        feedback ENUM('positive', 'negative') DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_chat_messages_conversation (conversation_id, created_at),
        INDEX idx_chat_messages_sender (sender_id),
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await this._ensureColumn(
      'chat_messages',
      'feedback',
      "ALTER TABLE chat_messages ADD COLUMN feedback ENUM('positive', 'negative') DEFAULT NULL AFTER attachment_type"
    );

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chatbot_analytics_events (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        conversation_id BIGINT UNSIGNED NULL,
        session_id VARCHAR(64) NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        event_data JSON NULL,
        message_id BIGINT UNSIGNED NULL,
        ip_address VARCHAR(45) NULL,
        user_agent VARCHAR(512) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_events_session (session_id),
        INDEX idx_events_conv (conversation_id),
        INDEX idx_events_user (user_id),
        INDEX idx_events_type (event_type),
        INDEX idx_events_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chatbot_daily_quotas (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        quota_date DATE NOT NULL,
        messages_used INT UNSIGNED DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_user_date (user_id, quota_date),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  async _ensureColumn(table, column, alterSql) {
    const [rows] = await pool.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [column]);
    if (rows.length === 0) {
      await pool.query(alterSql);
    }
  }

  /**
   * Process message in conversation with optional streaming callback.
   * @param {number} userId
   * @param {string} message
   * @param {number|null} conversationId
   * @param {Function|null} onChunk - Called with each streaming chunk
   */
  async processMessage(userId, message, conversationId = null, onChunk = null) {
    await this.ensureSchema();
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

      // 2. Detect intent for better responses
      const intent = detectIntent(message);
      await this._trackEvent(conversationId, userId, 'intent_detected', {
        intent: intent.intent,
        confidence: intent.confidence,
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

      // 3b. Admin Tool Detection & Execution
      // If user is admin, detect admin intents and execute corresponding tools
      let adminToolResults = [];
      let enrichedMessage = message;
      const userRoleNorm = (userRow.role || '').toLowerCase().trim();

      if (userRoleNorm === 'admin') {
        const adminIntents = detectAdminIntents(message);

        if (adminIntents.length > 0) {
          logger.info(`Admin tool intent detected: ${adminIntents.map((i) => i.tool).join(', ')}`, {
            userId,
            conversationId,
          });

          // Execute all detected tools in parallel
          await Promise.all(
            adminIntents.map(async (intent) => {
              try {
                const result = await executeAdminTool(intent.tool, intent.params, {
                  adminId: userId,
                  ip: null,
                  userAgent: null,
                });

                // Track tool usage
                await this._trackEvent(conversationId, userId, 'admin_tool_executed', {
                  tool: intent.tool,
                  params: intent.params,
                  success: result.success,
                  intent: intent.intent,
                });

                adminToolResults.push({
                  executedTool: intent.tool,
                  intent: intent.intent,
                  ...result,
                });
              } catch (err) {
                logger.error(`Admin tool execution failed: ${intent.tool}`, {
                  error: err.message,
                  userId,
                  conversationId,
                });
                adminToolResults.push({
                  executedTool: intent.tool,
                  intent: intent.intent,
                  success: false,
                  error: err.message,
                });
              }
            })
          );

          // Build context from tool results
          const toolContext = buildToolContext(adminToolResults);
          if (toolContext) {
            enrichedMessage = `${message}\n${toolContext}`;
          }

          // Log for audit
          const { AuditLogRepository } = require('../models');
          try {
            await AuditLogRepository.log({
              userId,
              action: 'chatbot_admin_tool',
              targetType: 'chatbot',
              targetId: conversationId,
              newValues: {
                toolsExecuted: adminToolResults.map((r) => r.executedTool),
                success: adminToolResults.every((r) => r.success),
              },
              notes: `Admin used chatbot tools: ${adminToolResults.map((r) => r.executedTool).join(', ')}`,
              ip: null,
              userAgent: null,
            });
          } catch (auditErr) {
            logger.warn('Failed to audit chatbot admin tool:', auditErr.message);
          }
        }
      }

      // 4. Get AI response with context (streaming if callback provided)
      let aiResponseRaw;
      if (onChunk && typeof onChunk === 'function') {
        // Stream response chunks for real-time display
        const chunks = [];
        for await (const chunk of AIService.streamCareerAdvice(
          userRow,
          enrichedMessage,
          historyForAi
        )) {
          chunks.push(chunk);
          onChunk(chunk);
        }
        aiResponseRaw = chunks.join('');
      } else {
        aiResponseRaw = await AIService.generateCareerAdvice(
          userRow,
          enrichedMessage,
          historyForAi
        );
      }

      // 5. Validate and sanitize AI response (guardrails)
      const { text: aiResponse, flagged, warnings } = validateAndSanitizeResponse(aiResponseRaw);

      // Log if any boundaries were crossed
      if (flagged || warnings.length > 0) {
        await this._trackEvent(conversationId, userId, 'ai_boundary_warning', {
          flagged,
          warnings,
          original_length: aiResponseRaw.length,
          sanitized_length: aiResponse.length,
        });
        logger.warn('AI response boundary warning:', { flagged, warnings, conversationId });
      }

      // 6. Save AI response to database
      await pool.query(
        'INSERT INTO chat_messages (sender_id, conversation_id, message, is_ai) VALUES (?, ?, ?, ?)',
        [userId, conversationId, aiResponse, true]
      );

      // Track analytics
      await this._trackEvent(conversationId, userId, 'message_received', {
        message_length: aiResponse.length,
        boundary_flagged: flagged,
      });

      // Update conversation timestamp
      await pool.query('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
        conversationId,
      ]);

      // Check if summarization is needed (after every AI response)
      if (await this._shouldSummarize(conversationId)) {
        const [userRows] = await pool.query('SELECT role, first_name FROM users WHERE id = ?', [
          userId,
        ]);
        const uRow = { id: userId, ...(userRows[0] || { role: 'candidate', first_name: null }) };
        await this._summarizeConversation(conversationId, uRow);
      }

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
    await this.ensureSchema();
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
    await this.ensureSchema();
    try {
      const [result] = await pool.query(
        'INSERT INTO conversations (user_id, owner_user_id, title) VALUES (?, ?, ?)',
        [userId, userId, title]
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
    await this.ensureSchema();
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
    await this.ensureSchema();
    try {
      await this._verifyConversationOwnership(userId, conversationId);

      await pool.query('UPDATE conversations SET title = ? WHERE id = ?', [title, conversationId]);
    } catch (error) {
      logger.error('Error updating conversation:', error);
      throw error;
    }
  }

  // Delete conversation (cascade: messages -> analytics events)
  async deleteConversation(userId, conversationId) {
    await this.ensureSchema();
    try {
      await this._verifyConversationOwnership(userId, conversationId);

      // Delete analytics events for messages in this conversation
      await pool.query(
        'DELETE ae FROM chatbot_analytics_events ae INNER JOIN chat_messages cm ON ae.message_id = cm.id WHERE cm.conversation_id = ?',
        [conversationId]
      );
      // Delete analytics events directly linked to conversation (no message_id)
      await pool.query(
        'DELETE FROM chatbot_analytics_events WHERE conversation_id = ? AND message_id IS NULL',
        [conversationId]
      );
      // Delete messages
      await pool.query('DELETE FROM chat_messages WHERE conversation_id = ?', [conversationId]);
      // Delete conversation
      await pool.query('DELETE FROM conversations WHERE id = ?', [conversationId]);
    } catch (error) {
      logger.error('Error deleting conversation:', error);
      throw error;
    }
  }

  // Clear conversation messages (cascade: messages -> analytics events)
  async clearConversationMessages(userId, conversationId) {
    await this.ensureSchema();
    try {
      await this._verifyConversationOwnership(userId, conversationId);

      // Delete analytics events for messages being cleared
      await pool.query(
        'DELETE FROM chatbot_analytics_events WHERE message_id IN (SELECT id FROM chat_messages WHERE conversation_id = ?)',
        [conversationId]
      );
      await pool.query('DELETE FROM chat_messages WHERE conversation_id = ?', [conversationId]);
    } catch (error) {
      logger.error('Error clearing messages:', error);
      throw error;
    }
  }

  // Get suggested questions based on user context and recent conversation
  async getSuggestedQuestions(userId) {
    await this.ensureSchema();
    try {
      // Get user role for role-specific suggestions
      const [userRows] = await pool.query('SELECT role FROM users WHERE id = ?', [userId]);
      const userRole = userRows[0]?.role || 'candidate';
      const [recentConvs] = await pool.query(
        `SELECT c.id FROM conversations c
         WHERE c.user_id = ?
         ORDER BY c.updated_at DESC LIMIT 1`,
        [userId]
      );

      let intentCategory = 'general';
      if (recentConvs.length > 0) {
        const convId = recentConvs[0].id;
        const [recentMsgs] = await pool.query(
          `SELECT message FROM chat_messages
           WHERE conversation_id = ?
           ORDER BY created_at DESC LIMIT 5`,
          [convId]
        );
        if (recentMsgs.length > 0) {
          const lastMsg = recentMsgs[0].message;
          const { intent } = detectIntent(lastMsg);
          intentCategory = intent;
        }
      }

      // Get prompt templates (include role-specific types)
      const [templates] = await pool.query(
        `SELECT
          prompt_key,
          prompt_template,
          prompt_type
        FROM ai_prompts
        WHERE is_active = 1
          AND (prompt_type IN ('career', 'resume', 'interview', 'chatbot', 'general')
           OR prompt_type = ?)
        ORDER BY RAND() LIMIT 3`,
        [userRole]
      );

      // Format templates for display
      const templateQuestions = templates.map((t) => ({
        id: t.prompt_key,
        title: this._getPromptTitle(t.prompt_key, t.prompt_type),
        content: t.prompt_template,
      }));

      // Add intent-based suggested questions (role-aware)
      const intentQuestions = getIntentSuggestedQuestions(intentCategory, userRole).map((q, i) => ({
        id: `intent_${intentCategory}_${i}`,
        title: q,
        content: q,
      }));

      // Combine: templates first, then intent suggestions
      return [...templateQuestions, ...intentQuestions.slice(0, 3)];
    } catch (error) {
      logger.error('Error getting suggested questions:', error);
      throw error;
    }
  }

  // Convert prompt key to friendly title
  _getPromptTitle(key, type) {
    const titles = {
      chatbot_greeting: 'Tìm việc làm phù hợp',
      interview_prep: 'Chuẩn bị phỏng vấn',
      salary_negotiation: 'Đàm phán lương hiệu quả',
      career_advice: 'Tư vấn lộ trình nghề',
      skill_gap: 'Phân tích kỹ năng',
      default: 'Hỏi về nghề nghiệp',
    };
    return titles[key] || titles[type] || titles['default'];
  }

  // Process file upload
  async processFileUpload(userId, fileData, conversationId) {
    await this.ensureSchema();
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

  /**
   * Summarize conversation history when it gets too long.
   * Keeps the last SUMMARIZED_HISTORY_KEEP messages plus a summary of older ones.
   * This reduces token usage and maintains context quality.
   */
  async _summarizeConversation(conversationId, userData) {
    try {
      const [messages] = await pool.query(
        `SELECT message, is_ai FROM chat_messages
         WHERE conversation_id = ?
         ORDER BY created_at DESC
         LIMIT 30`,
        [conversationId]
      );

      if (messages.length < SUMMARIZE_THRESHOLD) {
        return null;
      }

      const chronological = [...messages].reverse();
      const olderMessages = chronological.slice(0, -SUMMARIZED_HISTORY_KEEP);
      const recentMessages = chronological.slice(-SUMMARIZED_HISTORY_KEEP);

      const summaryPrompt = `
Hãy tóm tắt cuộc trò chuyện sau thành 1-2 câu tiếng Việt ngắn gọn, bao gồm:
- Chủ đề chính của cuộc trò chuyện
- Các vấn đề/kỹ năng đã được thảo luận
- Kết luận hoặc hướng dẫn đã được đưa ra

Cuộc trò chuyện:
${olderMessages.map((m) => `${m.is_ai ? 'AI' : 'User'}: ${m.message}`).join('\n')}

Trả lời CHỈ bằng tiếng Việt, tối đa 200 ký tự.`;

      const summary = await AIService.generateContent(summaryPrompt);

      // Insert summary as a system message (sender_id = NULL marks it as system-generated)
      const summaryMessage = `[Tóm tắt cuộc trò chuyện trước đó: ${summary}]`;
      await pool.query(
        'INSERT INTO chat_messages (sender_id, conversation_id, message, is_ai) VALUES (?, ?, ?, ?)',
        [null, conversationId, summaryMessage, true]
      );

      // Delete older messages (keep recent ones) — also delete orphaned analytics events
      const messageIds = olderMessages.map((m) => m.id);
      if (messageIds.length > 0) {
        // Delete analytics events for messages being deleted (prevents orphaned records)
        await pool.query('DELETE FROM chatbot_analytics_events WHERE message_id IN (?)', [
          messageIds,
        ]);
        await pool.query(`DELETE FROM chat_messages WHERE conversation_id = ? AND id NOT IN (?)`, [
          conversationId,
          recentMessages.map((m) => m.id),
        ]);
      }

      logger.info(
        `Conversation ${conversationId} summarized: ${olderMessages.length} messages condensed`
      );
      return summary;
    } catch (error) {
      logger.error('Error summarizing conversation:', error);
      return null;
    }
  }

  /**
   * Get conversation summary status - whether summarization is needed.
   */
  async getConversationStatus(conversationId) {
    await this.ensureSchema();
    try {
      const [rows] = await pool.query(
        'SELECT COUNT(*) as count FROM chat_messages WHERE conversation_id = ?',
        [conversationId]
      );
      return {
        messageCount: rows[0]?.count || 0,
        needsSummarization: rows[0]?.count >= SUMMARIZE_THRESHOLD,
      };
    } catch (error) {
      logger.error('Error getting conversation status:', error);
      return { messageCount: 0, needsSummarization: false };
    }
  }

  // Helper: Verify conversation ownership
  async _verifyConversationOwnership(userId, conversationId) {
    const [rows] = await pool.query(
      'SELECT COALESCE(user_id, owner_user_id) AS user_id FROM conversations WHERE id = ?',
      [conversationId]
    );

    if (rows.length === 0) {
      throw new Error('Conversation not found');
    }

    if (Number(rows[0].user_id) !== Number(userId)) {
      throw new Error('Unauthorized access to conversation');
    }
  }

  // Helper: Track analytics event
  async _trackEvent(conversationId, userId, eventType, metadata = {}) {
    try {
      await this.ensureSchema();
      await pool.query(
        'INSERT INTO chatbot_analytics_events (conversation_id, user_id, event_type, event_data) VALUES (?, ?, ?, ?)',
        [conversationId, userId, eventType, JSON.stringify(metadata)]
      );
    } catch (error) {
      logger.error('Error tracking analytics:', error);
    }
  }

  /**
   * Record user feedback on AI message.
   * Updates the chat_message record and tracks analytics.
   */
  async recordFeedback(messageId, userId, isPositive) {
    await this.ensureSchema();
    try {
      // Verify message ownership
      const [messages] = await pool.query(
        `SELECT cm.*, COALESCE(c.user_id, c.owner_user_id) AS user_id FROM chat_messages cm
         JOIN conversations c ON cm.conversation_id = c.id
         WHERE cm.id = ?`,
        [messageId]
      );

      if (messages.length === 0) {
        throw new Error('Message not found');
      }

      const msg = messages[0];
      if (msg.user_id !== userId) {
        throw new Error('Unauthorized');
      }

      // Update feedback on message (add a feedback column if needed, or track via analytics)
      await this._trackEvent(msg.conversation_id, userId, 'message_feedback', {
        message_id: messageId,
        is_positive: isPositive,
      });

      // If there's a feedback column, update it
      try {
        await pool.query('UPDATE chat_messages SET feedback = ? WHERE id = ?', [
          isPositive ? 'positive' : 'negative',
          messageId,
        ]);
      } catch (_) {
        // Column may not exist yet, ignore
      }

      logger.info(`Feedback recorded: message=${messageId} positive=${isPositive}`);
    } catch (error) {
      logger.error('Error recording feedback:', error);
      throw error;
    }
  }

  /**
   * Check if conversation should be summarized.
   */
  async _shouldSummarize(conversationId) {
    try {
      const [rows] = await pool.query(
        'SELECT COUNT(*) as count FROM chat_messages WHERE conversation_id = ?',
        [conversationId]
      );
      return (rows[0]?.count || 0) >= SUMMARIZE_THRESHOLD;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new ChatbotService();
