/**
 * Load env for DB scripts regardless of process.cwd().
 * Prefers server/.env, then repo-root .env (monorepo), then default dotenv behavior.
 */
const fs = require('fs');
const path = require('path');

const serverEnv = path.join(__dirname, '..', '.env');
const rootEnv = path.join(__dirname, '..', '..', '.env');

if (fs.existsSync(serverEnv)) {
  require('dotenv').config({ path: serverEnv });
} else if (fs.existsSync(rootEnv)) {
  require('dotenv').config({ path: rootEnv });
} else {
  require('dotenv').config();
}
