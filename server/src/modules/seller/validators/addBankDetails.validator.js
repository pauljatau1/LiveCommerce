/**
 * Add Bank Details Validator
 *
 * This validator handles all validation logic for adding bank details to a seller account.
 * It ensures that all required bank detail fields are present and properly formatted
 * before processing the request.
 *
 * @module addBankDetailsValidator
 */

const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Validates bank country field.
 *
 * @param {string} bankCountry - The bank country value to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateBankCountry(bankCountry, errors) {
  if (!bankCountry) {
    errors.push({ field: 'bankCountry', message: 'Bank country is required' });
  } else if (typeof bankCountry !== 'string') {
    errors.push({ field: 'bankCountry', message: 'Bank country must be a string' });
  } else if (bankCountry.trim().length < 2) {
    errors.push({ field: 'bankCountry', message: 'Bank country must be at least 2 characters long' });
  } else if (bankCountry.trim().length > 100) {
    errors.push({ field: 'bankCountry', message: 'Bank country must not exceed 100 characters' });
  }
}

/**
 * Validates bank name field.
 *
 * @param {string} bankName - The bank name value to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateBankName(bankName, errors) {
  if (!bankName) {
    errors.push({ field: 'bankName', message: 'Bank name is required' });
  } else if (typeof bankName !== 'string') {
    errors.push({ field: 'bankName', message: 'Bank name must be a string' });
  } else if (bankName.trim().length < 2) {
    errors.push({ field: 'bankName', message: 'Bank name must be at least 2 characters long' });
  } else if (bankName.trim().length > 200) {
    errors.push({ field: 'bankName', message: 'Bank name must not exceed 200 characters' });
  }
}

/**
 * Validates bank account type field.
 *
 * @param {string} bankAccountType - The bank account type value to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateBankAccountType(bankAccountType, errors) {
  if (!bankAccountType) {
    errors.push({ field: 'bankAccountType', message: 'Bank account type is required' });
  } else if (typeof bankAccountType !== 'string') {
    errors.push({ field: 'bankAccountType', message: 'Bank account type must be a string' });
  } else if (bankAccountType.trim().length < 2) {
    errors.push({ field: 'bankAccountType', message: 'Bank account type must be at least 2 characters long' });
  } else if (bankAccountType.trim().length > 50) {
    errors.push({ field: 'bankAccountType', message: 'Bank account type must not exceed 50 characters' });
  }
}

/**
 * Validates account currency field.
 *
 * @param {string} accountCurrency - The account currency value to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateAccountCurrency(accountCurrency, errors) {
  if (!accountCurrency) {
    errors.push({ field: 'accountCurrency', message: 'Account currency is required' });
  } else if (typeof accountCurrency !== 'string') {
    errors.push({ field: 'accountCurrency', message: 'Account currency must be a string' });
  } else if (accountCurrency.trim().length !== 3) {
    errors.push({ field: 'accountCurrency', message: 'Account currency must be exactly 3 characters (e.g., USD, EUR, NGN)' });
  }
}

/**
 * Validates account number field.
 *
 * @param {string} accountNumber - The account number value to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateAccountNumber(accountNumber, errors) {
  if (!accountNumber) {
    errors.push({ field: 'accountNumber', message: 'Account number is required' });
  } else if (typeof accountNumber !== 'string') {
    errors.push({ field: 'accountNumber', message: 'Account number must be a string' });
  } else if (accountNumber.trim().length < 5) {
    errors.push({ field: 'accountNumber', message: 'Account number must be at least 5 characters long' });
  } else if (accountNumber.trim().length > 50) {
    errors.push({ field: 'accountNumber', message: 'Account number must not exceed 50 characters' });
  }
}

/**
 * Validates account name field.
 *
 * @param {string} accountName - The account name value to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateAccountName(accountName, errors) {
  if (!accountName) {
    errors.push({ field: 'accountName', message: 'Account name is required' });
  } else if (typeof accountName !== 'string') {
    errors.push({ field: 'accountName', message: 'Account name must be a string' });
  } else if (accountName.trim().length < 2) {
    errors.push({ field: 'accountName', message: 'Account name must be at least 2 characters long' });
  } else if (accountName.trim().length > 200) {
    errors.push({ field: 'accountName', message: 'Account name must not exceed 200 characters' });
  }
}

/**
 * Validates swift code field (optional).
 *
 * @param {string} swiftCode - The swift code value to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateSwiftCode(swiftCode, errors) {
  if (swiftCode && typeof swiftCode !== 'string') {
    errors.push({ field: 'swiftCode', message: 'Swift code must be a string' });
  } else if (swiftCode && swiftCode.trim().length > 20) {
    errors.push({ field: 'swiftCode', message: 'Swift code must not exceed 20 characters' });
  }
}

/**
 * Validates bank identifier code field (optional).
 *
 * @param {string} bankIdentifierCode - The bank identifier code value to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateBankIdentifierCode(bankIdentifierCode, errors) {
  if (bankIdentifierCode && typeof bankIdentifierCode !== 'string') {
    errors.push({ field: 'bankIdentifierCode', message: 'Bank identifier code must be a string' });
  } else if (bankIdentifierCode && bankIdentifierCode.trim().length > 50) {
    errors.push({ field: 'bankIdentifierCode', message: 'Bank identifier code must not exceed 50 characters' });
  }
}

/**
 * Validates the complete bank details object.
 *
 * This function performs comprehensive validation on all bank detail fields
 * to ensure data integrity and proper formatting before processing.
 *
 * @param {Object} bankDetails - The bank details object to validate
 * @returns {void}
 * @throws {ValidationError} If validation fails with detailed error messages
 */
function validateBankDetails(bankDetails) {
  const errors = [];

  // Validate required fields
  validateBankCountry(bankDetails.bankCountry, errors);
  validateBankName(bankDetails.bankName, errors);
  validateBankAccountType(bankDetails.bankAccountType, errors);
  validateAccountCurrency(bankDetails.accountCurrency, errors);
  validateAccountNumber(bankDetails.accountNumber, errors);
  validateAccountName(bankDetails.accountName, errors);

  // Validate optional fields
  validateSwiftCode(bankDetails.swiftCode, errors);
  validateBankIdentifierCode(bankDetails.bankIdentifierCode, errors);

  // If there are validation errors, throw ValidationError
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateBankDetails
};
