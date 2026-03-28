/**
 * asyncHandler — wraps async route controllers to automatically
 * forward errors to the Express error middleware.
 *
 * @param {Function} fn - Async express controller
 * @returns {Function} Wrapped controller
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
