-- Migration: 067_add_message_feedback
-- Adds feedback column to chat_messages for thumbs up/down rating

ALTER TABLE chat_messages
ADD COLUMN feedback ENUM('positive', 'negative') DEFAULT NULL AFTER attachment_type;

-- Index for efficient feedback queries
CREATE INDEX idx_chat_messages_feedback ON chat_messages(feedback);

-- Update comment
ALTER TABLE chat_messages COMMENT = 'Stores chatbot messages with optional user feedback (positive/negative)';
