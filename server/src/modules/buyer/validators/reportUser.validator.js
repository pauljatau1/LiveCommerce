// External dependencies
const mongoose = require('mongoose');

// Internal dependencies - utilities and repositories
const ValidationError = require('../../../utils/errors/ValidationError');
const buyerRepository = require('../repositories/buyer.repository');

// Import models for user validation
const Seller = require('../../../models/Seller');

/**
 * Validates buyer ID format and returns any validation errors.
 * 
 * @param {string} buyerId - The buyer ID to validate
 * @returns {Array} Array of validation errors (empty if no errors)
 */
function validateBuyerIdFormat(buyerId) {
  const errors = [];
  
  if (!buyerId) {
    errors.push({ field: 'buyerId', message: 'Buyer ID is required' });
  } else if (!mongoose.Types.ObjectId.isValid(buyerId)) {
    errors.push({ field: 'buyerId', message: 'Invalid buyer ID format' });
  }
  
  return errors;
}

/**
 * Validates user ID format and returns any validation errors.
 * 
 * @param {string} userId - The user ID to validate
 * @returns {Array} Array of validation errors (empty if no errors)
 */
function validateUserIdFormat(userId) {
  const errors = [];
  
  if (!userId) {
    errors.push({ field: 'userId', message: 'User ID is required' });
  } else if (!mongoose.Types.ObjectId.isValid(userId)) {
    errors.push({ field: 'userId', message: 'Invalid user ID format' });
  }
  
  return errors;
}

/**
 * Finds a user by ID based on userType.
 * 
 * @param {string} userId - The user ID to find
 * @param {string} userType - The type of user ('buyer' or 'seller')
 * @returns {Promise<Object|null>} The found user or null
 */
async function findUserById(userId, userType) {
  if (userType === 'seller') {
    return await Seller.findById(userId);
  } else if (userType === 'buyer') {
    return await buyerRepository.findById(userId);
  }
  return null;
}

/**
 * Validates the buyer ID format and existence.
 * This function checks if the reporter (buyer) exists.
 * 
 * @param {string} buyerId - The buyer ID to validate
 * @param {Array} errors - Array to collect validation errors
 * @returns {Promise<Object|null>} The buyer object if validation passes, null if errors
 * @throws {ValidationError} If buyer ID is invalid or buyer doesn't exist
 */
async function validateBuyerId(buyerId, errors) {
  // Validate format first
  const formatErrors = validateBuyerIdFormat(buyerId);
  if (formatErrors.length > 0) {
    errors.push(...formatErrors);
    return null;
  }
  
  // Check if buyer exists
  const buyer = await buyerRepository.findById(buyerId);
  if (!buyer) {
    errors.push({ field: 'buyerId', message: 'Buyer not found' });
    return null;
  }
  
  return buyer;
}

/**
 * Validates the reported user ID format and existence.
 * This function checks if the reported user exists based on userType.
 * 
 * @param {string} userId - The reported user ID to validate
 * @param {string} userType - The type of user ('buyer' or 'seller')
 * @param {Array} errors - Array to collect validation errors
 * @returns {Promise<Object|null>} The reported user object if validation passes, null if errors
 */
async function validateReportedUser(userId, userType, errors) {
  // Validate format first
  const formatErrors = validateUserIdFormat(userId);
  if (formatErrors.length > 0) {
    errors.push(...formatErrors);
    return null;
  }
  
  // Find the reported user based on userType
  const reportedUser = await findUserById(userId, userType);
  if (!reportedUser) {
    errors.push({ field: 'userId', message: 'Reported user not found' });
    return null;
  }
  
  return reportedUser;
}

/**
 * Validates userType field and adds any validation errors to the errors array.
 * 
 * @param {string} userType - The user type to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateUserType(userType, errors) {
  if (!userType) {
    errors.push({ field: 'userType', message: 'User type is required' });
  } else if (typeof userType !== 'string') {
    errors.push({ field: 'userType', message: 'User type must be a string' });
  } else {
    const allowedTypes = ['buyer', 'seller'];
    if (!allowedTypes.includes(userType.toLowerCase())) {
      errors.push({ field: 'userType', message: 'User type must be either "buyer" or "seller"' });
    }
  }
}

/**
 * Validates reason field and adds any validation errors to the errors array.
 * 
 * @param {string} reason - The reason to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateReason(reason, errors) {
  if (!reason) {
    errors.push({ field: 'reason', message: 'Reason is required' });
  } else if (typeof reason !== 'string') {
    errors.push({ field: 'reason', message: 'Reason must be a string' });
  } else if (reason.trim().length < 3) {
    errors.push({ field: 'reason', message: 'Reason must be at least 3 characters long' });
  } else if (reason.trim().length > 100) {
    errors.push({ field: 'reason', message: 'Reason must not exceed 100 characters' });
  }
}

/**
 * Validates description field and adds any validation errors to the errors array.
 * 
 * @param {string} description - The description to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateDescription(description, errors) {
  if (!description) {
    errors.push({ field: 'description', message: 'Description is required' });
  } else if (typeof description !== 'string') {
    errors.push({ field: 'description', message: 'Description must be a string' });
  } else if (description.trim().length < 10) {
    errors.push({ field: 'description', message: 'Description must be at least 10 characters long' });
  } else if (description.trim().length > 500) {
    errors.push({ field: 'description', message: 'Description must not exceed 500 characters' });
  }
}

/**
 * Validates userId field and adds any validation errors to the errors array.
 * 
 * @param {string} userId - The user ID to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateUserId(userId, errors) {
  if (!userId) {
    errors.push({ field: 'userId', message: 'User ID is required' });
  } else if (typeof userId !== 'string') {
    errors.push({ field: 'userId', message: 'User ID must be a string' });
  } else if (!mongoose.Types.ObjectId.isValid(userId)) {
    errors.push({ field: 'userId', message: 'Invalid user ID format' });
  }
}

/**
 * Validates basic fields in the report data and adds any validation errors to the errors array.
 * 
 * @param {Object} reportData - The report data to validate
 * @param {Array} errors - Array to collect validation errors
 */
function validateBasicFields(reportData, errors) {
  validateUserId(reportData.userId, errors);
  validateUserType(reportData.userType, errors);
  validateReason(reportData.reason, errors);
  validateDescription(reportData.description, errors);
}

/**
 * Validates that a user is not reporting themselves and adds any validation errors to the errors array.
 * 
 * @param {string} reporterId - The ID of the user making the report
 * @param {string} reportedUserId - The ID of the user being reported
 * @param {string} userType - The type of user being reported
 * @param {Array} errors - Array to collect validation errors
 */
function validateSelfReport(reporterId, reportedUserId, userType, errors) {
  if (reporterId === reportedUserId) {
    errors.push({ 
      field: 'userId', 
      message: 'You cannot report yourself' 
    });
  }
}

/**
 * Validates the complete report user data.
 * This function orchestrates all validation steps for reporting a user.
 * 
 * @param {string} reporterId - The ID of the user making the report
 * @param {Object} reportData - The report data containing userId, userType, reason, description
 * @returns {Promise<Object>} Object containing validated reporter and reported user
 * @throws {ValidationError} If validation fails
 */
async function validateReportUserData(reporterId, reportData) {
  const errors = [];

  // Validate basic fields
  validateBasicFields(reportData, errors);
  
  // Validate self-report
  validateSelfReport(reporterId, reportData.userId, reportData.userType, errors);

  // If basic validation passes, validate existence
  if (errors.length === 0) {
    // Validate reporter (buyer) exists
    const reporter = await validateBuyerId(reporterId, errors);
    
    // Validate reported user exists
    let reportedUser = null;
    if (reporter) {
      reportedUser = await validateReportedUser(reportData.userId, reportData.userType, errors);
    }

    // If all validations pass, return the objects
    if (errors.length === 0) {
      return {
        reporter,
        reportedUser
      };
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

module.exports = {
  validateReportUserData
};