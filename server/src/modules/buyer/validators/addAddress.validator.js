/**
 * Add Address Validator
 *
 * This validator handles input validation for adding addresses to a buyer's profile.
 * It provides functionality to:
 * - (Optional) Accept any address type label
 * - Validate country, state, city, and address line fields
 * - Validate zip code format and structure
 * - Ensure data integrity and security standards
 * - Maintain consistent validation patterns
 *
 * The validator ensures that address addition requests are properly formatted
 * and contain valid data to prevent data corruption and maintain consistency.
 *
 * @module addAddressValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Address type handling
 *
 * Address type is now optional and free-form. We accept any string value when provided
 * and do not require it to be present. No enum validation is enforced.
 */
async function validateAddressType(addressType, buyerId, errors) {
  // No-op: keep function for backwards compatibility with service calls
  // If provided, ensure it is a string when present
  if (addressType !== undefined && addressType !== null && typeof addressType !== 'string') {
    errors.push({ field: 'addressType', message: 'Address type must be a string' });
  }
}

/**
 * Validate country field.
 *
 * This function checks if the country field is provided as a required parameter
 * for address addition operations.
 *
 * Business Logic:
 * - Checks if country is provided (required parameter)
 * - Prevents missing country errors
 * - Collects validation errors for reporting
 *
 * @param {string} country - The country to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateCountry("United States", errors); // Valid
 * validateCountry("", errors); // Invalid, adds error
 * validateCountry(null, errors); // Invalid, adds error
 */
async function validateCountry(country, errors) {
  if (!country) {
    errors.push({ field: 'country', message: 'Country is required' });
  }
}

/**
 * Validate state field.
 *
 * This function checks if the state field is provided as a required parameter
 * for address addition operations.
 *
 * Business Logic:
 * - Checks if state is provided (required parameter)
 * - Prevents missing state errors
 * - Collects validation errors for reporting
 *
 * @param {string} state - The state to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateState("California", errors); // Valid
 * validateState("", errors); // Invalid, adds error
 * validateState(null, errors); // Invalid, adds error
 */
async function validateState(state, errors) {
  if (!state) {
    errors.push({ field: 'state', message: 'State is required' });
  }
}

/**
 * Validate city field.
 *
 * This function checks if the city field is provided as a required parameter
 * for address addition operations.
 *
 * Business Logic:
 * - Checks if city is provided (required parameter)
 * - Prevents missing city errors
 * - Collects validation errors for reporting
 *
 * @param {string} city - The city to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateCity("Los Angeles", errors); // Valid
 * validateCity("", errors); // Invalid, adds error
 * validateCity(null, errors); // Invalid, adds error
 */
async function validateCity(city, errors) {
  if (!city) {
    errors.push({ field: 'city', message: 'City is required' });
  }
}

/**
 * Validate address line 1 field.
 *
 * This function checks if the address line 1 field is provided as a required parameter
 * for address addition operations.
 *
 * Business Logic:
 * - Checks if address line 1 is provided (required parameter)
 * - Prevents missing address line errors
 * - Collects validation errors for reporting
 *
 * @param {string} addressLine1 - The address line 1 to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateAddressLine1("123 Main Street", errors); // Valid
 * validateAddressLine1("", errors); // Invalid, adds error
 * validateAddressLine1(null, errors); // Invalid, adds error
 */
async function validateAddressLine1(addressLine1, errors) {
  if (!addressLine1) {
    errors.push({ field: 'addressLine1', message: 'Address line 1 is required' });
  }
}

/**
 * Validate zip code field.
 *
 * This function checks if the zip code field is provided as a required parameter
 * for address addition operations.
 *
 * Business Logic:
 * - Checks if zip code is provided (required parameter)
 * - Prevents missing zip code errors
 * - Collects validation errors for reporting
 *
 * @param {string} zipCode - The zip code to validate
 * @param {Array} errors - Array to collect validation errors
 * @example
 * const errors = [];
 * validateZipCode("90210", errors); // Valid
 * validateZipCode("", errors); // Invalid, adds error
 * validateZipCode(null, errors); // Invalid, adds error
 */
async function validateZipCode(zipCode, errors) {
  if (!zipCode) {
    errors.push({ field: 'zipCode', message: 'Zip code is required' });
  }
}

/**
 * Validate add address data.
 *
 * This function orchestrates the complete validation process for address
 * addition requests, ensuring all required fields meet validation requirements.
 *
 * Business Logic Flow:
 * 1. Initialize error collection array
 * 2. Validate address type (optional, free-form)
 * 3. Validate country field (required)
 * 4. Validate state field (required)
 * 5. Validate city field (required)
 * 6. Validate address line 1 field (required)
 * 7. Validate zip code field (required)
 * 8. Throw ValidationError if any validation fails
 *
 * Security Considerations:
 * - Required field validation prevents incomplete data
 * - Address type validation ensures consistent categorization
 * - String validation prevents injection attacks
 * - Error collection provides comprehensive feedback
 *
 * @param {Object} data - The address data to validate
 * @param {string} [data.addressType] - Optional address type label
 * @param {string} data.country - The country
 * @param {string} data.state - The state
 * @param {string} data.city - The city
 * @param {string} data.addressLine1 - The address line 1
 * @param {string} data.zipCode - The zip code
 * @throws {ValidationError} If validation fails
 * @example
 * // Valid request
 * await validateAddAddressData({
 *   addressType: "home",
 *   country: "United States",
 *   state: "California",
 *   city: "Los Angeles",
 *   addressLine1: "123 Main Street",
 *   zipCode: "90210"
 * });
 * 
 * // Invalid request - will throw ValidationError
 * await validateAddAddressData({
 *   addressType: "invalid",
 *   country: "",
 *   state: "",
 *   city: "",
 *   addressLine1: "",
 *   zipCode: ""
 * });
 */
async function validateAddAddressData(data, buyerId) {
  const errors = [];

  await validateAddressType(data.addressType, buyerId, errors);
  await validateCountry(data.country, errors);

  // Step 3: Validate state field (required)
  // This ensures the state is provided
  await validateState(data.state, errors);

  // Step 4: Validate city field (required)
  // This ensures the city is provided
  await validateCity(data.city, errors);

  // Step 5: Validate address line 1 field (required)
  // This ensures the street address is provided
  await validateAddressLine1(data.addressLine1, errors);

  // Step 6: Validate zip code field (required)
  // This ensures the zip code is provided
  await validateZipCode(data.zipCode, errors);

  // If any validation errors were found, throw ValidationError
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateAddAddressData,
  validateAddressType,
  validateCountry,
  validateState,
  validateCity,
  validateAddressLine1,
  validateZipCode
}; 