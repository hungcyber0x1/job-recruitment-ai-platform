const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

const poolLimit = Math.min(50, Math.max(2, parseInt(process.env.DB_POOL_LIMIT || '15', 10) || 15));

const dbPort = parseInt(String(process.env.DB_PORT || '3306'), 10);
const resolvedPort = Number.isFinite(dbPort) && dbPort > 0 ? dbPort : 3306;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: resolvedPort,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'recruitment_db',
  waitForConnections: true,
  connectionLimit: poolLimit,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    logger.info(`Gateway database connected successfully to ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
  } catch (error) {
    logger.error('Database connection failed:', error.message);
    throw error;
  }
};

const closeDB = async () => {
  try {
    await pool.end();
    logger.info('Database pool closed successfully');
  } catch (error) {
    logger.error('Error closing database pool:', error.message);
  }
};

module.exports = { pool, connectDB, closeDB };
