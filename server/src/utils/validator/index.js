/**
 * Validation helper functions for shared use across modules
 */

/**
 * Check if a string contains potential XSS patterns
 * @param {string} value - The string to check
 * @returns {boolean} - True if XSS patterns are detected
 */
function containsXSSPatterns(value) {
  if (!value || typeof value !== 'string') return false;
  
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
    /<input\b[^<]*>/gi,
    /<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi,
    /<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi,
    /<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi,
    /<link\b[^<]*>/gi,
    /<meta\b[^<]*>/gi,
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    /<title\b[^<]*(?:(?!<\/title>)<[^<]*)*<\/title>/gi,
    /<base\b[^<]*>/gi,
    /<bgsound\b[^<]*>/gi,
    /<xmp\b[^<]*(?:(?!<\/xmp>)<[^<]*)*<\/xmp>/gi,
    /<plaintext\b[^<]*(?:(?!<\/plaintext>)<[^<]*)*<\/plaintext>/gi,
    /<listing\b[^<]*(?:(?!<\/listing>)<[^<]*)*<\/listing>/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(value));
}

/**
 * Validate a field for XSS patterns and return error if found
 * @param {string} value - The value to validate
 * @param {string} fieldName - The name of the field being validated
 * @returns {Object|null} - Error object if XSS detected, null otherwise
 */
function validateXSS(value, fieldName) {
  if (value && containsXSSPatterns(value)) {
    return {
      field: fieldName,
      message: `Invalid characters detected in ${fieldName}`
    };
  }
  return null;
}

/**
 * Check if a string contains only alphanumeric characters and common punctuation
 * @param {string} value - The string to check
 * @returns {boolean} - True if string contains only safe characters
 */
function containsOnlySafeCharacters(value) {
  if (!value || typeof value !== 'string') return true;
  
  // Allow alphanumeric, spaces, hyphens, apostrophes, and common punctuation
  const safePattern = /^[a-zA-Z0-9\s\-'.,!?()]+$/;
  return safePattern.test(value);
}

/**
 * Validate a field for safe characters and return error if found
 * @param {string} value - The value to validate
 * @param {string} fieldName - The name of the field being validated
 * @returns {Object|null} - Error object if unsafe characters detected, null otherwise
 */
function validateSafeCharacters(value, fieldName) {
  if (value && !containsOnlySafeCharacters(value)) {
    return {
      field: fieldName,
      message: `Unsafe characters detected in ${fieldName}`
    };
  }
  return null;
}

/**
 * Validate email format using a comprehensive regex pattern
 * @param {string} email - The email to validate
 * @returns {boolean} - True if email format is valid
 */
function isValidEmailFormat(email) {
  if (!email || typeof email !== 'string') return false;
  
  // More comprehensive email regex pattern that handles edge cases
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  // Additional checks for common invalid patterns
  if (emailRegex.test(email)) {
    // Check for consecutive dots in local part
    const localPart = email.split('@')[0];
    if (localPart.includes('..')) {
      return false;
    }
    
    // Check for consecutive dots in domain part
    const domainPart = email.split('@')[1];
    if (domainPart.includes('..')) {
      return false;
    }
    
    // Check for dots at start or end of local part
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return false;
    }
    
    // Check for dots at start or end of domain part
    if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
      return false;
    }
    
    return true;
  }
  
  return false;
}

/**
 * Validate email format and return error if invalid
 * @param {string} email - The email to validate
 * @param {string} fieldName - The name of the field being validated
 * @returns {Object|null} - Error object if email format is invalid, null otherwise
 */
function validateEmailFormat(email, fieldName = 'email') {
  if (email && !isValidEmailFormat(email)) {
    return {
      field: fieldName,
      message: `Invalid email format for ${fieldName}`
    };
  }
  return null;
}

module.exports = {
  containsXSSPatterns,
  validateXSS,
  containsOnlySafeCharacters,
  validateSafeCharacters,
  isValidEmailFormat,
  validateEmailFormat
}; 