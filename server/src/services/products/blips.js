const { DeleteS3Objects } = require('../../utils/s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

/**
 * Generate an unique file name with path for blips.
 * 
 * @param {string} sellerId
 * @param {string} productId
 * @returns {string}
 */
function GenerateUniqueFileName(sellerId, productId) {
    const fileName = uuidv4();
    const folderPath = GetFolderPath(sellerId, productId);
    return folderPath + buildFileName(fileName);
}

/**
 * Extract fileName from filename without extension.
 * Example of filePath: sellers/68076f44d21cd481a2113775/products/683eb0b2afaf2cc809656451/blips/13f6be62-14b6-4227-a84c-ab9e8b6af572.mp4
 * 
 * @param {string} filePath
 * @returns {string}
 */
function ExtractFilenameFromS3Path(filePath) {
    const fileNameWithExt = path.basename(filePath); // 13781cd2-0a5d-46b4-9e55-b0a5f88ab2d4.mp4
    const fileName = fileNameWithExt.replace(path.extname(fileNameWithExt), ''); // remove .mp
    return fileName;
}

/**
 * Build the filename for the blip.
 * 
 * @returns {string}
 */
function buildFileName(filename) {
    return `${filename}.mp4`;
}

/**
 * Get the folder path for a blip.
 * 
 * @param {string} sellerId
 * @param {string} productId
 * @returns {string}
 */
function GetFolderPath(sellerId, productId) {
    return `sellers/${sellerId}/products/${productId}/blips/`;
}

/**
 * Delete a blip from s3.
 * 
 * @param {string} sellerId
 * @param {string} productId
 * @param {string} blipName
 * @param {string} bucketName
 * @returns {Promise<{ Deleted: Array, Errors: Array }>}
 */
async function DeleteBlipFromS3(sellerId, productId, blipName, bucketName) {
    const blipKey = GetFolderPath(sellerId, productId) + buildFileName(blipName);
    const objects = [{Key: blipKey}];
    return DeleteS3Objects(objects, bucketName);
}

module.exports = { GenerateUniqueFileName, GetFolderPath, DeleteBlipFromS3, ExtractFilenameFromS3Path };