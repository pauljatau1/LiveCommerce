/**
 * Login Service
 *
 * This service handles the business logic for seller authentication functionality.
 * It provides comprehensive login capabilities including email/password authentication
 * and secure session management.
 *
 * The service ensures that:
 * - Login credentials are properly validated
 * - Email/password authentication is supported
 * - JWT tokens are generated for session management
 * - User data is returned securely
 * - Secure password comparison
 *
 * Authentication Methods:
 * - Email/password authentication
 * - Secure password comparison
 * - Token-based authentication
 *
 * Security Features:
 * - Comprehensive input validation
 * - Secure password comparison
 * - JWT token generation
 * - Error handling without information leakage
 *
 * @module loginService
 */

const { generateToken } = require('../../../utils/helpers');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const { validateLoginData } = require('../validators/login.validator');
const { findByEmail } = require('../repositories/seller.repository');

/**
 * Logs in a seller using email/password - Main business logic function.
 *
 * This is the primary service function that orchestrates the complete
 * seller authentication process. It handles traditional email/password
 * authentication for seller accounts.
 *
 * Business Logic Flow:
 * 1. Validates the input data (email, password)
 * 2. Performs user lookup and credential verification
 * 3. Generates JWT token for session management
 * 4. Returns authenticated user data and token
 *
 * Authentication Methods:
 * - Email/password: Traditional credential verification
 * - Secure password comparison using bcrypt
 *
 * Security Features:
 * - Comprehensive input validation before processing
 * - Secure password comparison using bcrypt
 * - JWT token generation for session management
 * - Error handling without credential information leakage
 *
 * @param {Object} data - The login request data object
 * @param {string} data.email - Seller's email address
 * @param {string} data.password - Seller's password
 * @returns {Promise<Object>} Authenticated user data and JWT token
 *   - user: {Object} - The authenticated seller object
 *   - token: {string} - JWT authentication token
 * @throws {Error} If input validation fails
 * @throws {NotFoundException} If user not found or invalid credentials
 * @throws {Error} If database operations fail
 *
 * @example
 * // Email/password login
 * const result = await login({
 *   email: 'seller@example.com',
 *   password: 'sellerPassword123'
 * });
 * // Returns: { user: { ... }, token: 'jwt_token_here' }
 */
async function login(data) {
  // Step 1: Validate input data using the validator
  // This ensures email and password are provided and properly formatted
  validateLoginData(data);

  const { email, password } = data;

  // Step 2: Perform traditional email/password authentication
  // Find seller by email and verify password
  const seller = await findByEmail(email);
  if (!seller || !(await seller.comparePassword(password))) {
    throw new NotFoundException('Invalid credentials');
  }

  // Step 3: Generate JWT token for session management
  // This provides secure authentication for subsequent requests
  const token = await generateToken(seller._id, 'Seller', '2w', seller.authVersion || 0);
  
  // Step 4: Return authenticated user data and token (exclude password for security)
  const userResponse = seller.toObject ? seller.toObject() : { ...seller };
  delete userResponse.password;
  return { user: userResponse, token: token };
}

module.exports = {
  login,
};
