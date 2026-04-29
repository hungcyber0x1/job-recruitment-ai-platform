const mysql = require('./server/node_modules/mysql2/promise');
const bcrypt = require('./server/node_modules/bcryptjs');

async function checkUsers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '030204',
    database: 'recruitment_db'
  });

  const [rows] = await connection.query(
    "SELECT id, email, role, password FROM users ORDER BY id"
  );

  console.log('All users and password verification:\n');
  
  for (const user of rows) {
    const isMatch = await bcrypt.compare('Password@123', user.password);
    console.log(`${user.role.padEnd(12)} | ${user.email.padEnd(35)} | Password@123: ${isMatch ? '✅' : '❌'}`);
  }

  await connection.end();
}

checkUsers().catch(console.error);
