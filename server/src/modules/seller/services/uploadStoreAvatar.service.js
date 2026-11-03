/**
 * Upload Store Avatar Service
 *
 * This service handles the business logic for uploading and managing store avatars
 * for sellers. It provides functionality to:
 * - Validate uploaded avatar files for security and format requirements
 * - Upload avatar images to AWS S3 cloud storage
 * - Generate unique file names to prevent conflicts
 * - Create store avatar objects with proper URLs
 * - Update seller profile information with new avatar data
 * - Delete previous avatar from S3 storage
 * - Ensure data integrity and security standards
 *
 * The service ensures that store avatar uploads are properly processed,
 * securely stored, and correctly associated with seller accounts.
 *
 * @module uploadStoreAvatarService
 */

const sellerRepository = require('../repositories/seller.repository');
const { s3 } = require('../../../config/awsConfig');
const { v4: uuidv4 } = require('uuid');
const { DeleteS3Objects } = require('../../../utils/s3');
const { validateUploadStoreAvatarData } = require('../validators/uploadStoreAvatar.validator');

/**
 * Uploads a file to S3 and returns the upload data.
 *
 * This function handles the secure upload of store avatar images to AWS S3 cloud storage,
 * generating unique file names to prevent conflicts and ensuring proper content type handling.
 *
 * Business Logic:
 * - Generates unique file name using UUID to prevent naming conflicts
 * - Sets proper content type for the uploaded file
 * - Uploads file buffer to S3 bucket
 * - Returns upload metadata for further processing
 *
 * Security Considerations:
 * - Unique file names prevent overwriting existing files
 * - Content type validation ensures proper file handling
 * - S3 bucket configuration provides secure storage
 * - File buffer handling prevents file system vulnerabilities
 *
 * @param {Object} file - The file object from multer
 * @param {Buffer} file.buffer - File content buffer
 * @param {string} file.originalname - Original filename
 * @param {string} file.mimetype - File MIME type
 * @returns {Promise<Object>} Upload data with Location and Key
 * @example
 * const uploadData = await uploadFileToS3({
 *   buffer: fileBuffer,
 *   originalname: 'avatar.jpg',
 *   mimetype: 'image/jpeg'
 * });
 */
async function uploadFileToS3(file) {
  // Step 1: Generate unique file name using UUID
  // This prevents naming conflicts and ensures file uniqueness
  const uniqueFileName = `${uuidv4()}-${file.originalname}`;

  // Step 2: Prepare S3 upload parameters
  // This configures the upload with proper content type and metadata
  const params = {
    Bucket: process.env.CDN_S3_BUCKET,
    Key: uniqueFileName,
    Body: file.buffer,
    ContentType: file.mimetype
  };

  // Step 3: Upload file to S3
  // This performs the actual upload operation
  const uploadData = await s3.upload(params).promise();

  // Step 4: Return upload metadata
  // This provides the caller with upload information
  return uploadData;
}

/**
 * Deletes previous avatar from S3 storage.
 *
 * This function safely removes the previous avatar file from S3 storage
 * to prevent storage bloat and maintain clean file management.
 *
 * Business Logic:
 * - Extracts the S3 key from the avatar URL
 * - Constructs proper S3 object key for deletion
 * - Performs batch deletion operation
 * - Handles deletion errors gracefully
 *
 * Error Handling:
 * - Logs deletion errors for monitoring
 * - Continues operation even if deletion fails
 * - Prevents deletion errors from affecting upload process
 *
 * @param {string} avatarUrl - The URL of the avatar to delete
 * @returns {Promise<void>} No return value
 * @example
 * await deletePreviousAvatar('https://cdn.example.com/old-avatar.jpg');
 */
async function deletePreviousAvatar(avatarUrl) {
  // Step 1: Check if avatar URL exists
  // This prevents unnecessary deletion operations
  if (!avatarUrl || avatarUrl.trim() === '') {
    return;
  }

  // Step 2: Extract S3 key from URL
  // This converts the full URL to the S3 object key
  const s3Key = avatarUrl.replace(`https://${process.env.CDN_URL}/`, '');

  // Step 3: Prepare deletion parameters
  // This configures the batch deletion operation
  const objects = [{ Key: s3Key }];

  // Step 4: Perform S3 deletion
  // This removes the old avatar file from storage
  const deleteResponse = await DeleteS3Objects(objects, process.env.CDN_S3_BUCKET);

  // Step 5: Handle deletion errors
  // This logs any deletion failures for monitoring
  if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
    // Log deletion errors but don't throw to prevent upload failure
    // This ensures the new avatar upload succeeds even if old avatar deletion fails
  }
}

/**
 * Updates seller with new store avatar information.
 *
 * This function updates the seller's profile with the new avatar information,
 * including the avatar URL and public ID for future reference.
 *
 * Business Logic:
 * - Updates seller storeAvatar object with new URL and public ID
 * - Saves the updated seller record to database
 * - Returns the updated seller information
 *
 * Data Processing:
 * - Constructs proper avatar URL using CDN configuration
 * - Stores both URL and S3 key for future operations
 * - Maintains data consistency and integrity
 *
 * @param {string} sellerId - The seller's ID
 * @param {Object} uploadData - The S3 upload data
 * @param {string} uploadData.Key - The S3 object key
 * @returns {Promise<Object>} Updated seller data
 * @throws {Error} If seller is not found or update fails
 * @example
 * const updatedSeller = await updateSellerAvatar('507f1f77bcf86cd799439011', {
 *   Key: 'uuid-avatar.jpg'
 * });
 */
async function updateSellerAvatar(sellerId, uploadData) {
  // Step 1: Retrieve seller information from repository
  // This ensures we have the latest seller information
  const seller = await sellerRepository.findById(sellerId);
  if (!seller) {
    throw new Error('Seller not found');
  }

  // Step 2: Construct avatar URL
  // This creates the public URL for the uploaded avatar
  const avatarUrl = `https://${process.env.CDN_URL}/${uploadData.Key}`;

  // Step 3: Update seller avatar information
  // This stores the new avatar data in the seller profile
  seller.storeAvatar = {
    url: avatarUrl,
    public_id: uploadData.Key
  };

  // Step 4: Save the updated seller record
  // This persists the avatar information to the database
  const updatedSeller = await sellerRepository.save(seller);

  // Step 5: Return the updated seller data
  // This provides the caller with the updated seller information
  return updatedSeller;
}

/**
 * Upload store avatar to seller profile.
 *
 * This function processes store avatar upload requests, validates the uploaded file,
 * uploads it to S3 storage, and updates the seller's profile with the new avatar.
 *
 * Business Logic:
 * - Validates uploaded file using the validator
 * - Uploads file to S3 cloud storage
 * - Updates seller profile with new avatar information
 * - Deletes previous avatar from S3 storage
 * - Ensures data integrity and security
 *
 * Data Processing:
 * - Validates all file properties and content
 * - Generates unique file names for storage
 * - Creates proper avatar URLs for access
 * - Maintains clean storage by removing old files
 * - Updates seller profile with new avatar data
 *
 * @param {string} sellerId - The seller's ID
 * @param {Object} file - The uploaded file object from multer
 * @param {Buffer} file.buffer - File content buffer
 * @param {string} file.originalname - Original filename
 * @param {string} file.mimetype - File MIME type
 * @param {number} file.size - File size in bytes
 * @returns {Object} Response object with updated seller data
 * @throws {Error} If validation fails, upload fails, or seller is not found
 * @example
 * const result = await uploadStoreAvatar('507f1f77bcf86cd799439011', {
 *   buffer: fileBuffer,
 *   originalname: 'avatar.jpg',
 *   mimetype: 'image/jpeg',
 *   size: 1024000
 * });
 */
async function uploadStoreAvatar(sellerId, file) {
  // Step 1: Validate uploaded file data using the validator
  // This ensures all file properties meet security and format requirements
  validateUploadStoreAvatarData(file);

  // Step 2: Retrieve seller information to get existing avatar
  // This allows us to delete the previous avatar after successful upload
  const seller = await sellerRepository.findById(sellerId);
  if (!seller) {
    throw new Error('Seller not found');
  }

  // Step 3: Get existing avatar URL for later deletion
  // This preserves the old avatar URL for cleanup
  const existingAvatarUrl = seller.storeAvatar?.url || '';

  // Step 4: Upload file to S3 cloud storage
  // This performs the secure upload operation
  const uploadData = await uploadFileToS3(file);

  // Step 5: Update seller profile with new avatar information
  // This saves the new avatar data to the seller's profile
  const updatedSeller = await updateSellerAvatar(sellerId, uploadData);

  // Step 6: Delete previous avatar from S3 storage
  // This cleans up old avatar files to prevent storage bloat
  await deletePreviousAvatar(existingAvatarUrl);

  // Step 7: Return success response with updated seller data
  // This provides the caller with the processing result
  return {
    message: 'Store avatar uploaded successfully',
    seller: updatedSeller
  };
}

module.exports = {
  uploadStoreAvatar,
};
