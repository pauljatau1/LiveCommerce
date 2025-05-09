const AWS = require('aws-sdk');

if (process.env.ECS_CONTAINER_METADATA_URI_V4) {
  AWS.config.credentials = new AWS.ECSCredentials({
    httpOptions: {timeout: 5000}, // 5 second timeout
    maxRetries: 10, 
  });
}
else {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });
}

const s3 = new AWS.S3();

module.exports = { s3 };
