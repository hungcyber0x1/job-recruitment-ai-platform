/**
 * Wrapper for async route handlers to eliminate repetitive try-catch blocks
 * Automatically passes caught errors to the Express error handling middleware
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = catchAsync;
