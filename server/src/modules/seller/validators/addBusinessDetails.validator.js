/**
 * Add Business Details Validator
 *
 * This validator handles input validation for adding business details to seller profiles.
 * It ensures that all required fields are present and valid before processing the request.
 *
 * Business Logic:
 * - Validates required fields (businessName, businessType, taxInformation)
 * - Ensures data types are correct and values are not empty
 * - Validates business information structure and content
 * - Ensures data integrity and consistency
 *
 * Security Considerations:
 * - Required field validation prevents incomplete business details
 * - Type validation ensures data consistency
 * - Content validation prevents invalid business information
 * - Data sanitization ensures clean input processing
 *
 * @module addBusinessDetailsValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validate business name field.
 *
 * This function ensures that the business name is present and valid
 * for business details processing.
 *
 * @param {string} businessName - The business name to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateBusinessName(businessName, errors) {
  if (!businessName) {
    errors.push({ 
      field: 'businessName', 
      message: 'Business name is required' 
    });
    return;
  }

  if (typeof businessName !== 'string') {
    errors.push({ 
      field: 'businessName', 
      message: 'Business name must be a string' 
    });
    return;
  }

  if (businessName.trim().length === 0) {
    errors.push({ 
      field: 'businessName', 
      message: 'Business name cannot be empty' 
    });
  }

  if (businessName.length > 200) {
    errors.push({ 
      field: 'businessName', 
      message: 'Business name must not exceed 200 characters' 
    });
  }
}

/**
 * Validate business type field.
 *
 * This function ensures that the business type is present and valid
 * for business details processing.
 *
 * @param {string} businessType - The business type to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateBusinessType(businessType, errors) {
  if (!businessType) {
    errors.push({ 
      field: 'businessType', 
      message: 'Business type is required' 
    });
    return;
  }

  if (typeof businessType !== 'string') {
    errors.push({ 
      field: 'businessType', 
      message: 'Business type must be a string' 
    });
    return;
  }

  if (businessType.trim().length === 0) {
    errors.push({ 
      field: 'businessType', 
      message: 'Business type cannot be empty' 
    });
  }

  if (businessType.length > 100) {
    errors.push({ 
      field: 'businessType', 
      message: 'Business type must not exceed 100 characters' 
    });
  }
}

/**
 * Validate tax information field.
 *
 * This function ensures that the tax information is present and valid
 * for business details processing.
 *
 * @param {string} taxInformation - The tax information to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateTaxInformation(taxInformation, errors) {
  if (!taxInformation) {
    errors.push({ 
      field: 'taxInformation', 
      message: 'Tax information is required' 
    });
    return;
  }

  if (typeof taxInformation !== 'string') {
    errors.push({ 
      field: 'taxInformation', 
      message: 'Tax information must be a string' 
    });
    return;
  }

  if (taxInformation.trim().length === 0) {
    errors.push({ 
      field: 'taxInformation', 
      message: 'Tax information cannot be empty' 
    });
  }

  if (taxInformation.length > 500) {
    errors.push({ 
      field: 'taxInformation', 
      message: 'Tax information must not exceed 500 characters' 
    });
  }
}

/**
 * Validate add business details data.
 *
 * This function validates all required fields for adding business details
 * to seller profiles.
 *
 * Business Logic:
 * - Validates all required fields are present and valid
 * - Ensures data types are correct and values are not empty
 * - Validates business information structure and content
 * - Collects all validation errors for comprehensive reporting
 *
 * Security Considerations:
 * - Prevents incomplete business details processing
 * - Ensures data integrity and consistency
 * - Validates business information content
 * - Ensures proper data sanitization
 *
 * @param {Object} data - The business details data to validate
 * @throws {ValidationError} If validation fails with specific error details
 */
function validateAddBusinessDetailsData(data) {
  // Step 1: Initialize error collection array
  // This will collect all validation errors for comprehensive reporting
  const errors = [];

  // Step 2: Check if data is provided
  if (!data) {
    errors.push({ field: 'data', message: 'Business details data is required' });
    throw new ValidationError(errors);
  }

  // Step 3: Validate required fields
  // This ensures all necessary information is provided for business details processing
  validateBusinessName(data.businessName, errors);
  validateBusinessType(data.businessType, errors);
  validateTaxInformation(data.taxInformation, errors);

  // Step 4: Throw ValidationError if any validation fails
  // This provides comprehensive error feedback to the caller
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateAddBusinessDetailsData,
};
