const { DeleteS3Objects } = require('../../utils/s3');
const { v4: uuidv4 } = require('uuid');
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
 * Build the filename for the blip.
 * 
 * @returns {string}
 */
function buildFileName(filename) {
    return `${filename}.mp4`;
}

/**
 * get the folder path for a blip.
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
 * @returns {Promise<{ Deleted: Array, Errors: Array }>}
 */
async function DeleteBlipFromS3(sellerId, productId, blipName) {
    const blipKey = GetFolderPath(sellerId, productId) + buildFileName(blipName);
    const objects = [{Key: blipKey}];
    return DeleteS3Objects(objects, process.env.CDN_S3_BUCKET);
}

module.exports = { GenerateUniqueFileName, GetFolderPath, DeleteBlipFromS3 };