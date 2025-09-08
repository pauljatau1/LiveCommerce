/**
 * Save Individual SmileID Verification Validator
 *
 * This validator handles input validation for saving individual SmileID verification results.
 * It ensures that all required fields are present and valid before processing the verification.
 *
 * Business Logic:
 * - Validates required fields (smileIdResult, accountType, verifiedAt, verificationProvider)
 * - Ensures accountType is 'individual'
 * - Validates verificationProvider is 'SmileID'
 * - Validates verifiedAt is a valid date string
 * - Validates smileIdResult is an object with required properties
 *
 * Security Considerations:
 * - Required field validation prevents incomplete verification attempts
 * - Type validation ensures data consistency
 * - Provider validation ensures only trusted verification sources
 * - Date validation prevents invalid timestamp manipulation
 *
 * @module saveIndividualSmileIdVerificationValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validate smileIdResult object structure.
 *
 * This function validates that the SmileID result contains the necessary
 * properties for verification processing.
 *
 * @param {Object} smileIdResult - The SmileID verification result object
 * @param {Array} errors - Array to collect validation errors
 */
function validateSmileIdResult(smileIdResult, errors) {
  if (!smileIdResult) {
    errors.push({ 
      field: 'smileIdResult', 
      message: 'SmileID result is required' 
    });
    return;
  }

  if (typeof smileIdResult !== 'object') {
    errors.push({ 
      field: 'smileIdResult', 
      message: 'SmileID result must be an object' 
    });
    return;
  }

  // Validate that smileIdResult has at least some basic structure
  if (!smileIdResult.ResultCode && !smileIdResult.success && !smileIdResult.images) {
    errors.push({ 
      field: 'smileIdResult', 
      message: 'SmileID result must contain ResultCode, success, or images property' 
    });
  }
}

/**
 * Validate account type for individual verification.
 *
 * This function ensures that the account type is specifically 'individual'
 * for individual SmileID verification.
 *
 * @param {string} accountType - The account type to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateAccountType(accountType, errors) {
  if (!accountType) {
    errors.push({ 
      field: 'accountType', 
      message: 'Account type is required' 
    });
    return;
  }

  if (accountType !== 'individual') {
    errors.push({ 
      field: 'accountType', 
      message: 'Account type must be "individual" for individual verification' 
    });
  }
}

/**
 * Validate verification provider.
 *
 * This function ensures that the verification provider is 'SmileID'
 * for consistency and security.
 *
 * @param {string} verificationProvider - The verification provider to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateVerificationProvider(verificationProvider, errors) {
  if (!verificationProvider) {
    errors.push({ 
      field: 'verificationProvider', 
      message: 'Verification provider is required' 
    });
    return;
  }

  if (verificationProvider !== 'SmileID') {
    errors.push({ 
      field: 'verificationProvider', 
      message: 'Verification provider must be "SmileID"' 
    });
  }
}

/**
 * Validate verified date.
 *
 * This function ensures that the verified date is a valid date string
 * and can be parsed into a Date object.
 *
 * @param {string} verifiedAt - The verification date to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateVerifiedAt(verifiedAt, errors) {
  if (!verifiedAt) {
    errors.push({ 
      field: 'verifiedAt', 
      message: 'Verified date is required' 
    });
    return;
  }

  if (typeof verifiedAt !== 'string') {
    errors.push({ 
      field: 'verifiedAt', 
      message: 'Verified date must be a string' 
    });
    return;
  }

  // Validate that the date can be parsed
  const parsedDate = new Date(verifiedAt);
  if (isNaN(parsedDate.getTime())) {
    errors.push({ 
      field: 'verifiedAt', 
      message: 'Verified date must be a valid date string' 
    });
  }
}

/**
 * Validate save individual SmileID verification data.
 *
 * This function validates all required fields for saving individual
 * SmileID verification results.
 *
 * Business Logic:
 * - Validates all required fields are present
 * - Ensures data types are correct
 * - Validates business rules for individual verification
 * - Collects all validation errors for comprehensive reporting
 *
 * Security Considerations:
 * - Prevents incomplete verification data submission
 * - Ensures data integrity and consistency
 * - Validates provider and account type for security
 *
 * @param {Object} data - The verification data to validate
 * @throws {ValidationError} If validation fails with specific error details
 */
function validateSaveIndividualSmileIdVerificationData(data) {
  // Step 1: Initialize error collection array
  // This will collect all validation errors for comprehensive reporting
  const errors = [];

  // Step 2: Validate required fields
  // This ensures all necessary information is provided for verification
  validateSmileIdResult(data.smileIdResult, errors);
  validateAccountType(data.accountType, errors);
  validateVerificationProvider(data.verificationProvider, errors);
  validateVerifiedAt(data.verifiedAt, errors);

  // Step 3: Throw ValidationError if any validation fails
  // This provides comprehensive error feedback to the caller
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateSaveIndividualSmileIdVerificationData,
};
