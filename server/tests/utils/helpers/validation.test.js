const { containsXSSPatterns, validateXSS, containsOnlySafeCharacters, validateSafeCharacters } = require('@utils/validator');

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
}); 