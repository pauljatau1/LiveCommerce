const jwt = require('jsonwebtoken');
const UnauthorizedException = require('../../../utils/errors/UnauthorizedException');

/**
 * Validates a JWT token and generates a new one if valid.
 *
 * This function:
 * - Extracts the token from the authorization header
 * - Verifies the token using the JWT secret
 * - Generates a new token with extended expiration
 * - Returns the new token for continued authentication
 *
 * @param {string} token - The JWT token to validate
 * @returns {Promise<Object>} Object containing the new token
 * @throws {UnauthorizedException} If token is invalid or expired
 */
async function checkToken(token) {
  if (!token) {
    throw new UnauthorizedException('A token is required for authentication');
  }

  try {
    // Verify the token and decode user data
    const decodedUserData = jwt.verify(token, process.env.JWT_SECRET);
    
    // Generate a new token with extended expiration
    const newToken = generateToken(decodedUserData.id);
    
    return {
      message: 'Token is valid',
      token: newToken
    };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedException('Token has expired. Please sign in again.');
    }
    throw new UnauthorizedException('Invalid Token');
  }
}

/**
 * Helper function to generate JWT token.
 * 
 * @param {string} id - User ID
 * @returns {string} JWT token
 */
function generateToken(id) {
  return jwt.sign({ id, role: 'Buyer' }, process.env.JWT_SECRET, { expiresIn: '2w' });
}

module.exports = {
  checkToken,
}; 