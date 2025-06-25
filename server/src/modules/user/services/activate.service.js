const userRepository = require('../repositories/user.repository');
const User = require('../models/user.model');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Set user status to 'active'.
 * 
 * @param {string} userId
 * @throws {NotFoundException} If user not found.
 */
async function activateUser(userId) {
  const updatedUser = await userRepository.updateById(userId, { status: User.STATUS.ACTIVE });
  if (!updatedUser) throw new NotFoundException('User not found');

  return updatedUser;
}

module.exports = {
  activateUser,
};