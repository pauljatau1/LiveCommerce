const crypto = require('crypto');
const mailer = require('../services/email/mailer');
const {authEmail} = require('../utils/authEmail');
exports.testEmail = async (req, res) => {
  const to = req.body?.to;
  if (typeof to !== 'string' || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(to)) {
    return res.status(400).json({message: 'Enter a valid email address.'});
  }
  try {
    const result = await mailer.send({to, ...authEmail({}, {forceCurrent: true, kind:'passwordChanged', audience:'seller'}),
      tags: [{name:'type', value:'test-email'}], idempotencyKey: `test-email/${crypto.randomUUID()}`});
    return res.json({id: result.id});
  } catch (error) {
    return res.status(503).json({message: 'We couldn’t send the test email. Check the email settings and try again.'});
  }
};
