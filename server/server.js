/**
 * Compatibility entrypoint for existing dev terminals/scripts that still execute `node server.js`.
 * The application entrypoint now lives in `src/server.js`.
 */
require('./src/server');
