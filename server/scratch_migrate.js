require('dotenv').config();
const { pool } = require('./src/config/database.config');

const queries = [
    'ALTER TABLE jobs ADD COLUMN flagged TINYINT(1) DEFAULT 0 AFTER status',
    'ALTER TABLE jobs ADD COLUMN moderation_note TEXT AFTER flagged',
    'ALTER TABLE jobs ADD COLUMN rejection_reason TEXT AFTER moderation_note',
    'ALTER TABLE jobs ADD COLUMN ai_risk DECIMAL(3,2) DEFAULT 0.00 AFTER rejection_reason',
    'ALTER TABLE blog_posts ADD COLUMN flagged TINYINT(1) DEFAULT 0 AFTER status',
    'ALTER TABLE ai_prompts ADD COLUMN display_name VARCHAR(100) AFTER prompt_key',
    'ALTER TABLE ai_prompts ADD COLUMN category VARCHAR(50) AFTER variables',
    "UPDATE ai_prompts SET display_name = CASE WHEN display_name IS NULL THEN prompt_key ELSE display_name END"
];

async function run() {
    for (const sql of queries) {
        try {
            await pool.query(sql);
            console.log('SUCCESS:', sql);
        } catch (err) {
            console.error('FAILED:', sql, '-', err.message);
        }
    }
    process.exit(0);
}

run();
