/**
 * Update Profile Service
 *
 * This service handles the business logic for updating a buyer's profile information.
 * It provides functionality to:
 * - Validate profile update data
 * - Check username uniqueness if being changed
 * - Handle notification preferences merging
 * - Update buyer profile fields selectively
 * - Maintain data integrity and consistency
 * - Return formatted response data
 *
 * The service ensures that profile updates are performed securely while
 * preserving existing data and preventing conflicts with other users.
 *
 * @module updateProfileService
 */

const buyerRepository = require('../repositories/buyer.repository');
const { validateUpdateProfileData } = require('../validators/updateProfile.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const ValidationError = require('../../../utils/errors/ValidationError');

/**
 * Adds a field to the update object if it's provided.
 *
 * This function conditionally adds fields to the update object only if
 * they are provided in the update data, preventing overwriting with undefined values.
 *
 * Business Logic:
 * - Checks if field value is provided (not undefined)
 * - Only adds field to update object if value exists
 * - Prevents overwriting with undefined values
 * - Maintains data integrity during updates
 *
 * @param {Object} updateObject - The update object to modify
 * @param {Object} updateData - The profile data to update
 * @param {string} fieldName - The field name to check and add
 * @example
 * const updateObj = {};
 * addFieldIfProvided(updateObj, { firstName: "John" }, "firstName");
 * // updateObj now contains: { firstName: "John" }
 */
function addFieldIfProvided(updateObject, updateData, fieldName) {
  if (updateData[fieldName] !== undefined) {
    updateObject[fieldName] = updateData[fieldName];
  }
}

/**
 * Handles notification preferences merge.
 *
 * This function performs a deep merge of notification preferences,
 * preserving existing settings while updating with new values.
 *
 * Business Logic:
 * - Checks if notification preferences are provided
 * - Performs deep merge with existing preferences
 * - Preserves existing settings not included in update
 * - Maintains notification preference structure
 *
 * @param {Object} updateObject - The update object to modify
 * @param {Object} updateData - The profile data to update
 * @param {Object} buyer - The current buyer data
 * @example
 * const updateObj = {};
 * const buyer = { notificationPreferences: { email: true } };
 * handleNotificationPreferences(updateObj, { notificationPreferences: { sms: true } }, buyer);
 * // updateObj.notificationPreferences contains: { email: true, sms: true }
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
 * This function checks if a username is already taken by another user
 * when the buyer is attempting to change their username.
 *
 * Business Logic:
 * - Checks if username is being updated
 * - Verifies username is different from current username
 * - Queries database for existing username
 * - Throws validation error if username is taken
 * - Prevents username conflicts between users
 *
 * @param {Object} updateData - The profile data to update
 * @param {Object} buyer - The current buyer data
 * @param {string} updateData.username - New username to validate
 * @param {string} buyer.username - Current username
 * @throws {ValidationError} If username is already taken
 * @example
 * const buyer = { username: "olduser" };
 * await validateUsernameUniqueness({ username: "newuser" }, buyer); // Valid if available
 * await validateUsernameUniqueness({ username: "existinguser" }, buyer); // Throws error if taken
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
 * This function formats the updated buyer data into a clean response object
 * suitable for API consumption.
 *
 * Business Logic:
 * - Extracts relevant profile fields
 * - Maintains consistent response structure
 * - Includes all updated profile information
 * - Provides clean API response format
 *
 * @param {Object} updatedBuyer - The updated buyer data
 * @param {string} updatedBuyer.firstName - Buyer's first name
 * @param {string} updatedBuyer.lastName - Buyer's last name
 * @param {string} updatedBuyer.username - Buyer's username
 * @param {string} updatedBuyer.email - Buyer's email address
 * @param {string} updatedBuyer.country - Buyer's country
 * @param {string} updatedBuyer.phoneNumber - Buyer's phone number
 * @param {string} updatedBuyer.bio - Buyer's bio
 * @param {Object} updatedBuyer.notificationPreferences - Buyer's notification preferences
 * @param {string} updatedBuyer.preferredLanguage - Buyer's preferred language
 * @param {string} updatedBuyer.preferredCurrency - Buyer's preferred currency
 * @returns {Object} The formatted response object
 * @example
 * const response = createResponseObject(updatedBuyer);
 * // Returns: { firstName: "John", lastName: "Doe", username: "johndoe", ... }
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
 * This function creates an update object containing only the fields
 * that are provided in the update data, preventing unnecessary updates.
 *
 * Business Logic:
 * - Defines list of updatable fields
 * - Conditionally adds fields if provided
 * - Handles notification preferences separately
 * - Returns clean update object
 *
 * @param {Object} updateData - The profile data to update
 * @param {Object} buyer - The current buyer data
 * @returns {Object} The prepared update object
 * @example
 * const updateObj = prepareUpdateObject({ firstName: "John" }, buyer);
 * // Returns: { firstName: "John" }
 */
function prepareUpdateObject(updateData, buyer) {
  const updateObject = {};
  
  // Define list of fields that can be updated
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

  // Add each field if provided
  fields.forEach(field => {
    addFieldIfProvided(updateObject, updateData, field);
  });

  // Handle notification preferences separately for deep merge
  handleNotificationPreferences(updateObject, updateData, buyer);

  return updateObject;
}

/**
 * Update buyer profile information.
 *
 * This function orchestrates the complete profile update process,
 * including validation, uniqueness checks, and database updates.
 *
 * Business Logic Flow:
 * 1. Validate input data using validator
 * 2. Retrieve current buyer data
 * 3. Validate username uniqueness if being changed
 * 4. Prepare update object with provided fields
 * 5. Update buyer record in database
 * 6. Return formatted response data
 *
 * Security Considerations:
 * - Input validation prevents malicious data injection
 * - Username uniqueness validation prevents conflicts
 * - Selective field updates prevent data corruption
 * - Proper error handling for edge cases
 *
 * @param {string} buyerId - The buyer's unique identifier
 * @param {Object} updateData - The profile data to update
 * @param {string} updateData.firstName - Buyer's first name (optional)
 * @param {string} updateData.lastName - Buyer's last name (optional)
 * @param {string} updateData.username - Buyer's username (optional)
 * @param {string} updateData.country - Buyer's country (optional)
 * @param {string} updateData.phoneNumber - Buyer's phone number (optional)
 * @param {string} updateData.bio - Buyer's bio (optional)
 * @param {Object} updateData.notificationPreferences - Buyer's notification preferences (optional)
 * @param {string} updateData.preferredLanguage - Buyer's preferred language (optional)
 * @param {string} updateData.preferredCurrency - Buyer's preferred currency (optional)
 * @returns {Promise<Object>} Updated profile information
 * @throws {ValidationError} If validation fails or username is taken
 * @throws {NotFoundException} If buyer is not found
 * @throws {Error} If database operation fails
 * @example
 * const updatedProfile = await updateProfile(
 *   "507f1f77bcf86cd799439011",
 *   { firstName: "John", lastName: "Doe", bio: "New bio" }
 * );
 * // Returns: { firstName: "John", lastName: "Doe", username: "johndoe", ... }
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

  // Step 3: Validate username uniqueness if being changed
  // This prevents username conflicts with other users
  await validateUsernameUniqueness(updateData, buyer);

  // Step 4: Prepare update object with only provided fields
  // This creates a clean update object with only the fields that need updating
  const updateObject = prepareUpdateObject(updateData, buyer);

  // Step 5: Update buyer record in database
  // This performs the actual database update with the prepared data
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