/**
 * Delete Buyer Profile Image Service
 *
 * Removes the buyer's current profile image by best-effort deleting the S3 object
 * (if a key is stored) and clearing `profileImage` on the buyer document.
 *
 * Why:
 * - Allows buyers to revert to no profile image
 * - Avoids accumulating unused images in storage
 * - Keeps profile state consistent across clients
 */

const buyerRepository = require('../repositories/buyer.repository');
const { DeleteS3Objects } = require('../../../utils/s3');
const NotFoundException = require('../../../utils/errors/NotFoundException');

/**
 * Delete an S3 object by key if present.
 *
 * @param {string} s3Key
 * @returns {Promise<void>}
 */
async function deleteS3IfPresent(s3Key) {
  if (!s3Key || typeof s3Key !== 'string' || s3Key.trim() === '') {
    return;
  }
  try {
    await DeleteS3Objects([{ Key: s3Key }], process.env.CDN_S3_BUCKET);
  } catch (_) {
    // Swallow errors to avoid blocking buyer profile update
  }
}

/**
 * Deletes the buyer's profile image.
 *
 * Steps:
 * 1) Find buyer and ensure existence
 * 2) Best-effort delete the S3 object using stored key
 * 3) Clear `profileImage` on the buyer document
 * 4) Persist and return essential fields
 *
 * @param {string} buyerId
 * @returns {Promise<{ firstName: string, lastName: string, username: string, email: string, profileImage: object }>} updated buyer
 */
async function deleteProfileImage(buyerId) {
  // Fetch minimal fields plus profile image for key lookup
  const buyer = await buyerRepository.findByIdWithFields(buyerId, {
    firstName: 1,
    lastName: 1,
    username: 1,
    email: 1,
    profileImage: 1
  });

  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  const currentKey = buyer.profileImage?.public_id || '';
  await deleteS3IfPresent(currentKey);

  // Clear profile image. Use empty object so downstream accessors won't throw.
  const updated = await buyerRepository.updateById(buyerId, { profileImage: {} });

  return {
    firstName: updated.firstName,
    lastName: updated.lastName,
    username: updated.username,
    email: updated.email,
    profileImage: updated.profileImage
  };
}

module.exports = {
  deleteProfileImage
};


