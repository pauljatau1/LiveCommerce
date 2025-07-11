const buyerRepository = require('../repositories/buyer.repository');
const { s3 } = require('../../../config/awsConfig');
const { v4: uuidv4 } = require('uuid');
const NotFoundException = require('../../../utils/errors/NotFoundException');
const { validateUploadedFile } = require('../validators/uploadProfileImage.validator');

/**
 * Uploads a file to S3 and returns the upload data.
 *
 * @param {Object} file - The file object from multer
 * @returns {Promise<Object>} Upload data with Location and Key
 */
async function uploadFileToS3(file) {
  const params = {
    Bucket: process.env.CDN_S3_BUCKET,
    Key: `${uuidv4()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };
  
  return await s3.upload(params).promise();
}

/**
 * Creates default profile image data.
 *
 * @returns {Object} Default image data
 */
function createDefaultImageData() {
  return {
    Location: 'https://res.cloudinary.com/dljgzevaj/image/upload/v1730579531/user-account-management-logo-user-icon-11562867145a56rus2zwu_cgs18m.png',
    Key: 'default-profile-image',
  };
}

/**
 * Creates profile image object from upload data.
 *
 * @param {Object} uploadData - The upload data from S3
 * @returns {Object} Profile image object
 */
function createProfileImageObject(uploadData) {
  return {
    url: `https://${process.env.CDN_URL}/${uploadData.Key}`,
    public_id: uploadData.Key,
  };
}

/**
 * Uploads profile image for a buyer.
 *
 * This function:
 * - Validates the uploaded file
 * - Validates the buyer exists
 * - Uploads file to S3
 * - Updates buyer's profile image
 * - Returns the updated buyer data
 *
 * @param {string} buyerId - The buyer's ID
 * @param {Object} file - The uploaded file object (required)
 * @returns {Promise<Object>} Updated buyer data
 */
async function uploadProfileImage(buyerId, file) {
  // Validate uploaded file
  validateUploadedFile(file);

  // Get buyer with selected fields
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

  // Upload file to S3
  const uploadData = await uploadFileToS3(file);

  // Create profile image object
  const profileImage = createProfileImageObject(uploadData);

  // Update buyer's profile image
  const updatedBuyer = await buyerRepository.updateById(buyerId, { profileImage });

  return {
    firstName: updatedBuyer.firstName,
    lastName: updatedBuyer.lastName,
    username: updatedBuyer.username,
    email: updatedBuyer.email,
    profileImage: updatedBuyer.profileImage
  };
}

module.exports = {
  uploadProfileImage,
  uploadFileToS3,
  createDefaultImageData,
  createProfileImageObject,
}; 