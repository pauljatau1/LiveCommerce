/**
 * Process SmileID Job Validator
 *
 * This validator handles input validation for SmileID job processing operations.
 * It provides functionality to:
 * - Validate required fields based on account type (individual vs business)
 * - Validate ID information for individual accounts
 * - Validate images for business accounts
 * - Ensure data integrity and security standards
 * - Maintain consistent validation patterns
 *
 * The validator ensures that SmileID job processing requests are properly formatted
 * and contain valid data to prevent security vulnerabilities and maintain
 * data integrity in the seller verification process.
 *
 * @module processSmileIdJobValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validate required ID information fields.
 *
 * This function validates the required fields for Enhanced KYC verification.
 *
 * @param {Object} idInfo - The ID information object to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateRequiredIdFields(idInfo, errors) {
  if (!idInfo.first_name) {
    errors.push({ 
      field: 'idInfo.first_name', 
      message: 'First name is required for Enhanced KYC verification' 
    });
  }

  if (!idInfo.last_name) {
    errors.push({ 
      field: 'idInfo.last_name', 
      message: 'Last name is required for Enhanced KYC verification' 
    });
  }

  if (!idInfo.id_number) {
    errors.push({ 
      field: 'idInfo.id_number', 
      message: 'ID number is required for Enhanced KYC verification' 
    });
  }
}

/**
 * Validate optional string field.
 *
 * This function validates that an optional field is a string if provided.
 *
 * @param {Object} idInfo - The ID information object to validate
 * @param {string} fieldName - The field name to validate
 * @param {string} displayName - The display name for error messages
 * @param {Array} errors - Array to collect validation errors
 */
function validateOptionalStringField(idInfo, fieldName, displayName, errors) {
  if (idInfo[fieldName] && typeof idInfo[fieldName] !== 'string') {
    errors.push({ 
      field: `idInfo.${fieldName}`, 
      message: `${displayName} must be a string` 
    });
  }
}

/**
 * Validate optional ID information fields.
 *
 * This function validates the optional fields for Enhanced KYC verification.
 *
 * @param {Object} idInfo - The ID information object to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateOptionalIdFields(idInfo, errors) {
  validateOptionalStringField(idInfo, 'country', 'Country', errors);
  validateOptionalStringField(idInfo, 'id_type', 'ID type', errors);
  validateOptionalStringField(idInfo, 'phone_number', 'Phone number', errors);
  validateOptionalStringField(idInfo, 'dob', 'Date of birth', errors);
}

/**
 * Validate ID information for individual account verification.
 *
 * This function validates the ID information field to ensure it meets
 * requirements for Enhanced KYC verification.
 *
 * Business Logic:
 * - Checks if ID info is provided (required for individual accounts)
 * - Validates required fields (first_name, last_name, id_number)
 * - Validates optional fields (country, id_type, phone_number, dob)
 * - Collects validation errors for reporting
 *
 * Security Considerations:
 * - Required field validation prevents incomplete verification attempts
 * - Field format validation ensures data consistency
 * - Error collection provides clear feedback
 *
 * @param {Object} idInfo - The ID information object to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateIdInfo(idInfo, errors) {
  // Step 1: Check if ID info is provided (required for individual accounts)
  // This ensures the ID information field is not empty or null
  if (!idInfo) {
    errors.push({ 
      field: 'idInfo', 
      message: 'ID information is required for individual account verification' 
    });
    return;
  }

  // Step 2: Validate required fields for Enhanced KYC
  // This ensures all necessary information is provided for verification
  validateRequiredIdFields(idInfo, errors);

  // Step 3: Validate optional fields if provided
  // This ensures optional fields meet format requirements
  validateOptionalIdFields(idInfo, errors);
}

/**
 * Validate images for business account verification.
 *
 * This function validates the images field to ensure it meets
 * requirements for business verification.
 *
 * Business Logic:
 * - Checks if images are provided (required for business accounts)
 * - Validates that images is an array
 * - Validates that images array is not empty
 * - Collects validation errors for reporting
 *
 * Security Considerations:
 * - Required field validation prevents incomplete verification attempts
 * - Array validation ensures proper data structure
 * - Error collection provides clear feedback
 *
 * @param {Array} images - The images array to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateImages(images, errors) {
  // Step 1: Check if images are provided (required for business accounts)
  // This ensures the images field is not empty or null
  if (!images) {
    errors.push({ 
      field: 'images', 
      message: 'Images are required for business account verification' 
    });
    return;
  }

  // Step 2: Validate that images is an array
  // This ensures the images field has the correct data type
  if (!Array.isArray(images)) {
    errors.push({ 
      field: 'images', 
      message: 'Images must be an array' 
    });
    return;
  }

  // Step 3: Validate that images array is not empty
  // This ensures at least one image is provided for verification
  if (images.length === 0) {
    errors.push({ 
      field: 'images', 
      message: 'At least one image is required for business verification' 
    });
  }
}

/**
 * Validate partner parameters.
 *
 * This function validates the partner parameters field to ensure it meets
 * requirements for SmileID job processing.
 *
 * Business Logic:
 * - Validates that partner_params is an object if provided
 * - Collects validation errors for reporting
 *
 * Security Considerations:
 * - Object validation ensures proper data structure
 * - Error collection provides clear feedback
 *
 * @param {Object} partnerParams - The partner parameters object to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validatePartnerParams(partnerParams, errors) {
  // Step 1: Validate that partner_params is an object if provided
  // This ensures the partner_params field has the correct data type
  if (partnerParams && typeof partnerParams !== 'object') {
    errors.push({ 
      field: 'partner_params', 
      message: 'Partner parameters must be an object' 
    });
  }
}

/**
 * Validate all SmileID job processing data.
 *
 * This function orchestrates the complete validation process for SmileID
 * job processing, ensuring all required fields meet validation requirements
 * based on the account type.
 *
 * Business Logic Flow:
 * 1. Initialize error collection array
 * 2. Validate partner parameters (optional)
 * 3. Validate account type specific fields
 * 4. Throw ValidationError if any validation fails
 *
 * Security Considerations:
 * - Comprehensive field validation prevents data corruption
 * - Account type specific validation ensures proper verification flow
 * - Error collection provides comprehensive feedback
 *
 * @param {Object} data - SmileID job processing data to validate
 * @param {string} data.accountType - The account type (individual or business)
 * @param {Object} [data.idInfo] - The ID information for individual accounts
 * @param {Array} [data.images] - The images array for business accounts
 * @param {Object} [data.partner_params] - The partner parameters object
 * @throws {ValidationError} If validation fails
 * @example
 * // Valid individual account job processing data
 * validateProcessSmileIdJobData({
 *   accountType: "individual",
 *   idInfo: {
 *     first_name: "John",
 *     last_name: "Doe",
 *     id_number: "12345678901"
 *   },
 *   partner_params: {}
 * });
 *
 * // Valid business account job processing data
 * validateProcessSmileIdJobData({
 *   accountType: "business",
 *   images: ["image1.jpg", "image2.jpg"],
 *   partner_params: {}
 * });
 *
 * // Invalid job processing data - will throw ValidationError
 * validateProcessSmileIdJobData({
 *   accountType: "individual",
 *   idInfo: {
 *     first_name: "John"
 *     // Missing last_name and id_number
 *   }
 * });
 */
function validateProcessSmileIdJobData(data, accountType) {
  // Step 1: Initialize error collection array
  // This will collect all validation errors for comprehensive reporting
  const errors = [];

  // Step 2: Validate partner parameters (optional)
  // This ensures partner parameters meet format requirements if provided
  validatePartnerParams(data.partner_params, errors);

  // Step 3: Validate account type specific fields
  // This ensures the correct fields are provided based on account type
  if (accountType === 'individual') {
    // For individual accounts, validate ID information
    validateIdInfo(data.idInfo, errors);
  } else if (accountType === 'business') {
    // For business accounts, validate images
    validateImages(data.images, errors);
  }

  // Step 4: Throw ValidationError if any validation fails
  // This provides comprehensive error feedback to the caller
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateProcessSmileIdJobData,
};
