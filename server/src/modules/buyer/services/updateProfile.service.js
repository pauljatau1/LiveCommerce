const buyerRepository = require('../repositories/buyer.repository');
const { validateUpdateProfileData } = require('../validators/updateProfile.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Adds a field to the update object if it's provided.
 *
 * @param {Object} updateObject - The update object to modify
 * @param {Object} updateData - The profile data to update
 * @param {string} fieldName - The field name to check
 */
function addFieldIfProvided(updateObject, updateData, fieldName) {
  if (updateData[fieldName] !== undefined) {
    updateObject[fieldName] = updateData[fieldName];
  }
}

/**
 * Handles notification preferences merge.
 *
 * @param {Object} updateObject - The update object to modify
 * @param {Object} updateData - The profile data to update
 * @param {Object} buyer - The current buyer data
 */
function handleNotificationPreferences(updateObject, updateData, buyer) {
  if (updateData.notificationPreferences) {
    updateObject.notificationPreferences = {
      ...buyer.notificationPreferences,
      ...updateData.notificationPreferences
    };
  }
}

/**
 * Validates username uniqueness if it's being changed.
 *
 * @param {Object} updateData - The profile data to update
 * @param {Object} buyer - The current buyer data
 * @throws {ValidationError} If username is already taken
 */
async function validateUsernameUniqueness(updateData, buyer) {
  if (updateData.username && updateData.username !== buyer.username) {
    const existingUsername = await buyerRepository.findByUsername(updateData.username);
    if (existingUsername) {
      throw new ValidationError([{ field: 'username', message: 'Username already taken' }]);
    }
  }
}

/**
 * Creates the response object from the updated buyer data.
 *
 * @param {Object} updatedBuyer - The updated buyer data
 * @returns {Object} The formatted response object
 */
function createResponseObject(updatedBuyer) {
  return {
    firstName: updatedBuyer.firstName,
    lastName: updatedBuyer.lastName,
    username: updatedBuyer.username,
    email: updatedBuyer.email,
    country: updatedBuyer.country,
    phoneNumber: updatedBuyer.phoneNumber,
    bio: updatedBuyer.bio,
    notificationPreferences: updatedBuyer.notificationPreferences,
    preferredLanguage: updatedBuyer.preferredLanguage,
    preferredCurrency: updatedBuyer.preferredCurrency
  };
}

/**
 * Prepares the update object with only the provided fields.
 *
 * @param {Object} updateData - The profile data to update
 * @param {Object} buyer - The current buyer data
 * @returns {Object} The prepared update object
 */
function prepareUpdateObject(updateData, buyer) {
  const updateObject = {};
  
  const fields = [
    'firstName',
    'lastName', 
    'username',
    'country',
    'phoneNumber',
    'bio',
    'preferredLanguage',
    'preferredCurrency'
  ];

  fields.forEach(field => {
    addFieldIfProvided(updateObject, updateData, field);
  });

  handleNotificationPreferences(updateObject, updateData, buyer);

  return updateObject;
}

/**
 * Updates the profile information for a buyer.
 *
 * This function:
 * - Validates the buyer exists
 * - Checks username uniqueness if being changed
 * - Updates the provided fields
 * - Returns the updated buyer profile data
 *
 * @param {string} buyerId - The buyer's ID
 * @param {Object} updateData - The profile data to update
 * @returns {Promise<Object>} Updated buyer profile data
 */
async function updateProfile(buyerId, updateData) {
  // Validate the update data
  await validateUpdateProfileData(updateData);

  // Get buyer with selected fields
  const buyer = await buyerRepository.findByIdWithFields(buyerId, {
    firstName: 1,
    lastName: 1,
    username: 1,
    email: 1,
    country: 1,
    phoneNumber: 1,
    bio: 1,
    notificationPreferences: 1,
    preferredLanguage: 1,
    preferredCurrency: 1
  });

  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Validate username uniqueness if being changed
  await validateUsernameUniqueness(updateData, buyer);

  // Prepare update object with only provided fields
  const updateObject = prepareUpdateObject(updateData, buyer);

  // Update the buyer
  const updatedBuyer = await buyerRepository.updateById(buyerId, updateObject);

  // Create and return response object
  return createResponseObject(updatedBuyer);
}

module.exports = {
  updateProfile,
  prepareUpdateObject,
  addFieldIfProvided,
  handleNotificationPreferences,
  validateUsernameUniqueness,
  createResponseObject,
}; 