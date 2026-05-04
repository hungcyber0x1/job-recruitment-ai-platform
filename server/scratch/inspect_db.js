const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function inspect() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  try {
    const tables = ['employers', 'users', 'jobs', 'email_logs'];
    for (const table of tables) {
      console.log(`\n--- DESC ${table} ---`);
      try {
        const [desc] = await connection.query(`DESC ${table}`);
        console.table(desc);
      } catch {
        console.log(`${table} table does not exist`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

inspect();
