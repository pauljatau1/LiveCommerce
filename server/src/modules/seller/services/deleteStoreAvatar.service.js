/**
 * Delete Store Avatar Service
 *
 * This service handles the deletion of a seller's current store avatar image.
 * It removes the object from S3 (when present) and clears the `storeAvatar`
 * field on the seller document to an empty value, maintaining data integrity.
 *
 * Why:
 * - Frees storage by removing unused avatar objects
 * - Keeps seller profile consistent by clearing stale avatar metadata
 * - Provides an explicit endpoint for sellers to remove their avatar
 */

const sellerRepository = require('../repositories/seller.repository');
const { DeleteS3Objects } = require('../../../utils/s3');

/**
 * Delete the S3 object for a given key if provided.
 *
 * @param {string} s3Key - The S3 object key to delete
 * @returns {Promise<void>}
 */
async function deleteS3ObjectIfPresent(s3Key) {
  if (!s3Key || typeof s3Key !== 'string' || s3Key.trim() === '') {
    return;
  }
  try {
    await DeleteS3Objects([{ Key: s3Key }], process.env.CDN_S3_BUCKET);
  } catch (err) {
    // Intentionally swallow errors to avoid blocking avatar removal on DB side
    // Monitoring systems should capture this via global error logging if needed
  }
}

/**
 * Deletes the seller's current store avatar.
 *
 * Process:
 * 1) Load seller; error if not found
 * 2) If existing avatar exists, attempt to delete from S3 using stored key
 * 3) Clear seller.storeAvatar to an empty value
 * 4) Persist and return updated seller
 *
 * @param {string} sellerId - The seller's id
 * @returns {Promise<{ message: string, seller: object }>} result payload
 * @throws {Error} When seller is not found
 */
async function deleteStoreAvatar(sellerId) {
  // Load seller to ensure existence and retrieve current avatar
  const seller = await sellerRepository.findById(sellerId);
  if (!seller) {
    throw new Error('Seller not found');
  }

  // Extract the S3 key from our stored metadata when present
  const currentKey = seller.storeAvatar?.public_id || '';

  // Best-effort delete of the current avatar from S3
  await deleteS3ObjectIfPresent(currentKey);

  // Clear avatar info: set to empty object for downstream code expecting an object
  // Using an empty object instead of null/undefined to avoid optional chaining issues
  seller.storeAvatar = {};

  const updatedSeller = await sellerRepository.save(seller);

  return {
    message: 'Store avatar deleted successfully',
    seller: updatedSeller
  };
}

module.exports = {
  deleteStoreAvatar
};


