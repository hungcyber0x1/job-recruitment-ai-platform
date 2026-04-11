const BaseRepository = require('./Base');

class ChatRepository extends BaseRepository {
  constructor() {
    super('chat_messages');
  }

  async findConversation(userId, conversationId = null) {
    let query;
    let params;

    if (conversationId) {
      query = `
        SELECT * FROM chat_messages 
        WHERE conversation_id = ? 
        ORDER BY created_at ASC
      `;
      params = [conversationId];
    } else {
      query = `
        SELECT cm.* FROM chat_messages cm
        JOIN conversations c ON cm.conversation_id = c.id
        WHERE c.user_id = ? 
        ORDER BY cm.created_at ASC
      `;
      params = [userId];
    }

    const [rows] = await this.pool.query(query, params);
    return rows;
  }

  async saveMessage(messageData) {
    return await this.create(messageData);
  }
}

module.exports = new ChatRepository();
