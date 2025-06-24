const NotFoundException = require('../../../utils/errors/NotFoundException');
const userRepository = require('../repositories/user.repository');

/**
 * Deletes a user by ID.
 *
 * @param {string} userId - The ID of the user to delete
 * @throws {NotFoundException} - If the user does not exist
 */
async function deleteUser(userId) {
  const deleted = await userRepository.deleteById(userId);

  if (!deleted) {
    throw new NotFoundException('User not found');
  }
}

module.exports = {
  deleteUser,
};