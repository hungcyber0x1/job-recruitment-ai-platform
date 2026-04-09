/**
 * db-reset.js
 * Xóa toàn bộ database và tạo lại từ đầu (migrate + seed)
 * ⚠️ CHỈ DÙNG TRONG MÔI TRƯỜNG DEVELOPMENT!
 *
 * Cách dùng:
 *   node database/db-reset.js
 *   npm run db:reset
 */

require('./load-dotenv');
const mysql = require('mysql2/promise');
const { execSync } = require('child_process');

const DB_NAME = process.env.DB_NAME || 'hire_ai_db';

async function resetDatabase() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ KHÔNG được chạy db:reset trên môi trường PRODUCTION!');
    process.exit(1);
  }

  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log(`⚠️  Xóa database "${DB_NAME}"...`);
    await connection.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);
    console.log(`✅ Đã xóa database "${DB_NAME}"\n`);

    await connection.end();
  } catch (error) {
    console.error('❌ Lỗi khi xóa database:', error.message);
    process.exit(1);
  }

  // Chạy migrations
  console.log('📦 Bắt đầu chạy migrations...\n');
  execSync('node database/run-migrations.js', { stdio: 'inherit' });

  // Chạy seeds
  console.log('\n🌱 Bắt đầu chạy seed data...\n');
  execSync('node database/run-seeds.js', { stdio: 'inherit' });

  console.log('\n✅ Database đã được reset hoàn tất!');
}

resetDatabase();
