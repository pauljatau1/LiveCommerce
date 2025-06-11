const { DeleteS3Objects } = require('../../../utils/s3');

/**
 * Deletes objects from S3 and returns the result.
 * @param {Array<{ Key: string }>} objects - S3 object keys to delete.
 * @param {string} bucket - S3 bucket name.
 * @returns {Promise<{ Deleted: Array, Errors: Array }>}
 */
async function ProductVariantDeleteS3ObjectsByUrls(urls) {
  const objects = urls.map(url => ({
    Key: url.replace(`https://${process.env.CDN_URL}/`, '')
  }));
  return DeleteS3Objects(objects, process.env.CDN_S3_BUCKET);
}

module.exports = { ProductVariantDeleteS3ObjectsByUrls };