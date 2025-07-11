const { validateXSS } = require('../../../utils/validator');
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates a single field and adds error to the errors array if validation fails.
 * 
 * @param {Object} data - The data object containing the field
 * @param {string} fieldName - The name of the field to validate
 * @param {Function} validator - The validation function to call
 * @param {Array} errors - The errors array to add to
 */
function validateFieldIfProvided(data, fieldName, validator, errors) {
  if (data[fieldName] !== undefined) {
    const error = validator(data[fieldName]);
    if (error) errors.push(error);
  }
}

/**
 * Validates all fields in the profile update data.
 * 
 * @param {Object} data - Profile update data.
 * @returns {Array} Array of validation errors
 */
function validateAllFields(data) {
  const errors = [];
  
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

  fieldValidators.forEach(({ field, validator }) => {
    validateFieldIfProvided(data, field, validator, errors);
  });

  return errors;
}

/**
 * Validate profile update data.
 * 
 * @param {Object} data - Profile update data.
 * @throws {ValidationError} If validation fails.
 */
async function validateUpdateProfileData(data) {
  const errors = validateAllFields(data);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

/**
 * Validate the firstName field.
 * 
 * @param {string} firstName
 * @returns {Object|null} Error object or null
 */
function validateFirstName(firstName) {
  if (firstName === null || firstName === undefined) {
    return null; // Allow empty values for updates
  }

  // Check for XSS patterns
  const xssError = validateXSS(firstName, 'firstName');
  if (xssError) {
    return xssError;
  }

  // Check maximum length
  if (firstName.length > 100) {
    return { field: 'firstName', message: 'First name must not exceed 100 characters' };
  }

  return null;
}

/**
 * Validate the lastName field.
 * 
 * @param {string} lastName
 * @returns {Object|null} Error object or null
 */
function validateLastName(lastName) {
  if (lastName === null || lastName === undefined) {
    return null; // Allow empty values for updates
  }

  // Check for XSS patterns
  const xssError = validateXSS(lastName, 'lastName');
  if (xssError) {
    return xssError;
  }

  // Check maximum length
  if (lastName.length > 100) {
    return { field: 'lastName', message: 'Last name must not exceed 100 characters' };
  }

  return null;
}

/**
 * Validate the username field.
 * 
 * @param {string} username
 * @returns {Object|null} Error object or null
 */
function validateUsername(username) {
  if (username === null || username === undefined) {
    return null; // Allow empty values for updates
  }

  // Check if username contains spaces
  if (username.includes(' ')) {
    return { field: 'username', message: 'Username cannot contain spaces' };
  }

  // Check minimum length
  if (username.length < 3) {
    return { field: 'username', message: 'Username must be at least 3 characters long' };
  }

  // Check maximum length
  if (username.length > 30) {
    return { field: 'username', message: 'Username must not exceed 30 characters' };
  }

  return null;
}

/**
 * Validate the country field.
 * 
 * @param {string} country
 * @returns {Object|null} Error object or null
 */
function validateCountry(country) {
  if (country === null || country === undefined) {
    return null; // Allow empty values for updates
  }

  // Check for XSS patterns
  const xssError = validateXSS(country, 'country');
  if (xssError) {
    return xssError;
  }

  // Check maximum length
  if (country.length > 100) {
    return { field: 'country', message: 'Country must not exceed 100 characters' };
  }

  return null;
}

/**
 * Validate the phoneNumber field.
 * 
 * @param {string} phoneNumber
 * @returns {Object|null} Error object or null
 */
function validatePhoneNumber(phoneNumber) {
  if (phoneNumber === null || phoneNumber === undefined) {
    return null; // Allow empty values for updates
  }

  // Basic phone number validation (can be enhanced based on requirements)
  if (phoneNumber.length < 10 || phoneNumber.length > 15) {
    return { field: 'phoneNumber', message: 'Phone number must be between 10 and 15 characters' };
  }

  return null;
}

/**
 * Validate the bio field.
 * 
 * @param {string} bio
 * @returns {Object|null} Error object or null
 */
function validateBio(bio) {
  if (bio === null || bio === undefined) {
    return null; // Allow empty values for updates
  }

  // Check for XSS patterns
  const xssError = validateXSS(bio, 'bio');
  if (xssError) {
    return xssError;
  }

  // Check maximum length
  if (bio.length > 500) {
    return { field: 'bio', message: 'Bio must not exceed 500 characters' };
  }

  return null;
}

/**
 * Validate the preferredLanguage field.
 * 
 * @param {string} preferredLanguage
 * @returns {Object|null} Error object or null
 */
function validatePreferredLanguage(preferredLanguage) {
  if (preferredLanguage === null || preferredLanguage === undefined) {
    return null; // Allow empty values for updates
  }

  // Check for XSS patterns
  const xssError = validateXSS(preferredLanguage, 'preferredLanguage');
  if (xssError) {
    return xssError;
  }

  // Check maximum length
  if (preferredLanguage.length > 10) {
    return { field: 'preferredLanguage', message: 'Preferred language must not exceed 10 characters' };
  }

  return null;
}

/**
 * Validate the preferredCurrency field.
 * 
 * @param {string} preferredCurrency
 * @returns {Object|null} Error object or null
 */
function validatePreferredCurrency(preferredCurrency) {
  if (preferredCurrency === null || preferredCurrency === undefined) {
    return null; // Allow empty values for updates
  }

  // Check for XSS patterns
  const xssError = validateXSS(preferredCurrency, 'preferredCurrency');
  if (xssError) {
    return xssError;
  }

  // Check maximum length
  if (preferredCurrency.length > 3) {
    return { field: 'preferredCurrency', message: 'Preferred currency must not exceed 3 characters' };
  }

  return null;
}

module.exports = {
  validateUpdateProfileData,
  validateFieldIfProvided,
  validateAllFields,
}; 