const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: 'AKIA_REDACTED',
    secretAccessKey: 'REDACTED',
    region: 'us-east-1',
  });

const sns = new AWS.SNS();

module.exports = { sns };