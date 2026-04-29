/**
 * Safe migration runner - adds missing columns without failing on duplicates.
 * Usage: node database/run-safe-migration.js
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

async function columnExists(connection, table, column) {
  try {
    const [rows] = await connection.query(
      `SELECT COUNT(*) as c FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column]
    );
    return rows[0].c > 0;
  } catch {
    return false;
  }
}

async function addColumnIfNotExists(connection, table, column, definition) {
  const exists = await columnExists(connection, table, column);
  if (exists) {
    console.log(`  skip ${table}.${column} (already exists)`);
    return;
  }

  try {
    await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`  added ${table}.${column}`);
  } catch (err) {
    console.log(`  skip ${table}.${column} (${err.message})`);
  }
}

async function runSafeMigration() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.query(`USE \`${process.env.DB_NAME || 'recruitment_db'}\``);

    console.log('Running safe migration...\n');

    await addColumnIfNotExists(
      connection,
      'jobs',
      'flagged',
      'TINYINT(1) NOT NULL DEFAULT 0 AFTER featured'
    );

    await addColumnIfNotExists(
      connection,
      'jobs',
      'rejection_reason',
      'TEXT NULL AFTER status'
    );

    await addColumnIfNotExists(
      connection,
      'blog_posts',
      'flagged',
      'TINYINT(1) NOT NULL DEFAULT 0 AFTER status'
    );

    await addColumnIfNotExists(
      connection,
      'blog_posts',
      'rejection_reason',
      'TEXT NULL AFTER status'
    );

    await addColumnIfNotExists(
      connection,
      'company_profiles',
      'flagged',
      'TINYINT(1) NOT NULL DEFAULT 0 AFTER verification_status'
    );

    await addColumnIfNotExists(
      connection,
      'company_profiles',
      'moderation_note',
      'TEXT NULL AFTER flagged'
    );

    console.log('\nSafe migration completed.');
  } catch (error) {
    console.error('\nMigration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

runSafeMigration();
