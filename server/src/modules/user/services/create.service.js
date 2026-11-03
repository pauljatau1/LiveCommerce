const userRepository = require('../repositories/user.repository');
const userValidator = require('../validators/user.validator');

/**
 * Creates a new user with given data.
 * @param {Object} userData - Data for the new user.
 * @returns {Promise<Object>} Created user object.
 */
async function createUser(userData) {
  // Here you could add validations, password hashing, etc.
  await userValidator.validateCreateData(userData)

  return await userRepository.create(userData);
}

module.exports = {
  createUser,
};