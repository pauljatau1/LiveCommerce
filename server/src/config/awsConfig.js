const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: 'AKIA_REDACTED',
  secretAccessKey: 'REDACTED',
  region: 'us-east-1',
});

const s3 = new AWS.S3();

module.exports = s3;
