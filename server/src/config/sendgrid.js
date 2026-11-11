require('dotenv').config();

// Retained transport, activated only by EMAIL_PROVIDER=sendgrid.
function legacySendgrid() {
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  return sgMail;
}

// Compatibility for older imports; provider selection always goes through the mailer.
module.exports = {
  legacySendgrid,
  send: message => Array.isArray(message)
    ? Promise.all(message.map(item => require('../services/email/mailer').send(item)))
    : require('../services/email/mailer').send(message),
};
