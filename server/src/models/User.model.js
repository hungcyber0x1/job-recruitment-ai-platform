/**
 * User Model Schema
 *
 * id: INT AUTO_INCREMENT PRIMARY KEY
 * email: VARCHAR(255) NOT NULL UNIQUE
 * password: VARCHAR(255) NOT NULL
 * role: ENUM('admin', 'employer', 'candidate')
 * first_name: VARCHAR(100)
 * last_name: VARCHAR(100)
 * avatar_url: VARCHAR(255)
 * is_active: BOOLEAN DEFAULT TRUE
 * created_at: TIMESTAMP
 * updated_at: TIMESTAMP
 */

module.exports = {}; // Exporting as placeholder for schema reference
