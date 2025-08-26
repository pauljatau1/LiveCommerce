/**
 * Upload Profile Image Service
 *
 * This service handles the business logic for uploading and managing profile images
 * for buyers. It provides functionality to:
 * - Validate uploaded image files for security and format requirements
 * - Upload images to AWS S3 cloud storage
 * - Generate unique file names to prevent conflicts
 * - Create profile image objects with proper URLs
 * - Update buyer profile information with new image data
 * - Handle default profile image fallbacks
 * - Ensure data integrity and security standards
 *
 * The service ensures that profile image uploads are properly processed,
 * securely stored, and correctly associated with buyer accounts.
 *
 * @module uploadProfileImageService
 */

const buyerRepository = require('../repositories/buyer.repository');
const { s3 } = require('../../../config/awsConfig');
const { v4: uuidv4 } = require('uuid');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const { validateUploadProfileImageData } = require('../validators/uploadProfileImage.validator');

/**
 * Uploads a file to S3 and returns the upload data.
 *
 * This function handles the secure upload of profile images to AWS S3 cloud storage,
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
 *   buffer: Buffer.from('image data'),
 *   originalname: 'profile.jpg',
 *   mimetype: 'image/jpeg'
 * });
 * // Returns: { Location: 'https://s3.amazonaws.com/...', Key: 'uuid-filename.jpg' }
 */
async function uploadFileToS3(file) {
  // Step 1: Prepare S3 upload parameters
  // This configures the upload with bucket, unique key, file content, and content type
  const params = {
    Bucket: process.env.CDN_S3_BUCKET, // S3 bucket for CDN storage
    Key: `${uuidv4()}-${file.originalname}`, // Generate unique filename to prevent conflicts
    Body: file.buffer, // File content as buffer
    ContentType: file.mimetype, // Set proper MIME type for the file
  };
  
  // Step 2: Upload file to S3 and return upload data
  // This performs the actual upload and returns metadata including Location and Key
  return await s3.upload(params).promise();
}

/**
 * Creates default profile image data.
 *
 * This function provides a standardized default profile image configuration
 * that can be used when no custom profile image is available.
 *
 * Business Logic:
 * - Returns consistent default image URL from Cloudinary CDN
 * - Provides standardized default image key for identification
 * - Ensures fallback image is always available
 *
 * Use Cases:
 * - New user registration without profile image
 * - Profile image deletion scenarios
 * - System initialization and defaults
 *
 * @returns {Object} Default image data
 * @example
 * const defaultImage = createDefaultImageData();
 * // Returns: {
 * //   Location: 'https://res.cloudinary.com/dljgzevaj/image/upload/...',
 * //   Key: 'default-profile-image'
 * // }
 */
function createDefaultImageData() {
  // Return standardized default profile image configuration
  // This provides a consistent fallback image for users without custom profile images
  return {
    Location: 'https://res.cloudinary.com/dljgzevaj/image/upload/v1730579531/user-account-management-logo-user-icon-11562867145a56rus2zwu_cgs18m.png', // Default image URL from Cloudinary CDN
    Key: 'default-profile-image', // Standardized key for default image identification
  };
}

/**
 * Creates profile image object from upload data.
 *
 * This function transforms S3 upload data into a standardized profile image object
 * format that can be stored in the buyer's profile and used throughout the application.
 *
 * Business Logic:
 * - Constructs CDN URL using environment configuration
 * - Uses S3 key as public identifier for the image
 * - Creates consistent profile image object structure
 * - Ensures proper URL formatting for frontend consumption
 *
 * Data Transformation:
 * - S3 upload data → Standardized profile image object
 * - S3 Key → public_id for image identification
 * - CDN URL construction for optimized image delivery
 *
 * @param {Object} uploadData - The upload data from S3
 * @param {string} uploadData.Key - S3 object key (filename)
 * @param {string} uploadData.Location - S3 object location URL
 * @returns {Object} Profile image object
 * @example
 * const profileImage = createProfileImageObject({
 *   Key: 'uuid-profile.jpg',
 *   Location: 'https://s3.amazonaws.com/bucket/uuid-profile.jpg'
 * });
 * // Returns: {
 * //   url: 'https://cdn.example.com/uuid-profile.jpg',
 * //   public_id: 'uuid-profile.jpg'
 * // }
 */
function createProfileImageObject(uploadData) {
  // Transform S3 upload data into standardized profile image object
  // This creates a consistent format for storing and using profile images
  return {
    url: `https://${process.env.CDN_URL}/${uploadData.Key}`, // Construct CDN URL for optimized image delivery
    public_id: uploadData.Key, // Use S3 key as public identifier for image management
  };
}

/**
 * Uploads profile image for a buyer.
 *
 * This function orchestrates the complete profile image upload process,
 * including validation, file upload, and buyer profile updates.
 *
 * Business Logic Flow:
 * 1. Validate uploaded file for security and format requirements
 * 2. Retrieve buyer information with selected fields
 * 3. Verify buyer exists in the system
 * 4. Upload file to AWS S3 cloud storage
 * 5. Create standardized profile image object
 * 6. Update buyer's profile with new image data
 * 7. Return updated buyer information
 *
 * Security Considerations:
 * - File validation prevents malicious uploads
 * - Buyer existence verification ensures data integrity
 * - S3 upload provides secure cloud storage
 * - Unique file names prevent conflicts and overwrites
 * - CDN URL construction ensures optimized delivery
 *
 * Data Processing:
 * - File validation using dedicated validator
 * - S3 upload with unique naming
 * - Profile image object creation
 * - Buyer profile database update
 * - Selective field return for security
 *
 * @param {string} buyerId - The buyer's unique identifier
 * @param {Object} file - The uploaded file object (required)
 * @param {Buffer} file.buffer - File content buffer
 * @param {string} file.originalname - Original filename
 * @param {string} file.mimetype - File MIME type
 * @param {number} file.size - File size in bytes
 * @returns {Promise<Object>} Updated buyer data with profile image
 *   - firstName: {string} - Buyer's first name
 *   - lastName: {string} - Buyer's last name
 *   - username: {string} - Buyer's username
 *   - email: {string} - Buyer's email
 *   - profileImage: {Object} - Updated profile image object
 * @throws {ValidationError} If file validation fails
 * @throws {NotFoundException} If buyer is not found
 * @throws {Error} If S3 upload or database update fails
 * @example
 * const updatedBuyer = await uploadProfileImage('buyer123', {
 *   buffer: Buffer.from('image data'),
 *   originalname: 'profile.jpg',
 *   mimetype: 'image/jpeg',
 *   size: 1024000
 * });
 * // Returns updated buyer data with new profile image
 */
async function uploadProfileImage(buyerId, file) {
  // Step 1: Validate uploaded file for security and format requirements
  // This ensures the file meets all validation criteria before processing
  await validateUploadProfileImageData({ file });

  // Step 2: Retrieve buyer information with selected fields
  // This fetches only necessary buyer data for security and performance
  const buyer = await buyerRepository.findByIdWithFields(buyerId, {
    firstName: 1, // Include first name for response
    lastName: 1,  // Include last name for response
    username: 1,  // Include username for response
    email: 1,     // Include email for response
    profileImage: 1 // Include current profile image for reference
  });

  // Step 3: Verify buyer exists in the system
  // This prevents operations on non-existent buyer accounts
  if (!buyer) {
    throw new NotFoundException('Buyer not found');
  }

  // Step 4: Upload file to AWS S3 cloud storage
  // This securely stores the image with unique naming to prevent conflicts
  const uploadData = await uploadFileToS3(file);

  // Step 5: Create standardized profile image object
  // This transforms S3 upload data into application-ready format
  const profileImage = createProfileImageObject(uploadData);

  // Step 6: Update buyer's profile with new image data
  // This persists the new profile image information to the database
  const updatedBuyer = await buyerRepository.updateById(buyerId, { profileImage });

  // Step 7: Return updated buyer information with new profile image
  // This provides the caller with the updated buyer data including the new image
  return {
    firstName: updatedBuyer.firstName,     // Return first name
    lastName: updatedBuyer.lastName,       // Return last name
    username: updatedBuyer.username,       // Return username
    email: updatedBuyer.email,             // Return email
    profileImage: updatedBuyer.profileImage // Return updated profile image object
  };
}

module.exports = {
  uploadProfileImage,
  uploadFileToS3,
  createDefaultImageData,
  createProfileImageObject,
}; 