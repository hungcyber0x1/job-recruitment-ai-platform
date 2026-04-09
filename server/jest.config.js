module.exports = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['dotenv/config'],
  clearMocks: true,
  restoreMocks: true,
};
