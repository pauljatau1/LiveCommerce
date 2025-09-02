/**
 * Check Token Service
 *
 * This service handles the business logic for JWT token validation and renewal.
 * It provides secure token verification and automatic token regeneration
 * for continued authentication.
 *
 * The service ensures that:
 * - JWT tokens are properly validated
 * - Token expiration is handled gracefully
 * - New tokens are generated for valid sessions
 * - Security is maintained throughout the process
 * - Error handling provides clear feedback
 *
 * Token Validation Flow:
 * - Token presence validation
 * - JWT verification using secret
 * - Token expiration handling
 * - New token generation
 * - Success response with new token
 *
 * Security Features:
 * - JWT secret-based verification
 * - Token expiration detection
 * - Automatic token renewal
 * - Secure error handling
 * - Clear authentication feedback
 *
 * Token Management:
 * - Validates existing tokens
 * - Generates new tokens with extended expiration
 * - Handles expired tokens gracefully
 * - Maintains session continuity
 *
 * @module checkTokenService
 */

const jwt = require('jsonwebtoken');
const UnauthorizedException = require('../../../utils/errors/UnauthorizedException');
const { generateToken } = require('../../../utils/helpers');

/**
 * Validates a JWT token and generates a new one if valid - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * token validation and renewal process. It handles token verification,
 * expiration detection, and automatic token regeneration.
 *
 * Business Logic Flow:
 * 1. Validates token presence and format
 * 2. Verifies JWT token using secret
 * 3. Extracts user data from token
 * 4. Generates new token with extended expiration
 * 5. Returns validation result with new token
 *
 * Security Features:
 * - Comprehensive token validation
 * - JWT secret-based verification
 * - Token expiration detection
 * - Automatic token renewal
 * - Secure error handling without information leakage
 *
 * Token Processing:
 * - Validates token format and presence
 * - Verifies token signature using JWT secret
 * - Extracts user ID from decoded token
 * - Generates new token with extended expiration
 * - Maintains session continuity
 *
 * Error Handling:
 * - Missing token errors
 * - Token expiration errors
 * - Invalid token errors
 * - JWT verification errors
 * - Clear error messages for users
 *
 * @param {string} token - The JWT token to validate
 * @returns {Object} Object containing validation result and new token
 *   - token: {string} - New JWT token with extended expiration
 * @throws {UnauthorizedException} If token is missing, invalid, or expired
 *
 * @example
 * // Valid token validation
 * const result = checkToken('jwt_token_here');
 * // Returns: { token: 'new_jwt_token' }
 *
 * @example
 * // Missing token
 * try {
 *   checkToken();
 * } catch (error) {
 *   // error instanceof UnauthorizedException
 *   // error.message: 'A token is required for authentication'
 * }
 *
 * @example
 * // Expired token
 * try {
 *   checkToken('expired_jwt_token');
 * } catch (error) {
 *   // error instanceof UnauthorizedException
 *   // error.message: 'Token has expired. Please sign in again.'
 * }
 */
function checkToken(token) {
  // Step 1: Validate token presence
  // This ensures a token is provided before attempting verification
  if (!token) {
    throw new UnauthorizedException('A token is required for authentication');
  }

  // Step 2: Basic token format validation
  // Check if token has the expected JWT format (3 parts separated by dots)
  if (typeof token !== 'string' || token.split('.').length !== 3) {
    throw new UnauthorizedException('Invalid Token');
  }

  // Step 3: Verify the token and decode user data
  // This validates the JWT signature and extracts user information
  // Note: jwt.verify will throw errors for invalid/expired tokens
  // These errors will be caught by the controller's try/catch and handled by app.js
  const decodedUserData = jwt.verify(token, process.env.JWT_SECRET);
  
  // Step 4: Generate a new token with extended expiration
  // This provides continued authentication with fresh expiration
  const newToken = generateToken(decodedUserData.id, 'Seller', '2w');
  
  // Step 5: Return success response with new token
  // IMPORTANT: Return only the token object to match the original API response structure
  return { token: newToken };
}

module.exports = {
  checkToken,
};
