const { validateBuyerId, validateGetActivityStatusData } = require('@modules/buyer/validators/getActivityStatus.validator');

describe('getActivityStatus.validator', () => {
  describe('validateBuyerId', () => {
    it('should return no errors for valid buyer ID', () => {
      // Arrange
      const validBuyerId = '507f1f77bcf86cd799439011';

      // Act
      const result = validateBuyerId(validBuyerId);

      // Assert
      expect(result.errors).toEqual([]);
    });

    it('should return error for missing buyer ID', () => {
      // Arrange
      const missingBuyerId = null;

      // Act
      const result = validateBuyerId(missingBuyerId);

      // Assert
      expect(result.errors).toContain('Buyer ID is required');
    });

    it('should return error for undefined buyer ID', () => {
      // Arrange
      const undefinedBuyerId = undefined;

      // Act
      const result = validateBuyerId(undefinedBuyerId);

      // Assert
      expect(result.errors).toContain('Buyer ID is required');
    });

    it('should return error for empty string buyer ID', () => {
      // Arrange
      const emptyBuyerId = '';

      // Act
      const result = validateBuyerId(emptyBuyerId);

      // Assert
      expect(result.errors).toContain('Buyer ID cannot be empty');
    });

    it('should return error for non-string buyer ID', () => {
      // Arrange
      const nonStringBuyerId = 123;

      // Act
      const result = validateBuyerId(nonStringBuyerId);

      // Assert
      expect(result.errors).toContain('Buyer ID must be a string');
    });

    it('should return error for invalid ObjectId format', () => {
      // Arrange
      const invalidBuyerId = 'invalid-id';

      // Act
      const result = validateBuyerId(invalidBuyerId);

      // Assert
      expect(result.errors).toContain('Buyer ID must be a valid ObjectId');
    });
  });

  describe('validateGetActivityStatusData', () => {
    it('should return no errors for valid data', () => {
      // Arrange
      const validData = {
        buyerId: '507f1f77bcf86cd799439011'
      };

      // Act
      const result = validateGetActivityStatusData(validData);

      // Assert
      expect(result.errors).toEqual([]);
    });

    it('should return error for missing buyerId', () => {
      // Arrange
      const invalidData = {};

      // Act
      const result = validateGetActivityStatusData(invalidData);

      // Assert
      expect(result.errors).toContain('Buyer ID is required');
    });

    it('should return error for null buyerId', () => {
      // Arrange
      const invalidData = {
        buyerId: null
      };

      // Act
      const result = validateGetActivityStatusData(invalidData);

      // Assert
      expect(result.errors).toContain('Buyer ID is required');
    });

    it('should return error for undefined buyerId', () => {
      // Arrange
      const invalidData = {
        buyerId: undefined
      };

      // Act
      const result = validateGetActivityStatusData(invalidData);

      // Assert
      expect(result.errors).toContain('Buyer ID is required');
    });

    it('should return error for empty string buyerId', () => {
      // Arrange
      const invalidData = {
        buyerId: ''
      };

      // Act
      const result = validateGetActivityStatusData(invalidData);

      // Assert
      expect(result.errors).toContain('Buyer ID cannot be empty');
    });

    it('should return error for non-string buyerId', () => {
      // Arrange
      const invalidData = {
        buyerId: 123
      };

      // Act
      const result = validateGetActivityStatusData(invalidData);

      // Assert
      expect(result.errors).toContain('Buyer ID must be a string');
    });

    it('should return error for invalid ObjectId format', () => {
      // Arrange
      const invalidData = {
        buyerId: 'invalid-id'
      };

      // Act
      const result = validateGetActivityStatusData(invalidData);

      // Assert
      expect(result.errors).toContain('Buyer ID must be a valid ObjectId');
    });
  });
});
