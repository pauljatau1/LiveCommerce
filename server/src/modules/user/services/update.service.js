const userRepository = require('../repositories/user.repository');
const userValidator = require('../validators/user.validator');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Handles the business logic for updating a user.
 *
 * @param {string} userId - The ID of the user to update
 * @param {Object} data - The update data (e.g., email, name, status)
 * @returns {Promise<Object>} - The updated user object
 * @throws {ValidationError} - If input data fails validation
 * @throws {NotFoundException} - If user is not found
 */
async function updateUser(userId, data) {
  await userValidator.validateUpdateData(userId, data);

  const updatedUser = await userRepository.updateById(userId, data);
  if (!updatedUser) {
    throw new NotFoundException('User not found');
  }
  
  return updatedUser.toObject({ versionKey: false });
}

module.exports = {
  updateUser,
};