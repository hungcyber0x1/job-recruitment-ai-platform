const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        console.log('Starting migration...');

        // Check columns in employers
        const [empCols] = await connection.query('DESC employers');
        const colNames = empCols.map(c => c.Field);

        // 1. Add deleted_at to employers
        if (!colNames.includes('deleted_at')) {
            console.log('Adding deleted_at to employers...');
            await connection.query('ALTER TABLE employers ADD COLUMN deleted_at DATETIME DEFAULT NULL AFTER updated_at');
        } else {
            console.log('deleted_at already exists in employers.');
        }
        
        // 2. Add rejection_reason to employers
        if (!colNames.includes('rejection_reason')) {
            console.log('Adding rejection_reason to employers...');
            await connection.query('ALTER TABLE employers ADD COLUMN rejection_reason TEXT DEFAULT NULL AFTER moderation_note');
        } else {
            console.log('rejection_reason already exists in employers.');
        }

        // 3. Update users status enum
        console.log('Updating users.status enum...');
        await connection.query("ALTER TABLE users MODIFY COLUMN status ENUM('active', 'pending', 'banned', 'locked') DEFAULT 'active'");

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await connection.end();
    }
}

migrate();
