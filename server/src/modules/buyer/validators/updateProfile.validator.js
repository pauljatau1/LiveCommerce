/**
 * Update Profile Validator
 *
 * This validator handles input validation for buyer profile updates.
 * It provides comprehensive validation for all profile fields including:
 * - XSS (Cross-Site Scripting) protection
 * - Length constraints
 * - Format validation
 * - Security checks
 *
 * The validator ensures that:
 * - All provided fields are properly validated
 * - Empty/null values are allowed for partial updates
 * - XSS attacks are prevented
 * - Data integrity is maintained
 *
 * @module updateProfileValidator
 */

const { validateXSS } = require('../../../utils/validator');
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates a single field and adds error to the errors array if validation fails.
 * 
 * This helper function provides a consistent way to validate optional fields
 * in profile updates. It only validates fields that are explicitly provided
 * (not undefined), allowing for partial updates where only some fields are changed.
 *
 * @param {Object} data - The data object containing the field to validate
 * @param {string} fieldName - The name of the field to validate
 * @param {Function} validator - The validation function to call for this field
 * @param {Array} errors - The errors array to add validation errors to
 */
function validateFieldIfProvided(data, fieldName, validator, errors) {
  // Only validate if the field is explicitly provided (not undefined)
  // This allows for partial updates where only some fields are changed
  if (data[fieldName] !== undefined) {
    validator(data[fieldName], errors);
  }
}

/**
 * Validates all fields in the profile update data.
 * 
 * This function orchestrates the validation of all possible profile fields.
 * It uses a configuration array to define field-validator mappings and
 * processes each field that is provided in the update data.
 *
 * Validation Strategy:
 * - Only validates fields that are explicitly provided
 * - Uses specific validators for each field type
 * - Collects all errors before throwing ValidationError
 * - Allows partial updates (not all fields required)
 *
 * @param {Object} data - Profile update data object
 * @param {Array} errors - Array to collect validation errors
 */
function validateAllFields(data, errors) {
  // Define field-validator mappings for consistent validation
  const fieldValidators = [
    { field: 'firstName', validator: validateFirstName },
    { field: 'lastName', validator: validateLastName },
    { field: 'username', validator: validateUsername },
    { field: 'country', validator: validateCountry },
    { field: 'phoneNumber', validator: validatePhoneNumber },
    { field: 'bio', validator: validateBio },
    { field: 'preferredLanguage', validator: validatePreferredLanguage },
    { field: 'preferredCurrency', validator: validatePreferredCurrency }
  ];

  // Validate each field that is provided in the data
  fieldValidators.forEach(({ field, validator }) => {
    validateFieldIfProvided(data, field, validator, errors);
  });
}

/**
 * Validate profile update data.
 * 
 * This is the main validation function that orchestrates the complete
 * validation process for profile updates. It validates all provided fields
 * and throws a ValidationError if any validation fails.
 *
 * Validation Process:
 * 1. Initialize empty errors array
 * 2. Validate all provided fields using field-specific validators
 * 3. Check if any validation errors occurred
 * 4. Throw ValidationError with all collected errors if any exist
 *
 * @param {Object} data - Profile update data object
 * @throws {ValidationError} If any validation fails (contains all validation errors)
 *
 * @example
 * // Valid profile update
 * await validateUpdateProfileData({
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   bio: 'Software developer'
 * });
 *
 * @example
 * // Invalid profile update
 * try {
 *   await validateUpdateProfileData({
 *     firstName: '<script>alert("xss")</script>',
 *     username: 'a' // too short
 *   });
 * } catch (error) {
 *   // error instanceof ValidationError
 *   // error.errors contains array of validation errors
 * }
 */
async function validateUpdateProfileData(data) {
  const errors = [];
  
  // Validate all provided fields
  validateAllFields(data, errors);

  // If any validation errors occurred, throw ValidationError
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

/**
 * Validate the firstName field.
 * 
 * This function validates the first name field with the following checks:
 * - Allows null/undefined values for partial updates
 * - Checks for XSS (Cross-Site Scripting) patterns
 * - Validates maximum length constraint
 *
 * Security Features:
 * - XSS protection using validateXSS utility
 * - Length limits to prevent buffer overflow attacks
 *
 * @param {string} firstName - The first name to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateFirstName(firstName, errors) {
  // Allow empty values for partial updates (null/undefined are valid)
  if (firstName === null || firstName === undefined) {
    return;
  }

  // Check for XSS patterns to prevent script injection attacks
  const xssError = validateXSS(firstName, 'firstName');
  if (xssError) {
    errors.push(xssError);
  }

  // Check maximum length to prevent buffer overflow and ensure data integrity
  if (firstName.length > 100) {
    errors.push({ field: 'firstName', message: 'First name must not exceed 100 characters' });
  }
}

/**
 * Validate the lastName field.
 * 
 * This function validates the last name field with the same security checks
 * as firstName. It ensures data integrity and prevents security vulnerabilities.
 *
 * @param {string} lastName - The last name to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateLastName(lastName, errors) {
  // Allow empty values for partial updates
  if (lastName === null || lastName === undefined) {
    return;
  }

  // Check for XSS patterns
  const xssError = validateXSS(lastName, 'lastName');
  if (xssError) {
    errors.push(xssError);
  }

  // Check maximum length
  if (lastName.length > 100) {
    errors.push({ field: 'lastName', message: 'Last name must not exceed 100 characters' });
  }
}

/**
 * Validate the username field.
 * 
 * This function validates the username field with specific requirements:
 * - No spaces allowed (usernames should be single words)
 * - Minimum and maximum length constraints
 * - No XSS check needed (username is typically not displayed as HTML)
 *
 * Username Requirements:
 * - Must be 3-30 characters long
 * - Cannot contain spaces
 * - Should be URL-safe and user-friendly
 *
 * @param {string} username - The username to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateUsername(username, errors) {
  // Allow empty values for partial updates
  if (username === null || username === undefined) {
    return;
  }

  // Check if username contains spaces (usernames should be single words)
  if (username.includes(' ')) {
    errors.push({ field: 'username', message: 'Username cannot contain spaces' });
  }

  // Check minimum length for meaningful usernames
  if (username.length < 3) {
    errors.push({ field: 'username', message: 'Username must be at least 3 characters long' });
  }

  // Check maximum length for database and UI constraints
  if (username.length > 30) {
    errors.push({ field: 'username', message: 'Username must not exceed 30 characters' });
  }
}

/**
 * Validate the country field.
 * 
 * This function validates the country field with security and length checks.
 * Country names should be properly sanitized to prevent XSS attacks.
 *
 * @param {string} country - The country to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateCountry(country, errors) {
  // Allow empty values for partial updates
  if (country === null || country === undefined) {
    return;
  }

  // Check for XSS patterns in country name
  const xssError = validateXSS(country, 'country');
  if (xssError) {
    errors.push(xssError);
  }

  // Check maximum length for country names
  if (country.length > 100) {
    errors.push({ field: 'country', message: 'Country must not exceed 100 characters' });
  }
}

/**
 * Validate the phoneNumber field.
 * 
 * This function validates phone numbers with basic format checking.
 * The validation is intentionally lenient to accommodate international
 * phone number formats and various country-specific patterns.
 *
 * Phone Number Requirements:
 * - Must be 10-15 characters long (accommodates international formats)
 * - Basic length validation (can be enhanced with regex patterns)
 *
 * @param {string} phoneNumber - The phone number to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validatePhoneNumber(phoneNumber, errors) {
  // Allow empty values for partial updates
  if (phoneNumber === null || phoneNumber === undefined) {
    return;
  }

  // Basic phone number validation (can be enhanced based on requirements)
  // Length range accommodates international phone number formats
  if (phoneNumber.length < 10 || phoneNumber.length > 15) {
    errors.push({ field: 'phoneNumber', message: 'Phone number must be between 10 and 15 characters' });
  }
}

/**
 * Validate the bio field.
 * 
 * This function validates the bio field with security and length checks.
 * Bio fields are often displayed as HTML, so XSS protection is critical.
 *
 * Bio Requirements:
 * - Maximum 500 characters (reasonable for user bios)
 * - XSS protection for safe HTML display
 * - Allows empty values for partial updates
 *
 * @param {string} bio - The bio to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateBio(bio, errors) {
  // Allow empty values for partial updates
  if (bio === null || bio === undefined) {
    return;
  }

  // Check for XSS patterns (critical for bio fields displayed as HTML)
  const xssError = validateXSS(bio, 'bio');
  if (xssError) {
    errors.push(xssError);
  }

  // Check maximum length for reasonable bio size
  if (bio.length > 500) {
    errors.push({ field: 'bio', message: 'Bio must not exceed 500 characters' });
  }
}

/**
 * Validate the preferredLanguage field.
 * 
 * This function validates language codes with security and length checks.
 * Language codes are typically short (e.g., 'en', 'es', 'fr').
 *
 * @param {string} preferredLanguage - The preferred language to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validatePreferredLanguage(preferredLanguage, errors) {
  // Allow empty values for partial updates
  if (preferredLanguage === null || preferredLanguage === undefined) {
    return;
  }

  // Check for XSS patterns
  const xssError = validateXSS(preferredLanguage, 'preferredLanguage');
  if (xssError) {
    errors.push(xssError);
  }

  // Check maximum length for language codes (typically 2-3 characters)
  if (preferredLanguage.length > 10) {
    errors.push({ field: 'preferredLanguage', message: 'Preferred language must not exceed 10 characters' });
  }
}

/**
 * Validate the preferredCurrency field.
 * 
 * This function validates currency codes with security and length checks.
 * Currency codes are typically 3 characters (e.g., 'USD', 'EUR', 'GBP').
 *
 * @param {string} preferredCurrency - The preferred currency to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validatePreferredCurrency(preferredCurrency, errors) {
  // Allow empty values for partial updates
  if (preferredCurrency === null || preferredCurrency === undefined) {
    return;
  }

  // Check for XSS patterns
  const xssError = validateXSS(preferredCurrency, 'preferredCurrency');
  if (xssError) {
    errors.push(xssError);
  }

  // Check maximum length for currency codes (typically 3 characters)
  if (preferredCurrency.length > 3) {
    errors.push({ field: 'preferredCurrency', message: 'Preferred currency must not exceed 3 characters' });
  }
}

module.exports = {
  validateUpdateProfileData
}; 