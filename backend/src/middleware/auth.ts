// authenticate — reads "Authorization: Bearer <token>" header
//   - Verifies JWT with process.env.JWT_SECRET
//   - Attaches decoded payload (userId, role) to req (e.g. req.user)
//   - Returns 401 if token is missing or invalid

// requireRole(role) — returns middleware that checks req.user.role
//   - Returns 403 if the user's role doesn't match
//   - Must run after authenticate
