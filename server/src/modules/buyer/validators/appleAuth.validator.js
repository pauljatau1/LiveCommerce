/**
 * Apple OAuth Validator for Buyers
 *
 * This validator handles input validation for Apple OAuth authentication requests.
 * It ensures that the Apple ID token and nonce are properly provided and formatted
 * before processing the authentication request.
 *
 * Validation Rules:
 * - Token must be present and non-empty
 * - Token must be a string type
 * - rawNonce must be present and non-empty (required for Apple Sign-In)
 * - Optional fields: firstName, lastName, email (only on first sign-in)
 * - Optional fields: fromDev (boolean), expoPushToken (string)
 *
 * @module appleAuthValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates Apple OAuth authentication request data.
 *
 * This function performs comprehensive validation on the Apple OAuth
 * authentication request to ensure all required data is present and
 * properly formatted before processing.
 *
 * @param {Object} data - The Apple OAuth request data
 * @param {string} data.token - The Apple ID token from frontend
 * @param {string} data.rawNonce - The raw nonce used during Apple Sign-In
 * @param {string} [data.firstName] - Optional first name (only on first sign-in)
 * @param {string} [data.lastName] - Optional last name (only on first sign-in)
 * @param {string} [data.email] - Optional email (only on first sign-in)
 * @param {boolean} [data.fromDev] - Optional dev environment flag
 * @param {string} [data.expoPushToken] - Optional Expo push token
 * @throws {ValidationError} If validation fails with detailed error messages
 *
 * @example
 * // Valid request
 * validateAppleAuthData({ token: 'apple_id_token_here', rawNonce: 'nonce_here' });
 * // No error thrown
 *
 * @example
 * // Invalid request - missing token
 * validateAppleAuthData({ rawNonce: 'nonce_here' });
 * // Throws ValidationError with field: 'token', message: 'Apple ID token is required'
 */
function validateAppleAuthData(data) {
    const errors = [];

    // Check if token is provided
    if (!data.token) {
        errors.push({
            field: 'token',
            message: 'Apple ID token is required'
        });
    } else {
        // Validate token type
        if (typeof data.token !== 'string') {
            errors.push({
                field: 'token',
                message: 'Apple ID token must be a string'
            });
        } else if (data.token.trim() === '') {
            errors.push({
                field: 'token',
                message: 'Apple ID token cannot be empty'
            });
        }
    }

    // Check if rawNonce is provided (required for Apple Sign-In)
    if (!data.rawNonce) {
        errors.push({
            field: 'rawNonce',
            message: 'Nonce is required for Apple Sign-In'
        });
    } else {
        // Validate rawNonce type
        if (typeof data.rawNonce !== 'string') {
            errors.push({
                field: 'rawNonce',
                message: 'Nonce must be a string'
            });
        } else if (data.rawNonce.trim() === '') {
            errors.push({
                field: 'rawNonce',
                message: 'Nonce cannot be empty'
            });
        }
    }

    // Validate optional firstName
    if (data.firstName !== undefined && data.firstName !== null) {
        if (typeof data.firstName !== 'string') {
            errors.push({
                field: 'firstName',
                message: 'First name must be a string'
            });
        }
    }

    // Validate optional lastName
    if (data.lastName !== undefined && data.lastName !== null) {
        if (typeof data.lastName !== 'string') {
            errors.push({
                field: 'lastName',
                message: 'Last name must be a string'
            });
        }
    }

    // Validate optional email
    if (data.email !== undefined && data.email !== null) {
        if (typeof data.email !== 'string') {
            errors.push({
                field: 'email',
                message: 'Email must be a string'
            });
        } else if (data.email.trim() !== '' && !data.email.includes('@')) {
            errors.push({
                field: 'email',
                message: 'Email must be a valid email address'
            });
        }
    }

    // Validate optional fromDev
    if (data.fromDev !== undefined && data.fromDev !== null) {
        if (typeof data.fromDev !== 'boolean') {
            errors.push({
                field: 'fromDev',
                message: 'fromDev must be a boolean'
            });
        }
    }

    // Validate optional expoPushToken
    if (data.expoPushToken !== undefined) {
        if (typeof data.expoPushToken !== 'string') {
            errors.push({
                field: 'expoPushToken',
                message: 'Expo push token must be a string'
            });
        } else if (data.expoPushToken.trim() === '') {
            errors.push({
                field: 'expoPushToken',
                message: 'Expo push token cannot be empty if provided'
            });
        }
    }

    // Throw validation error if any issues found
    if (errors.length > 0) {
        throw new ValidationError(errors);
    }
}

module.exports = {
    validateAppleAuthData
};
