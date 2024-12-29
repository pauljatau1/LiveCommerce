const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Ensure you have your SendGrid API key set

const sendPasswordResetEmail = async (email, token) => {
  const msg = {
    to: email,
    from: 'Joseph From Auqli <joseph@auqli.com>',
    subject: 'Password Reset Request',
    text: `You requested a password reset. Please use the   I sssssing token to reset your password: ${token}`,
    html: `<p>You requested a password reset. Please use the following token to reset your password:</p><p><strong>${token}</strong></p>`,
  };

  await sgMail.send(msg);
};

module.exports = { sendPasswordResetEmail };
