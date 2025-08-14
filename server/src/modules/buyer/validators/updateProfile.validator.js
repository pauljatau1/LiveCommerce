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
    validator(data[fieldName], errors);
  }
}

/**
 * Validates all fields in the profile update data.
 * 
 * @param {Object} data - Profile update data.
 * @param {Array} errors - Array to collect validation errors
 */
function validateAllFields(data, errors) {
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
}

/**
 * Validate profile update data.
 * 
 * @param {Object} data - Profile update data.
 * @throws {ValidationError} If validation fails.
 */
async function validateUpdateProfileData(data) {
  const errors = [];
  validateAllFields(data, errors);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

/**
 * Validate the firstName field.
 * 
 * @param {string} firstName - The first name to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateFirstName(firstName, errors) {
  if (firstName === null || firstName === undefined) {
    return; // Allow empty values for updates
  }

  // Check for XSS patterns
  const xssError = validateXSS(firstName, 'firstName');
  if (xssError) {
    errors.push(xssError);
  }

  // Check maximum length
  if (firstName.length > 100) {
    errors.push({ field: 'firstName', message: 'First name must not exceed 100 characters' });
  }
}

/**
 * Validate the lastName field.
 * 
 * @param {string} lastName - The last name to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateLastName(lastName, errors) {
  if (lastName === null || lastName === undefined) {
    return; // Allow empty values for updates
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
 * @param {string} username - The username to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateUsername(username, errors) {
  if (username === null || username === undefined) {
    return; // Allow empty values for updates
  }

  // Check if username contains spaces
  if (username.includes(' ')) {
    errors.push({ field: 'username', message: 'Username cannot contain spaces' });
  }

  // Check minimum length
  if (username.length < 3) {
    errors.push({ field: 'username', message: 'Username must be at least 3 characters long' });
  }

  // Check maximum length
  if (username.length > 30) {
    errors.push({ field: 'username', message: 'Username must not exceed 30 characters' });
  }
}

/**
 * Validate the country field.
 * 
 * @param {string} country - The country to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateCountry(country, errors) {
  if (country === null || country === undefined) {
    return; // Allow empty values for updates
  }

  // Check for XSS patterns
  const xssError = validateXSS(country, 'country');
  if (xssError) {
    errors.push(xssError);
  }

  // Check maximum length
  if (country.length > 100) {
    errors.push({ field: 'country', message: 'Country must not exceed 100 characters' });
  }
}

/**
 * Validate the phoneNumber field.
 * 
 * @param {string} phoneNumber - The phone number to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validatePhoneNumber(phoneNumber, errors) {
  if (phoneNumber === null || phoneNumber === undefined) {
    return; // Allow empty values for updates
  }

  // Basic phone number validation (can be enhanced based on requirements)
  if (phoneNumber.length < 10 || phoneNumber.length > 15) {
    errors.push({ field: 'phoneNumber', message: 'Phone number must be between 10 and 15 characters' });
  }
}

/**
 * Validate the bio field.
 * 
 * @param {string} bio - The bio to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateBio(bio, errors) {
  if (bio === null || bio === undefined) {
    return; // Allow empty values for updates
  }

  // Check for XSS patterns
  const xssError = validateXSS(bio, 'bio');
  if (xssError) {
    errors.push(xssError);
  }

  // Check maximum length
  if (bio.length > 500) {
    errors.push({ field: 'bio', message: 'Bio must not exceed 500 characters' });
  }
}

/**
 * Validate the preferredLanguage field.
 * 
 * @param {string} preferredLanguage - The preferred language to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validatePreferredLanguage(preferredLanguage, errors) {
  if (preferredLanguage === null || preferredLanguage === undefined) {
    return; // Allow empty values for updates
  }

  // Check for XSS patterns
  const xssError = validateXSS(preferredLanguage, 'preferredLanguage');
  if (xssError) {
    errors.push(xssError);
  }

  // Check maximum length
  if (preferredLanguage.length > 10) {
    errors.push({ field: 'preferredLanguage', message: 'Preferred language must not exceed 10 characters' });
  }
}

/**
 * Validate the preferredCurrency field.
 * 
 * @param {string} preferredCurrency - The preferred currency to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validatePreferredCurrency(preferredCurrency, errors) {
  if (preferredCurrency === null || preferredCurrency === undefined) {
    return; // Allow empty values for updates
  }

  // Check for XSS patterns
  const xssError = validateXSS(preferredCurrency, 'preferredCurrency');
  if (xssError) {
    errors.push(xssError);
  }

  // Check maximum length
  if (preferredCurrency.length > 3) {
    errors.push({ field: 'preferredCurrency', message: 'Preferred currency must not exceed 3 characters' });
  }
}

module.exports = {
  validateUpdateProfileData
}; 