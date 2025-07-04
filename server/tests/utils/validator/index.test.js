const { containsXSSPatterns, validateXSS, containsOnlySafeCharacters, validateSafeCharacters, isValidEmailFormat, validateEmailFormat } = require('@utils/validator');

describe('Validation Helper Functions', () => {
  describe('containsXSSPatterns', () => {
    it('should detect script tags', () => {
      expect(containsXSSPatterns('<script>alert("xss")</script>')).toBe(true);
      expect(containsXSSPatterns('<script src="malicious.js"></script>')).toBe(true);
    });

    it('should detect javascript: protocol', () => {
      expect(containsXSSPatterns('javascript:alert("xss")')).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(containsXSSPatterns('onclick="alert(\'xss\')"')).toBe(true);
      expect(containsXSSPatterns('onload="alert(\'xss\')"')).toBe(true);
    });

    it('should detect iframe tags', () => {
      expect(containsXSSPatterns('<iframe src="malicious.html"></iframe>')).toBe(true);
    });

    it('should not detect safe text', () => {
      expect(containsXSSPatterns('Hello World')).toBe(false);
      expect(containsXSSPatterns('John Doe')).toBe(false);
      expect(containsXSSPatterns('')).toBe(false);
      expect(containsXSSPatterns(null)).toBe(false);
      expect(containsXSSPatterns(undefined)).toBe(false);
    });
  });

  describe('validateXSS', () => {
    it('should return error object for XSS patterns', () => {
      const result = validateXSS('<script>alert("xss")</script>', 'firstName');
      expect(result).toEqual({
        field: 'firstName',
        message: 'Invalid characters detected in firstName'
      });
    });

    it('should return null for safe text', () => {
      const result = validateXSS('John Doe', 'firstName');
      expect(result).toBeNull();
    });

    it('should return null for empty/null values', () => {
      expect(validateXSS('', 'firstName')).toBeNull();
      expect(validateXSS(null, 'firstName')).toBeNull();
      expect(validateXSS(undefined, 'firstName')).toBeNull();
    });
  });

  describe('containsOnlySafeCharacters', () => {
    it('should allow alphanumeric characters', () => {
      expect(containsOnlySafeCharacters('Hello123')).toBe(true);
      expect(containsOnlySafeCharacters('John Doe')).toBe(true);
    });

    it('should allow common punctuation', () => {
      expect(containsOnlySafeCharacters("O'Connor")).toBe(true);
      expect(containsOnlySafeCharacters('Smith-Jones')).toBe(true);
      expect(containsOnlySafeCharacters('Hello, World!')).toBe(true);
    });

    it('should reject unsafe characters', () => {
      expect(containsOnlySafeCharacters('<script>')).toBe(false);
      expect(containsOnlySafeCharacters('alert("xss")')).toBe(false);
      expect(containsOnlySafeCharacters('javascript:')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(containsOnlySafeCharacters('')).toBe(true);
      expect(containsOnlySafeCharacters(null)).toBe(true);
      expect(containsOnlySafeCharacters(undefined)).toBe(true);
    });
  });

  describe('validateSafeCharacters', () => {
    it('should return error object for unsafe characters', () => {
      const result = validateSafeCharacters('<script>', 'firstName');
      expect(result).toEqual({
        field: 'firstName',
        message: 'Unsafe characters detected in firstName'
      });
    });

    it('should return null for safe text', () => {
      const result = validateSafeCharacters('John Doe', 'firstName');
      expect(result).toBeNull();
    });

    it('should return null for empty/null values', () => {
      expect(validateSafeCharacters('', 'firstName')).toBeNull();
      expect(validateSafeCharacters(null, 'firstName')).toBeNull();
      expect(validateSafeCharacters(undefined, 'firstName')).toBeNull();
    });
  });

  describe('isValidEmailFormat', () => {
    it('should accept valid email formats', () => {
      expect(isValidEmailFormat('user@example.com')).toBe(true);
      expect(isValidEmailFormat('user.name@example.com')).toBe(true);
      expect(isValidEmailFormat('user+tag@example.com')).toBe(true);
      expect(isValidEmailFormat('user@example.co.uk')).toBe(true);
      expect(isValidEmailFormat('user@subdomain.example.com')).toBe(true);
      expect(isValidEmailFormat('user123@example.com')).toBe(true);
      expect(isValidEmailFormat('user-name@example.com')).toBe(true);
      expect(isValidEmailFormat('user_name@example.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmailFormat('invalid-email')).toBe(false);
      expect(isValidEmailFormat('user@')).toBe(false);
      expect(isValidEmailFormat('@example.com')).toBe(false);
      expect(isValidEmailFormat('user@.com')).toBe(false);
      expect(isValidEmailFormat('user..name@example.com')).toBe(false);
      expect(isValidEmailFormat('user@example..com')).toBe(false);
      expect(isValidEmailFormat('user name@example.com')).toBe(false);
      expect(isValidEmailFormat('user@example com')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isValidEmailFormat('')).toBe(false);
      expect(isValidEmailFormat(null)).toBe(false);
      expect(isValidEmailFormat(undefined)).toBe(false);
      expect(isValidEmailFormat(123)).toBe(false);
    });
  });

  describe('validateEmailFormat', () => {
    it('should return error object for invalid email formats', () => {
      const result = validateEmailFormat('invalid-email', 'email');
      expect(result).toEqual({
        field: 'email',
        message: 'Invalid email format for email'
      });
    });

    it('should return null for valid email formats', () => {
      const result = validateEmailFormat('user@example.com', 'email');
      expect(result).toBeNull();
    });

    it('should return null for empty/null values', () => {
      expect(validateEmailFormat('', 'email')).toBeNull();
      expect(validateEmailFormat(null, 'email')).toBeNull();
      expect(validateEmailFormat(undefined, 'email')).toBeNull();
    });

    it('should use custom field name in error message', () => {
      const result = validateEmailFormat('invalid-email', 'contactEmail');
      expect(result).toEqual({
        field: 'contactEmail',
        message: 'Invalid email format for contactEmail'
      });
    });
  });
}); 