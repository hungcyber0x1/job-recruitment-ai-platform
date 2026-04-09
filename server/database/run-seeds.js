/**
 * run-seeds.js
 * Chạy tất cả file seed SQL để tạo dữ liệu mẫu
 *
 * Cách dùng:
 *   node database/run-seeds.js
 *
 * Hoặc thêm vào package.json:
 *   "db:seed": "node database/run-seeds.js"
 */

const fs = require('fs');
const path = require('path');
require('./load-dotenv');
const mysql = require('mysql2/promise');

const seedsDir = path.join(__dirname, 'seeds');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'recruitment_db',
  multipleStatements: true,
};

async function runSeeds() {
  console.log('Connecting to database for seeding with config:', { ...dbConfig, password: '****' });
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log(
      `✅ Kết nối database "${dbConfig.database}" thành công (${dbConfig.host}:${dbConfig.port})\n`
    );

    // Lấy danh sách file .sql, sắp xếp theo thứ tự
    const files = fs
      .readdirSync(seedsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`🌱 Chạy ${files.length} seed files...\n`);

    for (const file of files) {
      const filePath = path.join(seedsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await connection.query(sql);
        console.log(`  ✅ ${file}`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`  ⚠️  ${file} (dữ liệu đã tồn tại, bỏ qua)`);
        } else {
          throw new Error(`❌ Lỗi tại ${file}: ${err.message}`);
        }
      }
    }

    console.log('\n🎉 Seed data hoàn tất!\n');
    console.log('📋 Tài khoản mẫu:');
    console.log('   Admin    : admin@hireai.vn        | Password@123');
    console.log('   Employer : employer1@techcorp.vn  | Password@123');
    console.log('   Employer : employer2@marketplus.vn| Password@123');
    console.log('   Candidate: candidate1@gmail.com   | Password@123');
    console.log('   Candidate: candidate2@gmail.com   | Password@123');
    console.log('   Candidate: candidate3@gmail.com   | Password@123\n');
  } catch (error) {
    console.error('\n❌ Seed thất bại:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

runSeeds();
