/**
 * Add deadline column to jobs table
 */
require('./load-dotenv');
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: false,
};

async function addDeadlineColumn() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.query(`USE \`${process.env.DB_NAME || 'recruitment_db'}\``);

    // Check if deadline column exists
    const [cols] = await connection.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'deadline'
    `);

    if (cols.length > 0) {
      console.log('  ⚠️  jobs.deadline đã tồn tại, bỏ qua');
    } else {
      console.log('  🔧 Thêm cột deadline vào bảng jobs...');
      await connection.query('ALTER TABLE jobs ADD COLUMN deadline DATE NULL DEFAULT NULL AFTER status');
      console.log('  ✅ jobs.deadline đã được thêm');
    }

    // Copy data from expires_at to deadline
    console.log('  🔧 Copy dữ liệu từ expires_at sang deadline...');
    const [result] = await connection.query(`
      UPDATE jobs SET deadline = expires_at
      WHERE expires_at IS NOT NULL AND deadline IS NULL
    `);
    console.log(`  ✅ Đã copy ${result.affectedRows} dòng`);

    // Add index
    console.log('  🔧 Thêm index idx_job_deadline...');
    try {
      await connection.query('CREATE INDEX idx_job_deadline ON jobs(deadline)');
      console.log('  ✅ Index đã được tạo');
    } catch (err) {
      if (err.message.includes('Duplicate')) {
        console.log('  ⚠️  Index đã tồn tại, bỏ qua');
      } else {
        console.log(`  ⚠️  Lỗi tạo index: ${err.message}`);
      }
    }

    console.log('\n🎉 Hoàn tất!');
  } catch (error) {
    console.error('\n❌ Lỗi:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

addDeadlineColumn();
