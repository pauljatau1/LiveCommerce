
const { s3 } = require('../config/awsConfig');

/**
 * Deletes objects from S3 and returns the result.
 * @param {Array<{ Key: string }>} objects - S3 object keys to delete.
 * @param {string} bucket - S3 bucket name.
 * @returns {Promise<{ Deleted: Array, Errors: Array }>}
 */
async function DeleteS3Objects(objects, bucket) {
  if (objects.length > 0) {
    const response = await s3.deleteObjects({
      Bucket: bucket,
      Delete: { Objects: objects, Quiet: false }
    }).promise();

    return response;
  } else {
    return { Deleted: [], Errors: [] }; // Safe fallback if nothing to delete
  }
}

module.exports = { DeleteS3Objects };