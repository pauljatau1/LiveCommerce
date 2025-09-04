/**
 * Upload Company Verification Service
 *
 * This service handles the business logic for uploading and managing company verification
 * documents for sellers. It provides functionality to:
 * - Validate uploaded document files for security and format requirements
 * - Upload documents to AWS S3 cloud storage with organized folder structure
 * - Generate unique file names to prevent conflicts
 * - Create verification document objects with proper URLs
 * - Update seller verification information with new document data
 * - Ensure data integrity and security standards
 *
 * The service ensures that company verification document uploads are properly processed,
 * securely stored, and correctly associated with seller accounts.
 *
 * @module uploadCompanyVerificationService
 */

const sellerRepository = require('../repositories/seller.repository');
const { s3 } = require('../../../config/awsConfig');
const { v4: uuidv4 } = require('uuid');
const uploadCompanyVerificationValidator = require('../validators/uploadCompanyVerification.validator');

/**
 * Uploads a document to S3 with organized folder structure.
 *
 * This function handles the S3 upload process for verification documents
 * with organized folder structure and unique file naming.
 *
 * Upload Process:
 * - Creates organized folder structure for company verification
 * - Generates unique file names with UUID to prevent conflicts
 * - Sets proper content type from file
 * - Uploads to configured S3 bucket
 * - Returns upload result with location and key
 *
 * File Organization:
 * - Organized folder structure: verification/{sellerId}/company/
 * - Unique file naming with UUID prefix
 * - Preserves original file extensions
 * - Prevents file name conflicts
 * - Maintains file type information
 *
 * @param {Object} file - The uploaded file object
 * @param {Buffer} file.buffer - File buffer data
 * @param {string} file.originalname - Original file name
 * @param {string} file.mimetype - File MIME type
 * @param {string} sellerId - The seller's ID for folder organization
 * @returns {Promise<Object>} Upload result from S3
 *   - Location: {string} - S3 object URL
 *   - Key: {string} - S3 object key
 * @throws {Error} If S3 upload fails
 * @example
 * const uploadData = await uploadDocumentToS3({
 *   buffer: Buffer.from('document data'),
 *   originalname: 'certificate.pdf',
 *   mimetype: 'application/pdf'
 * }, '507f1f77bcf86cd799439011');
 * // Returns: { Location: 'https://s3.amazonaws.com/...', Key: 'verification/507f1f77bcf86cd799439011/company/uuid-certificate.pdf' }
 */
async function uploadDocumentToS3(file, sellerId) {
  // Step 1: Create organized file key with folder structure
  // This organizes documents by seller ID and includes UUID for uniqueness
  const key = `verification/${sellerId}/company/${uuidv4()}-${file.originalname}`;
  
  // Step 2: Upload document to S3 with organized structure
  return await s3.upload({
    Bucket: process.env.CDN_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  }).promise();
}

/**
 * Creates document object with proper structure and metadata.
 *
 * This function creates a standardized document object that includes
 * all necessary information for verification document management.
 *
 * Document Structure:
 * - Document type identification
 * - File URL for access
 * - S3 public ID for management
 * - Upload timestamp for tracking
 *
 * @param {string} documentType - Type of verification document
 * @param {Object} uploadResult - S3 upload result
 * @param {string} uploadResult.Key - S3 object key
 * @returns {Object} Formatted document object
 * @example
 * const document = createDocumentObject('certificateOfIncorporation', { Key: 'verification/123/company/uuid-cert.pdf' });
 * // Returns: {
 * //   documentType: 'certificateOfIncorporation',
 * //   fileUrl: 'https://cdn.example.com/verification/123/company/uuid-cert.pdf',
 * //   public_id: 'verification/123/company/uuid-cert.pdf'
 * // }
 */
function createDocumentObject(documentType, uploadResult) {
  return {
    documentType: documentType,
    fileUrl: `https://${process.env.CDN_URL}/${uploadResult.Key}`,
    public_id: uploadResult.Key
  };
}

/**
 * Main function to upload company verification documents.
 *
 * This function orchestrates the entire company verification document upload process,
 * including validation, S3 uploads, and seller record updates.
 *
 * Business Logic:
 * - Validates uploaded documents for security and format requirements
 * - Uploads Certificate of Incorporation (required) to S3
 * - Uploads Business Tax ID (optional) to S3 if provided
 * - Creates organized verification document structure
 * - Updates seller verification status and document information
 * - Returns updated seller data with verification documents
 *
 * Upload Flow:
 * 1. Validate uploaded files using validator
 * 2. Upload Certificate of Incorporation to S3
 * 3. Upload Business Tax ID to S3 if provided
 * 4. Create verification documents structure
 * 5. Update seller verification information
 * 6. Return updated seller data
 *
 * Security Features:
 * - Document validation before upload
 * - Organized S3 file structure
 * - Unique file naming with UUID
 * - Verification status management
 * - Error handling without information leakage
 *
 * @param {string} sellerId - The seller's ID
 * @param {Object} files - The uploaded files object from multer
 * @returns {Promise<Object>} Updated seller data with verification documents
 * @throws {ValidationError} If document validation fails
 * @throws {Error} If seller not found or upload fails
 * @example
 * try {
 *   const updatedSeller = await uploadCompanyVerification('507f1f77bcf86cd799439011', req.files);
 *   console.log('Verification documents uploaded:', updatedSeller.verificationDocuments);
 * } catch (error) {
 *   console.error('Upload failed:', error.message);
 * }
 */
async function uploadCompanyVerification(sellerId, files) {
  // Step 1: Validate uploaded documents using the validator
  // This ensures all files meet security and format requirements
  uploadCompanyVerificationValidator.validateCompanyVerificationDocuments(files);
  
  // Step 2: Find the seller to verify existence and update verification status
  // This ensures the seller exists before proceeding with document uploads
  const seller = await sellerRepository.findById(sellerId);
  if (!seller) {
    throw new Error('Seller not found');
  }
  
  // Step 3: Initialize documents array to store uploaded document information
  // This will contain all successfully uploaded verification documents
  const documents = [];
  
  // Step 4: Upload Certificate of Incorporation (required document)
  // This is the mandatory document for company verification
  const certFile = files.certificateOfIncorporation[0];
  const certUploadResult = await uploadDocumentToS3(certFile, sellerId);
  documents.push(createDocumentObject('certificateOfIncorporation', certUploadResult));
  
  // Step 5: Upload Business Tax ID if provided (optional document)
  // This document is optional but can be provided for additional verification
  if (files.businessTaxId && files.businessTaxId[0]) {
    const taxFile = files.businessTaxId[0];
    const taxUploadResult = await uploadDocumentToS3(taxFile, sellerId);
    documents.push(createDocumentObject('businessTaxId', taxUploadResult));
  }
  
  // Step 6: Update seller verification documents structure
  // This organizes the verification documents by type and sets verification status
  seller.verificationDocuments = {
    type: 'company',
    documents: documents
  };
  
  // Step 7: Set verification documents as filled
  // This indicates that the seller has completed the document upload process
  seller.hasFilledVerificationDocuments = true;
  
  // Step 8: Save the updated seller using the repository
  // This persists the verification document information to the database
  const updatedSeller = await sellerRepository.save(seller);
  
  // Step 9: Return the updated seller data with verification documents
  // This provides confirmation of successful upload and updated information
  return updatedSeller;
}

module.exports = { uploadCompanyVerification };
