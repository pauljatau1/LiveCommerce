const AWS = require('aws-sdk');
const buyerRepository = require('../repositories/buyer.repository');
const uploadIdentityDocumentValidator = require('../validators/uploadIdentityDocument.validator');
const InternalErrorException = require('../../../utils/errors/InternalErrorException');

// Initialize S3 client
const s3 = new AWS.S3();

/**
 * Delete old identity document from S3 if it exists.
 *
 * @param {Object} buyer - The buyer object
 */
async function deleteOldDocument(buyer) {
  if (buyer.identityDocument && buyer.identityDocument.public_id) {
    await s3.deleteObject({
      Bucket: process.env.CDN_S3_BUCKET,
      Key: buyer.identityDocument.public_id
    }).promise();
  }
}

/**
 * Upload new document to S3.
 *
 * @param {Object} file - The uploaded file object
 * @param {string} buyerId - The buyer's ID
 * @returns {Promise<Object>} Upload result from S3
 */
async function uploadDocumentToS3(file, buyerId) {
  const key = `verification/buyers/${buyerId}/identity-${Date.now()}-${file.originalname}`;
  
  return await s3.upload({
    Bucket: process.env.CDN_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  }).promise();
}

/**
 * Update buyer's identity document information.
 *
 * @param {Object} buyer - The buyer object
 * @param {Object} uploadResult - The S3 upload result
 */
function updateBuyerIdentityDocument(buyer, uploadResult) {
  buyer.identityDocument = {
    url: 'https://' + process.env.CDN_URL + "/" + uploadResult.Key,
    public_id: uploadResult.Key,
    uploadedAt: new Date(),
    status: 'pending'
  };
  buyer.isIdentityVerified = false; // Reset verification status
}

/**
 * Upload identity document for buyer verification.
 *
 * This function orchestrates the identity document upload process by:
 * - Validating the upload request
 * - Deleting old document from S3 if it exists
 * - Uploading new document to S3
 * - Updating buyer's identity document information
 * - Saving the updated buyer data
 *
 * @param {string} buyerId - The buyer's ID
 * @param {Object} file - The uploaded file object
 * @returns {Promise<Object>} An object containing the uploaded document information
 */
async function uploadIdentityDocument(buyerId, file) {
  // Validate input data
  await uploadIdentityDocumentValidator.validateUploadIdentityDocumentData({ buyerId, file });

  // Get buyer data
  const buyer = await buyerRepository.findById(buyerId);

  // Delete old document from S3 if it exists
  await deleteOldDocument(buyer);

  // Upload new document to S3
  const uploadResult = await uploadDocumentToS3(file, buyerId);

  // Update buyer's identity document information
  updateBuyerIdentityDocument(buyer, uploadResult);

  // Save the buyer
  await buyerRepository.saveBuyer(buyer);

  return {
    document: buyer.identityDocument
  };
}

module.exports = {
  uploadIdentityDocument
}; 