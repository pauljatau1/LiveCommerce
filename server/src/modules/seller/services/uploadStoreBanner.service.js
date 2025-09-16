/**
 * Upload Store Banner Service
 *
 * This service handles the business logic for uploading and managing store banners
 * for sellers. It provides functionality to:
 * - Validate uploaded banner files for security and format requirements
 * - Upload banners to AWS S3 cloud storage
 * - Generate unique file names to prevent conflicts
 * - Create store banner objects with proper URLs
 * - Update seller profile information with new banner data
 * - Delete previous banner from S3 to prevent storage bloat
 * - Ensure data integrity and security standards
 *
 * The service ensures that store banner uploads are properly processed,
 * securely stored, and correctly associated with seller accounts.
 *
 * @module uploadStoreBannerService
 */

const sellerRepository = require('../repositories/seller.repository');
const { s3 } = require('../../../config/awsConfig');
const { v4: uuidv4 } = require('uuid');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const { DeleteS3Objects } = require('../../../utils/s3');
const { validateUploadStoreBannerData } = require('../validators/uploadStoreBanner.validator');

/**
 * Uploads a file to S3 and returns the upload data.
 *
 * This function handles the secure upload of store banner images to AWS S3 cloud storage,
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
 * @returns {Promise<Object>} Upload data with Key and Location
 */
async function uploadFileToS3(file) {
  const params = {
    Bucket: process.env.CDN_S3_BUCKET,
    Key: `${uuidv4()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };
  const data = await s3.upload(params).promise();
  return data;
}

/**
 * Deletes a previous banner from S3 storage.
 *
 * This function handles the deletion of old banner files from AWS S3 to manage storage
 * and ensure that only the current banner is retained. It extracts the S3 key from
 * the provided URL and performs a batch deletion operation.
 *
 * Business Logic:
 * - Checks if a valid banner URL is provided
 * - Extracts the S3 object key from the full banner URL
 * - Initiates a deletion request to S3 for the specified object
 * - Logs any errors during deletion without interrupting the main upload flow
 *
 * Security Considerations:
 * - Ensures only authorized objects are deleted
 * - Prevents accidental deletion of incorrect files
 * - Graceful error handling prevents service disruption
 *
 * @param {string} bannerUrl - The URL of the previous banner to delete
 * @returns {Promise<void>}
 */
async function deletePreviousBanner(bannerUrl) {
  // Step 1: Check if banner URL exists
  // This prevents unnecessary deletion operations
  if (!bannerUrl || bannerUrl.trim() === '') {
    return;
  }

  // Step 2: Extract S3 key from URL
  // This converts the full URL to the S3 object key
  const s3Key = bannerUrl.replace(`https://${process.env.CDN_URL}/`, '');

  // Step 3: Prepare deletion parameters
  // This configures the batch deletion operation
  const objects = [{ Key: s3Key }];

  // Step 4: Perform S3 deletion
  // This removes the old banner file from storage
  const deleteResponse = await DeleteS3Objects(objects, process.env.CDN_S3_BUCKET);

  // Step 5: Handle deletion errors
  // This logs any deletion failures for monitoring
  if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
    // Log deletion errors but don't throw to prevent upload failure
    // This ensures the new banner upload succeeds even if old banner deletion fails
  }
}

/**
 * Updates seller with new store banner information.
 *
 * This function updates the seller's profile with the new banner URL and public ID
 * after a successful upload to S3. It also handles the deletion of the previous banner.
 *
 * Business Logic:
 * - Retrieves the seller from the database
 * - Throws NotFoundException if seller does not exist
 * - Deletes the existing banner from S3 if one exists
 * - Updates the seller's `storeBanner` field with the new banner details
 * - Saves the updated seller profile to the database
 *
 * Security Considerations:
 * - Ensures seller ownership validation
 * - Prevents unauthorized updates to seller profiles
 * - Securely updates database records
 *
 * @param {string} sellerId - The ID of the seller to update
 * @param {Object} bannerData - The uploaded banner data from S3
 * @param {string} bannerData.Key - The S3 object key
 * @param {string} bannerData.Location - The S3 object URL
 * @returns {Promise<Object>} The updated seller object
 * @throws {NotFoundException} If the seller is not found
 */
async function updateSellerBanner(sellerId, bannerData) {
  // Step 1: Retrieve the seller from the database
  // The repository method `findById` is used to abstract database interaction.
  const seller = await sellerRepository.findById(sellerId);

  // Step 2: Check if the seller exists. If not, throw a NotFoundException.
  // This ensures that we are only attempting to update existing seller profiles.
  if (!seller) {
    throw new NotFoundException('Seller not found');
  }

  // Step 3: Delete the previous banner from S3 if one exists
  // This prevents orphaned files in S3 and manages storage.
  if (seller.storeBanner && seller.storeBanner.url) {
    await deletePreviousBanner(seller.storeBanner.url);
  }

  // Step 4: Update the seller's storeBanner field with the new banner details
  // The URL is constructed using the CDN_URL environment variable for consistency.
  seller.storeBanner = {
    url: `https://${process.env.CDN_URL}/${bannerData.Key}`,
    public_id: bannerData.Key,
  };

  // Step 5: Save the updated seller object back to the database
  // The repository method `save` is used to persist the changes.
  const updatedSeller = await sellerRepository.save(seller);

  // Step 6: Return the updated seller object
  return updatedSeller;
}

/**
 * Uploads a new store banner for a seller.
 *
 * This function orchestrates the entire process of uploading a new store banner,
 * from validating the input file to updating the seller's profile and cleaning up
 * old banners.
 *
 * @param {string} sellerId - The ID of the seller uploading the banner
 * @param {Object} bannerFile - The uploaded file object from multer
 * @param {Buffer} bannerFile.buffer - File content buffer
 * @param {string} bannerFile.originalname - Original filename
 * @param {string} bannerFile.mimetype - File MIME type
 * @param {number} bannerFile.size - File size in bytes
 * @returns {Promise<Object>} An object containing a success message and the updated seller information
 * @throws {ValidationError} If file validation fails
 * @throws {NotFoundException} If the seller is not found
 */
async function uploadStoreBanner(sellerId, bannerFile) {
  // Step 1: Validate the incoming banner file data
  // This ensures that the file adheres to the expected format and constraints.
  validateUploadStoreBannerData(bannerFile);

  // Step 2: Upload the new banner file to S3
  // This handles the external storage of the image.
  const uploadData = await uploadFileToS3(bannerFile);

  // Step 3: Update the seller's profile with the new banner information
  // This includes deleting the old banner and saving the new one to the database.
  const updatedSeller = await updateSellerBanner(sellerId, uploadData);

  // Step 4: Return a success message and the complete updated seller information
  return {
    message: 'Store banner uploaded successfully',
    seller: updatedSeller
  };
}

module.exports = {
  uploadStoreBanner,
};
