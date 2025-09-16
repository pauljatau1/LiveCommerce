/**
 * SmileID Callback Validator
 *
 * This validator handles input validation for SmileID verification callback data.
 * It ensures that all required fields are present and valid before processing the callback.
 *
 * Business Logic:
 * - Validates required fields (job_id, partner_params, result information)
 * - Ensures partner_params contains seller_id and account_type
 * - Validates result code and verification data structure
 * - Ensures callback data integrity and consistency
 *
 * Security Considerations:
 * - Required field validation prevents incomplete callback processing
 * - Type validation ensures data consistency
 * - Partner params validation ensures proper seller identification
 * - Result validation prevents invalid verification attempts
 *
 * @module smileIdCallbackValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validate job ID field.
 *
 * This function ensures that the job ID is present and valid
 * for tracking the verification process.
 *
 * @param {string} jobId - The job ID to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateJobId(jobId, errors) {
  if (!jobId) {
    errors.push({ 
      field: 'job_id', 
      message: 'Job ID is required' 
    });
    return;
  }

  if (typeof jobId !== 'string' && typeof jobId !== 'number') {
    errors.push({ 
      field: 'job_id', 
      message: 'Job ID must be a string or number' 
    });
  }
}

/**
 * Validate partner parameters.
 *
 * This function ensures that partner parameters contain the necessary
 * information for seller identification and account type.
 *
 * @param {Object} partnerParams - The partner parameters to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validatePartnerParams(partnerParams, errors) {
  if (!partnerParams) {
    errors.push({ 
      field: 'partner_params', 
      message: 'Partner parameters are required' 
    });
    return;
  }

  if (typeof partnerParams !== 'object') {
    errors.push({ 
      field: 'partner_params', 
      message: 'Partner parameters must be an object' 
    });
    return;
  }

  if (!partnerParams.seller_id) {
    errors.push({ 
      field: 'partner_params.seller_id', 
      message: 'Seller ID is required in partner parameters' 
    });
  }

  if (!partnerParams.account_type) {
    errors.push({ 
      field: 'partner_params.account_type', 
      message: 'Account type is required in partner parameters' 
    });
  } else if (!['business', 'individual'].includes(partnerParams.account_type)) {
    errors.push({ 
      field: 'partner_params.account_type', 
      message: 'Account type must be either "business" or "individual"' 
    });
  }
}

/**
 * Validate verification result data.
 *
 * This function ensures that the verification result contains
 * the necessary information for processing.
 *
 * @param {Object} verificationResult - The verification result to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateVerificationResult(verificationResult, errors) {
  // Check if we have at least one result code
  const resultCode = verificationResult.ResultCode || verificationResult.result_code;
  if (!resultCode) {
    errors.push({ 
      field: 'result_code', 
      message: 'Result code is required (ResultCode or result_code)' 
    });
  }

  // Check if we have at least one result text
  const resultText = verificationResult.ResultText || verificationResult.result_text;
  if (!resultText) {
    errors.push({ 
      field: 'result_text', 
      message: 'Result text is required (ResultText or result_text)' 
    });
  }

  // Check if we have images or completion status
  const hasImages = (verificationResult.Images && verificationResult.Images.length > 0) || 
                   (verificationResult.images && verificationResult.images.length > 0);
  const hasCompletionStatus = verificationResult.job_complete !== undefined || 
                             verificationResult.success !== undefined;

  if (!hasImages && !hasCompletionStatus) {
    errors.push({ 
      field: 'verification_data', 
      message: 'Verification result must include either: (1) Images array with at least one image, OR (2) job_complete: true/false, OR (3) success: true/false. Currently missing all three.' 
    });
  }
}

/**
 * Validate SmileID callback data.
 *
 * This function validates all required fields for processing SmileID
 * verification callbacks.
 *
 * Business Logic:
 * - Validates all required fields are present
 * - Ensures data types are correct
 * - Validates business rules for callback processing
 * - Collects all validation errors for comprehensive reporting
 *
 * Security Considerations:
 * - Prevents incomplete callback data processing
 * - Ensures data integrity and consistency
 * - Validates partner parameters for security
 * - Ensures proper verification result structure
 *
 * @param {Object} data - The callback data to validate
 * @throws {ValidationError} If validation fails with specific error details
 */
function validateSmileIdCallbackData(data) {
  // Step 1: Initialize error collection array
  // This will collect all validation errors for comprehensive reporting
  const errors = [];

  // Step 2: Check if data is provided
  if (!data) {
    errors.push({ field: 'data', message: 'Callback data is required' });
    throw new ValidationError(errors);
  }

  // Step 3: Validate required fields
  // This ensures all necessary information is provided for callback processing
  validateJobId(data.job_id, errors);
  validatePartnerParams(data.partner_params, errors);
  validateVerificationResult(data, errors);

  // Step 4: Throw ValidationError if any validation fails
  // This provides comprehensive error feedback to the caller
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateSmileIdCallbackData,
};
