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
 * @returns {Promise<Object>} Object containing validation result and new token
 *   - message: {string} - Success message confirming token validity
 *   - token: {string} - New JWT token with extended expiration
 * @throws {UnauthorizedException} If token is missing, invalid, or expired
 *
 * @example
 * // Valid token validation
 * const result = await checkToken('jwt_token_here');
 * // Returns: { message: 'Token is valid', token: 'new_jwt_token' }
 *
 * @example
 * // Missing token
 * try {
 *   await checkToken();
 * } catch (error) {
 *   // error instanceof UnauthorizedException
 *   // error.message: 'A token is required for authentication'
 * }
 *
 * @example
 * // Expired token
 * try {
 *   await checkToken('expired_jwt_token');
 * } catch (error) {
 *   // error instanceof UnauthorizedException
 *   // error.message: 'Token has expired. Please sign in again.'
 * }
 */
async function checkToken(token) {
  // Step 1: Validate token presence
  // This ensures a token is provided before attempting verification
  if (!token) {
    throw new UnauthorizedException('A token is required for authentication');
  }

  try {
    // Step 2: Verify the token and decode user data
    // This validates the JWT signature and extracts user information
    const decodedUserData = jwt.verify(token, process.env.JWT_SECRET);
    if (decodedUserData.role !== 'Buyer') throw new UnauthorizedException('Please sign in again.');
    await require('../../../services/auth/sessions').assertSession(decodedUserData);
    
    // Step 3: Generate a new token with extended expiration
    // This provides continued authentication with fresh expiration
    const newToken = await generateToken(decodedUserData.id, 'Buyer', '500w', decodedUserData.v || 0);
    
    // Step 4: Return success response with new token
    return {
      message: 'Token is valid',
      token: newToken
    };
  } catch (err) {
    // Step 5: Handle specific JWT errors
    // This provides clear feedback for different error scenarios
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedException('Token has expired. Please sign in again.');
    }
    throw new UnauthorizedException('Invalid Token');
  }
}

module.exports = {
  checkToken,
}; 