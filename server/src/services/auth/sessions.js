const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

async function version(id, role) {
  if (!['Buyer', 'Seller'].includes(role) || !mongoose.isValidObjectId(id)) return 0;
  const Model = require(`../../models/${role}`);
  const account = await Model.findById(id, {authVersion: 1}).lean();
  return Number(account?.authVersion) || 0;
}

async function assertSession(decoded) {
  // Old tokens have no version and remain valid until that account resets its password.
  if (Number(decoded.v || 0) !== await version(decoded.id, decoded.role)) {
    throw new Error('Your password changed. Please sign in again.');
  }
  return decoded;
}

async function issueToken(id, role = 'Buyer', expiresIn = '500w', verifiedVersion) {
  // Login/renewal must use the version present when authentication was checked.
  // Reading a newer version here could revive a session during a concurrent reset.
  return jwt.sign({id, role, v: verifiedVersion === undefined ? await version(id, role) : Number(verifiedVersion)}, process.env.JWT_SECRET, {expiresIn});
}

module.exports = {assertSession, issueToken};
