const AWS = require('aws-sdk');

// Uncomment for local development
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

AWS.config.credentials = new AWS.ECSCredentials({
  httpOptions: {timeout: 5000}, // 5 second timeout
  maxRetries: 10, // retry 10 times
});

const sns = new AWS.SNS();

module.exports = { sns };