/**
 * Google OAuth Validator
 *
 * This validator handles input validation for Google OAuth authentication requests.
 * It ensures that the Google ID token is properly provided and formatted before
 * processing the authentication request.
 *
 * The validator ensures that:
 * - Google ID token is provided and is a valid string
 * - Token format meets basic requirements
 * - Input data structure is correct
 * - Proper error messages are returned for validation failures
 *
 * Validation Rules:
 * - Token must be present and non-empty
 * - Token must be a string type
 * - Token must have minimum length requirements
 *
 * @module googleAuthValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates Google OAuth authentication request data.
 *
 * This function performs comprehensive validation on the Google OAuth
 * authentication request to ensure all required data is present and
 * properly formatted before processing.
 *
 * Validation Process:
 * 1. Check if token field is present
 * 2. Validate token is a string
 * 3. Validate token is not empty
 * 4. Validate token meets minimum length requirements
 * 5. Return validation errors if any issues found
 *
 * @param {Object} data - The Google OAuth request data
 * @param {string} data.token - The Google ID token from frontend
 * @throws {ValidationError} If validation fails with detailed error messages
 *
 * @example
 * // Valid request
 * validateGoogleAuthData({ token: 'google_id_token_here' });
 * // No error thrown
 *
 * @example
 * // Invalid request - missing token
 * validateGoogleAuthData({});
 * // Throws ValidationError with field: 'token', message: 'Google ID token is required'
 *
 * @example
 * // Invalid request - empty token
 * validateGoogleAuthData({ token: '' });
 * // Throws ValidationError with field: 'token', message: 'Google ID token cannot be empty'
 */
function validateGoogleAuthData(data) {
  const errors = [];

  // Check if token is provided
  if (!data.token) {
    errors.push({
      field: 'token',
      message: 'Google ID token is required'
    });
  } else {
    // Validate token type
    if (typeof data.token !== 'string') {
      errors.push({
        field: 'token',
        message: 'Google ID token must be a string'
      });
    } else {
      // Validate token is not empty
      if (data.token.trim() === '') {
        errors.push({
          field: 'token',
          message: 'Google ID token cannot be empty'
        });
      } else if (data.token.length < 10) {
        // Basic length validation (Google ID tokens are typically much longer)
        errors.push({
          field: 'token',
          message: 'Google ID token appears to be invalid (too short)'
        });
      }
    }
  }

  // Throw validation error if any issues found
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateGoogleAuthData
};
