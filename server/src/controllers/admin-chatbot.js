const { pool } = require('../config/database.config');

class AdminChatbotController {
  // Thống kê chatbot (theo khoảng ngày nếu có)
  async getAnalytics(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      // Tổng số hội thoại
      const [totalConvs] = await pool.query(
        'SELECT COUNT(*) as total FROM conversations WHERE created_at >= COALESCE(?, created_at) AND created_at <= COALESCE(?, created_at)',
        [startDate || null, endDate || null]
      );

      // Tổng tin nhắn (user vs AI)
      const [totalMsgs] = await pool.query(
        'SELECT COUNT(*) as total, SUM(CASE WHEN is_ai = 0 THEN 1 ELSE 0 END) as user_messages, SUM(CASE WHEN is_ai = 1 THEN 1 ELSE 0 END) as ai_messages FROM chat_messages WHERE created_at >= COALESCE(?, created_at) AND created_at <= COALESCE(?, created_at)',
        [startDate || null, endDate || null]
      );

      // Số user có hội thoại trong khoảng
      const [activeUsers] = await pool.query(
        'SELECT COUNT(DISTINCT user_id) as total FROM conversations WHERE created_at >= COALESCE(?, created_at) AND created_at <= COALESCE(?, created_at)',
        [startDate || null, endDate || null]
      );

      // Event breakdown
      const [events] = await pool.query(
        'SELECT event_type, COUNT(*) as count FROM chatbot_analytics WHERE created_at >= COALESCE(?, created_at) AND created_at <= COALESCE(?, created_at) GROUP BY event_type',
        [startDate || null, endDate || null]
      );

      // Hoạt động theo ngày (30 ngày gần nhất)
      const [dailyActivity] = await pool.query(`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as conversations
                FROM conversations
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            `);

      // Trung bình số tin / hội thoại
      const [avgMsgs] = await pool.query(`
                SELECT AVG(msg_count) as average
                FROM (
                    SELECT conversation_id, COUNT(*) as msg_count
                    FROM chat_messages
                    GROUP BY conversation_id
                ) as conv_msgs
            `);

      res.json({
        success: true,
        data: {
          totalConversations: totalConvs[0].total,
          totalMessages: totalMsgs[0].total,
          userMessages: totalMsgs[0].user_messages,
          aiMessages: totalMsgs[0].ai_messages,
          activeUsers: activeUsers[0].total,
          events: events,
          dailyActivity: dailyActivity,
          averageMessagesPerConversation: Math.round(avgMsgs[0].average || 0),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Đọc cấu hình chatbot từ system_settings
  async getConfigurations(req, res, next) {
    try {
      const [configs] = await pool.query(
        'SELECT setting_key as config_key, setting_value as config_value, updated_at FROM system_settings WHERE setting_key LIKE "chatbot_%" OR setting_key = "ai_chatbot" ORDER BY setting_key'
      );

      const configObject = {};
      configs.forEach((config) => {
        configObject[config.config_key] = {
          value: config.config_value,
          updated_at: config.updated_at,
        };
      });

      res.json({ success: true, data: configObject });
    } catch (error) {
      next(error);
    }
  }

  // Cập nhật cấu hình chatbot
  async updateConfigurations(req, res, next) {
    try {
      const configs = req.body;
      // const adminId = req.user.id;

      for (const [key, value] of Object.entries(configs)) {
        await pool.query(
          'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
          [key, value]
        );
      }

      res.json({ success: true, message: 'Configurations updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Danh sách hội thoại (lọc user, tìm kiếm, phân trang)
  async getAllConversations(req, res, next) {
    try {
      const { userId, search, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = '1=1';
      const params = [];

      if (userId) {
        whereClause += ' AND c.user_id = ?';
        params.push(userId);
      }

      if (search) {
        whereClause += ' AND (c.title LIKE ? OR u.email LIKE ? OR u.first_name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const [conversations] = await pool.query(
        `
                SELECT 
                    c.id,
                    c.user_id,
                    c.title,
                    c.created_at,
                    c.updated_at,
                    u.email as user_email,
                    u.first_name,
                    u.last_name,
                    COUNT(cm.id) as message_count
                FROM conversations c
                INNER JOIN users u ON c.user_id = u.id
                LEFT JOIN chat_messages cm ON c.id = cm.conversation_id
                WHERE ${whereClause}
                GROUP BY c.id
                ORDER BY c.updated_at DESC
                LIMIT ? OFFSET ?
            `,
        [...params, parseInt(limit), parseInt(offset)]
      );

      // Tổng bản ghi (phân trang)
      const [countResult] = await pool.query(
        `
                SELECT COUNT(*) as total
                FROM conversations c
                INNER JOIN users u ON c.user_id = u.id
                WHERE ${whereClause}
            `,
        params
      );

      res.json({
        success: true,
        data: {
          conversations,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countResult[0].total,
            totalPages: Math.ceil(countResult[0].total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Chi tiết một hội thoại + toàn bộ tin nhắn
  async getConversationById(req, res, next) {
    try {
      const { id } = req.params;

      const [conversations] = await pool.query(
        `
                SELECT 
                    c.*,
                    u.email as user_email,
                    u.first_name,
                    u.last_name,
                    u.role
                FROM conversations c
                INNER JOIN users u ON c.user_id = u.id
                WHERE c.id = ?
            `,
        [id]
      );

      if (conversations.length === 0) {
        return res.status(404).json({ success: false, message: 'Conversation not found' });
      }

      const [messages] = await pool.query(
        'SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC',
        [id]
      );

      res.json({
        success: true,
        data: {
          conversation: conversations[0],
          messages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Xóa hội thoại (admin)
  async deleteUserConversation(req, res, next) {
    try {
      const { id } = req.params;

      await pool.query('DELETE FROM conversations WHERE id = ?', [id]);
      res.json({ success: true, message: 'Conversation deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Danh sách mẫu prompt (bảng ai_prompts)
  async getPromptTemplates(req, res, next) {
    try {
      const [templates] = await pool.query(`
                SELECT 
                    id, 
                    display_name as title, 
                    prompt_template as content, 
                    category, 
                    is_active, 
                    created_at, 
                    updated_at 
                FROM ai_prompts 
                ORDER BY created_at DESC
            `);

      res.json({ success: true, data: templates });
    } catch (error) {
      next(error);
    }
  }

  // Tạo mẫu prompt mới
  async createPromptTemplate(req, res, next) {
    try {
      const { title, content, category } = req.body;
      const adminId = req.user.id;

      if (!title || !content) {
        return res.status(400).json({ success: false, message: 'Title and content are required' });
      }

      // Sinh trường name duy nhất từ tiêu đề
      const name = title.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();

      const [result] = await pool.query(
        'INSERT INTO ai_prompts (name, display_name, prompt_template, category, created_by) VALUES (?, ?, ?, ?, ?)',
        [name, title, content, category, adminId]
      );

      res.json({
        success: true,
        data: { id: result.insertId, title, content, category },
      });
    } catch (error) {
      next(error);
    }
  }

  // Cập nhật mẫu prompt
  async updatePromptTemplate(req, res, next) {
    try {
      const { id } = req.params;
      const { title, content, category, is_active } = req.body;

      await pool.query(
        'UPDATE ai_prompts SET display_name = ?, prompt_template = ?, category = ?, is_active = ? WHERE id = ?',
        [title, content, category, is_active !== undefined ? is_active : true, id]
      );

      res.json({ success: true, message: 'Template updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Xóa mẫu prompt
  async deletePromptTemplate(req, res, next) {
    try {
      const { id } = req.params;

      await pool.query('DELETE FROM ai_prompts WHERE id = ?', [id]);
      res.json({ success: true, message: 'Template deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Xuất hội thoại (JSON hoặc CSV)
  async exportConversations(req, res, next) {
    try {
      const { format = 'json', startDate, endDate } = req.query;

      const [conversations] = await pool.query(
        `
                SELECT 
                    c.id as conversation_id,
                    c.title,
                    c.created_at,
                    u.email as user_email,
                    cm.message,
                    cm.is_ai,
                    cm.created_at as message_created_at
                FROM conversations c
                INNER JOIN users u ON c.user_id = u.id
                LEFT JOIN chat_messages cm ON c.id = cm.conversation_id
                WHERE c.created_at >= COALESCE(?, c.created_at) 
                AND c.created_at <= COALESCE(?, c.created_at)
                ORDER BY c.created_at DESC, cm.created_at ASC
            `,
        [startDate || null, endDate || null]
      );

      if (format === 'csv') {
        // Định dạng CSV tải về
        let csv = 'Conversation ID,Title,User Email,Message,Is AI,Created At\n';
        conversations.forEach((row) => {
          csv += `${row.conversation_id},"${row.title}","${row.user_email}","${row.message}",${row.is_ai},"${row.message_created_at}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=conversations.csv');
        res.send(csv);
      } else {
        res.json({ success: true, data: conversations });
      }
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminChatbotController();
