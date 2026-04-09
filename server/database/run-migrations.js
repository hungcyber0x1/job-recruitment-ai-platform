/**
 * run-migrations.js
 * Tự động chạy tất cả file SQL trong thư mục migrations/ theo thứ tự số
 *
 * Cách dùng:
 *   node database/run-migrations.js
 *
 * Hoặc thêm vào package.json scripts:
 *   "db:migrate": "node database/run-migrations.js"
 */

require('./load-dotenv');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'migrations');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
};

async function runMigrations() {
  console.log('Connecting to database with config:', { ...dbConfig, password: '****' });
  let connection;

  try {
    // Kết nối không specify database để tạo DB nếu chưa có
    connection = await mysql.createConnection(dbConfig);

    const DB_NAME = process.env.DB_NAME || 'recruitment_db';

    // Tạo database nếu chưa tồn tại
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✅ Database "${DB_NAME}" ready on ${dbConfig.host}:${dbConfig.port}`);

    // Chọn database
    await connection.query(`USE \`${DB_NAME}\``);

    // Lấy danh sách file .sql, sắp xếp theo thứ tự tên
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`\n📦 Chạy ${files.length} migration files...\n`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await connection.query(sql);
        console.log(`  ✅ ${file}`);
      } catch (err) {
        // Bỏ qua lỗi "already exists" hoặc "duplicate column"
        if (
          err.code === 'ER_TABLE_EXISTS_ERROR' ||
          err.code === 'ER_DUP_KEYNAME' ||
          err.code === 'ER_DUP_FIELDNAME' ||
          err.errno === 1060
        ) {
          console.log(`  ⚠️  ${file} (đã tồn tại, bỏ qua)`);
        } else {
          throw new Error(`❌ Lỗi tại ${file}: ${err.message}`);
        }
      }
    }

    console.log('\n🎉 Tất cả migrations đã chạy thành công!\n');
  } catch (error) {
    console.error('\n❌ Migration thất bại');
    const parts = [
      error.message,
      error.code,
      error.errno != null ? `errno ${error.errno}` : '',
      error.sqlMessage,
      error.cause?.message,
    ].filter(Boolean);
    console.error(parts.length ? parts.join(' | ') : String(error));
    if (process.env.DEBUG_MIGRATE === '1') console.error(error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

runMigrations();
