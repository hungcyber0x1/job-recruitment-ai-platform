/**
 * Chỉ chạy seed việc làm (05_sample_jobs.sql) — tiện khi đã có DB nhưng thiếu tin published.
 *
 *   node database/run-seed-jobs.js
 *
 * Docker (backend có volume server):
 *   docker compose exec backend node database/run-seed-jobs.js
 */
const fs = require('fs');
const path = require('path');
require('./load-dotenv');
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'recruitment_db',
  multipleStatements: true,
};

async function main() {
  const sqlPath = path.join(__dirname, 'seeds', '05_sample_jobs.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log('Connecting:', { ...dbConfig, password: '****' });
  const conn = await mysql.createConnection(dbConfig);
  try {
    await conn.query(sql);
    console.log('OK: Đã chạy 05_sample_jobs.sql');
    const [rows] = await conn.query("SELECT COUNT(*) AS c FROM jobs WHERE status = 'published'");
    console.log('Số tin published hiện tại:', rows[0]?.c ?? '?');
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error('Lỗi:', e.message);
  process.exit(1);
});
