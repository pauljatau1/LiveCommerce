const jwt = require('jsonwebtoken');

/**
 * Middleware that checks for authentication but doesn't require it
 * If a valid token is provided, it will attach the user to the request
 * If no token or invalid token is provided, it will still allow the request to proceed
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
      } catch (error) {
        // Invalid token - just proceed without user info
        console.log('Invalid token in optional auth:', error.message);
      }
    }
    
    next();
  } catch (error) {
    // In case of any other errors, proceed without user info
    console.error('Error in optional auth middleware:', error);
    next();
  }
};

module.exports = optionalAuthMiddleware; 