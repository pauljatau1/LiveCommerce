const AWS = require('aws-sdk');

// Object storage. Works with AWS S3, or with any S3-compatible service such as
// Cloudflare R2 when S3_ENDPOINT is set (e.g. https://<account-id>.r2.cloudflarestorage.com).
const endpoint = process.env.S3_ENDPOINT;

if (process.env.ECS_CONTAINER_METADATA_URI_V4) {
  AWS.config.credentials = new AWS.ECSCredentials({
    httpOptions: { timeout: 5000 },
    maxRetries: 10,
  });
} else {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    // R2 uses the region name "auto"
    region: process.env.AWS_REGION || (endpoint ? 'auto' : undefined),
  });
}

const s3Options = endpoint
  ? { endpoint, signatureVersion: 'v4', s3ForcePathStyle: true }
  : {};

// Applies to every `new AWS.S3()` in the app, wherever it is created
AWS.config.s3 = { ...(AWS.config.s3 || {}), ...s3Options };

const s3 = new AWS.S3(s3Options);

module.exports = { s3, s3Options };
