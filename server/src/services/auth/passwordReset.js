const crypto = require('crypto');
const bcrypt = require('bcrypt');
const Challenge = require('../../models/PasswordResetChallenge');
const BadRequestException = require('../../utils/errors/BadRequestException');
const {authEmail} = require('../../utils/authEmail');
const mail = require('../termiiEmailService');
const {sellerAppUrl, buyerAppUrl} = require('../../utils/helpers');
const MINUTES = 15, MAX_ATTEMPTS = 5;
const normalizeEmail = value => String(value || '').trim().toLowerCase();
const model = role => require(`../../models/${role}`);
const hash = value => crypto.createHash('sha256').update(String(value)).digest('hex');
const codeHash = (role, id, code) => crypto.createHmac('sha256', process.env.RESET_CODE_SECRET || process.env.JWT_SECRET).update(`${role}:${id}:${code}`).digest('hex');
const badRequest = message => Object.assign(new BadRequestException(message), {status: 400});
const fail = () => badRequest('That code or link has expired or cannot be used. Request a new code.');
const legacyFields = {resetPasswordCode: 1, resetPasswordOTP: 1, resetPasswordOTPExpires: 1, resetPasswordExpires: 1, passwordResetToken: 1, passwordResetExpires: 1};

async function issue(role, email, {link = false, phone} = {}) {
  const reply = {message: phone
    ? 'If an account uses that phone number, we’ll send a reset code.'
    : 'If an account uses that email, we’ll send a reset code. Check your inbox.'};
  try {
    if (phone && typeof phone !== 'string') return reply;
    email = normalizeEmail(email);
    const account = phone
      ? await require('../../modules/buyer/repositories/buyer.repository').findByPhoneNumber(phone)
      : await model(role).findOne({email}).lean();
    if (!account) return reply;
    const code = String(crypto.randomInt(100000, 1000000));
    const token = crypto.randomBytes(32).toString('hex');
    await Challenge.init();
    await Challenge.findOneAndUpdate({account: account._id, role}, {$set: {
      codeHash: codeHash(role, account._id, code), linkHash: hash(token),
      expiresAt: new Date(Date.now() + MINUTES * 60000), attempts: 0, consumed: false,
    }}, {upsert: true});
    await model(role).updateOne({_id: account._id}, {$unset: legacyFields});
    const url = link ? `${role === 'Seller' ? sellerAppUrl() : buyerAppUrl()}/forgot-password?token=${token}` : undefined;
    try {
      if (phone) await require('../../modules/buyer/services/forgotPasswordSMS.service').sendSecureResetSMS(phone, code);
      else await mail.sendPasswordResetEmail({email, idempotencyKey: `password-reset/${hash(token)}`, ...authEmail({}, {
        forceCurrent: true, kind: 'reset', audience: role.toLowerCase(),
        name: account.firstName, email, code, minutes: MINUTES, url,
      })});
    } catch (error) {
      console.warn('[password-reset] Could not send reset message.');
    }
  } catch (error) {
    // The reply cannot reveal whether an account exists, including on mail/DB failure.
    console.warn('[password-reset] Could not prepare reset request.');
  }
  return reply;
}

async function challengeFor(role, {email, token, phoneNumber}) {
  if (phoneNumber && typeof phoneNumber !== 'string') return null;
  const active = {role, consumed: false, expiresAt: {$gt: new Date()}, attempts: {$lt: MAX_ATTEMPTS}};
  if (token) return Challenge.findOne({...active, linkHash: hash(token)}).lean();
  const account = role === 'Buyer' && phoneNumber
    ? await require('../../modules/buyer/repositories/buyer.repository').findByPhoneNumber(phoneNumber)
    : await model(role).findOne({email: normalizeEmail(email)}).lean();
  if (!account) return null;
  return Challenge.findOne({...active, account: account._id}).lean();
}

async function verifyLink(role, token) {
  if (!token || !(await challengeFor(role, {token}))) throw fail();
  return {valid: true, message: 'You can choose a new password.'};
}

async function reset(role, {email, code, otp, token, newPassword, phoneNumber}) {
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    throw badRequest('Use a password with at least 8 characters.');
  }
  if (role === 'Buyer' && (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword))) {
    throw badRequest('Use at least one letter and one number in your password.');
  }
  const challenge = await challengeFor(role, {email, token, phoneNumber});
  if (!challenge) throw fail();
  const candidate = String(code ?? otp ?? '');
  const matches = /^\d{6}$/.test(candidate) && challenge.codeHash
    && crypto.timingSafeEqual(Buffer.from(codeHash(role, challenge.account, candidate)), Buffer.from(challenge.codeHash));
  if (!token && !matches) {
    await Challenge.updateOne({_id: challenge._id, consumed: false, attempts: {$lt: MAX_ATTEMPTS}}, {$inc: {attempts: 1}});
    throw fail();
  }
  const password = await bcrypt.hash(newPassword, 10);
  // Claim after hashing: concurrent guesses, successful resets or resends cannot revive a code.
  const claimed = await Challenge.findOneAndUpdate({
    _id: challenge._id, codeHash: challenge.codeHash, linkHash: challenge.linkHash,
    consumed: false, attempts: {$lt: MAX_ATTEMPTS}, expiresAt: {$gt: new Date()},
  }, {$set: {consumed: true}, $unset: {codeHash: 1, linkHash: 1}}, {new: true});
  if (!claimed) throw fail();
  const account = await model(role).findOneAndUpdate({_id: challenge.account}, {
    $set: {password}, $inc: {authVersion: 1}, $unset: legacyFields,
  }, {new: true}).lean();
  if (!account) throw fail();
  try {
    const io = require('../../socket/socketManager').getIO();
    for (const socket of io?.sockets?.sockets?.values() || []) {
      if (String(socket.user?.id) === String(account._id) && socket.user?.role === role) {
        socket.emit('session_expired', {message: 'Your password changed. Please sign in again.'});
        socket.disconnect(true);
      }
    }
  } catch (error) {
    console.warn('[password-reset] Could not close active sockets.');
  }
  try {
    await mail.sendRawHTMLEmail({email: account.email, idempotencyKey: `password-changed/${account._id}-${account.authVersion}`, ...authEmail({}, {
      forceCurrent: true, kind: 'passwordChanged', audience: role.toLowerCase(),
      name: account.firstName, email: account.email,
    })});
  } catch (error) {
    console.warn('[password-reset] Could not send password-change email.');
  }
  return {message: 'Your password has been changed. Please sign in again.'};
}

module.exports = {issue, reset, verifyLink, normalizeEmail, MINUTES, MAX_ATTEMPTS, hash, codeHash};
