// Global error handler — registered once in index.ts after all routes:
//   app.use(errorHandler)

// Catches any error thrown or passed via next(error):
//   - Known errors (e.g. with a statusCode property): return that status + message
//   - Unknown errors: log the stack trace, return 500 + generic message
//   - Always returns JSON: { "error": "message" }
