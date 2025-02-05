const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// Set SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = sgMail; 