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
  multipleStatements: false,
};

/**
 * Split SQL text into individual statements,
 * being careful not to split inside quoted strings.
 */
function splitSqlStatements(sqlText) {
  const statements = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let escaped = false;
  let inBlockComment = false;
  let inLineComment = false;

  for (let i = 0; i < sqlText.length; i++) {
    const ch = sqlText[i];
    const nextCh = sqlText[i + 1] || '';

    // Handle line comments
    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false;
        current += ch;
      }
      continue;
    }

    // Handle block comments
    if (inBlockComment) {
      if (ch === '*' && nextCh === '/') {
        inBlockComment = false;
        i++; // skip the /
      }
      continue;
    }

    // Enter comments
    if (ch === '/' && nextCh === '*') {
      inBlockComment = true;
      i++;
      continue;
    }
    if (ch === '-' && nextCh === '-') {
      inLineComment = true;
      i++;
      continue;
    }

    // Handle escape
    if (escaped) {
      escaped = false;
      current += ch;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      current += ch;
      continue;
    }

    // Handle quotes
    if (ch === "'" && !inDoubleQuote && !inBacktick) {
      inSingleQuote = !inSingleQuote;
      current += ch;
      continue;
    }
    if (ch === '"' && !inSingleQuote && !inBacktick) {
      inDoubleQuote = !inDoubleQuote;
      current += ch;
      continue;
    }
    if (ch === '`' && !inSingleQuote && !inDoubleQuote) {
      inBacktick = !inBacktick;
      current += ch;
      continue;
    }

    // Handle semicolon (statement terminator) - only when not inside quotes
    if (ch === ';' && !inSingleQuote && !inDoubleQuote && !inBacktick) {
      const trimmed = current.trim();
      if (trimmed && !trimmed.startsWith('--')) {
        statements.push(trimmed);
      }
      current = '';
      continue;
    }

    current += ch;
  }

  // Push any remaining content
  const remaining = current.trim();
  if (remaining && !remaining.startsWith('--')) {
    statements.push(remaining);
  }

  return statements;
}

async function runSeeds() {
  console.log('Connecting to database for seeding with config:', { ...dbConfig, password: '****' });
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log(
      `✅ Kết nối database "${dbConfig.database}" thành công (${dbConfig.host}:${dbConfig.port})\n`
    );

    const files = fs
      .readdirSync(seedsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`🌱 Chạy ${files.length} seed files...\n`);

    for (const file of files) {
      const filePath = path.join(seedsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      const statements = splitSqlStatements(sql);

      console.log(`  📄 ${file} (${statements.length} statements)`);

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (!stmt || stmt.length < 3) continue;

        try {
          await connection.query(stmt);
        } catch (err) {
          const isDup = err.code === 'ER_DUP_ENTRY' || err.code === 'ER_DUP_KEYNAME';
          if (!isDup) {
            // Show which statement failed
            const preview = stmt.substring(0, 80).replace(/\n/g, ' ');
            throw new Error(`❌ Lỗi tại ${file} stmt[${i + 1}]: ${err.message}\n   Preview: ${preview}...`);
          }
        }
      }
      console.log(`  ✅ ${file}`);
    }

    console.log('\n🎉 Seed data hoàn tất!\n');
    console.log('📋 Tài khoản mẫu (tất cả password: Password@123):\n');
    console.log('   👑 Admin:');
    console.log('      admin@hireai.vn');
    console.log('   🏢 Recruiter (Nhà tuyển dụng):');
    console.log('      minh.nguyen@techcorp.vn     - TechCorp Vietnam');
    console.log('      long.tran@nextech.vn      - Nextech Japan');
    console.log('      phuong.nguyen@greenleaf.vn - GreenLeaf Media');
    console.log('   👤 Candidate (Ứng viên):');
    console.log('      hung.lee@gmail.com   - Hùng Lê (Full-stack Dev)');
    console.log('      nam.pham@gmail.com   - Nam Phạm (Frontend Dev)');
    console.log('      lan.phan@gmail.com   - Lan Phan (Marketing)');
    console.log('      my.nguyen@gmail.com  - My Nguyễn (Content Marketing)');
    console.log('      nhi.le@gmail.com     - Nhi Lê (Marketing Intern)\n');
    console.log('📌 Tổng: ' + files.length + ' seed files đã chạy\n');
  } catch (error) {
    console.error('\n❌ Seed thất bại:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

runSeeds();
