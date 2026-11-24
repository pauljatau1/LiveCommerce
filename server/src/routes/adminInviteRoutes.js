// Admin team: super admins invite people and choose what they can see and change.
const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const AdminInvite = require('../models/AdminInvite');
const access = require('../config/adminAccess');
const { isAllowedAdminEmail } = require('../config/admins');

const INVITE_DAYS = 7;
const hash = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');
const adminUrl = () => (process.env.ADMIN_URL || 'https://livecommerce-admin.onrender.com').replace(/\/+$/, '');
const validEmail = (e) => typeof e === 'string' && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(e.trim());
const fail = (res, status, message) => res.status(status).json({ success: false, message });
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// What an invite or member gets, from the form: a ready-made role, adjusted area by area, or super admin
function accessFrom(body) {
  if (body.super === true) return { role: 'super', roleTemplate: 'super', permissions: {} };
  const template = access.ROLES.find((r) => r.key === body.roleTemplate);
  const permissions = access.cleanPermissions({ ...(template?.permissions || {}), ...(body.permissions || {}) });
  if (!Object.values(permissions).some((l) => l !== 'none')) return null;
  return { role: 'member', roleTemplate: template?.key || 'custom', permissions };
}

const summary = (a) => a.role === 'super' ? 'Super admin: everything, including the team'
  : access.AREAS.filter((x) => (a.permissions?.[x.key] || 'none') !== 'none').map((x) => `${x.label} (${a.permissions[x.key]})`).join(', ');

async function sendInvite({ email, link, inviter, accessText }) {
  try {
    await require('../services/email/mailer').send({
      to: email,
      subject: "You're invited to the Auqli admin",
      html: `<p>${escapeHtml(inviter)} invited you to the Auqli admin.</p><p>Your access: ${escapeHtml(accessText)}.</p><p><a href="${link}">Accept the invite</a> to choose a username and password. The link works for ${INVITE_DAYS} days.</p><p>If you weren't expecting this, ignore this email.</p>`,
      tags: [{ name: 'type', value: 'admin-invite' }],
    });
    return true;
  } catch (error) {
    console.error('[admin-invite] email', error.message);
    return false;
  }
}

async function newInvite({ email, grant, by }) {
  const token = crypto.randomBytes(24).toString('base64url');
  const invite = await AdminInvite.create({ email, tokenHash: hash(token), ...grant, invitedBy: by._id, invitedByEmail: by.email, expiresAt: new Date(Date.now() + INVITE_DAYS * 864e5) });
  const link = `${adminUrl()}/invite/${token}`;
  const emailed = await sendInvite({ email, link, inviter: by.username || by.email, accessText: summary(grant) });
  return { invite, link, emailed };
}

const memberView = (a) => ({
  _id: a._id, username: a.username, email: a.email, lastLogin: a.lastLogin, createdAt: a.createdAt,
  owner: isAllowedAdminEmail(a.email), active: a.active !== false, roleTemplate: a.roleTemplate || null,
  ...access.accessSummary(a),
});
const inviteView = (i) => ({
  _id: i._id, email: i.email, role: i.role, roleTemplate: i.roleTemplate, permissions: access.permissionsOf(i),
  invitedByEmail: i.invitedByEmail, createdAt: i.createdAt, expiresAt: i.expiresAt, expired: i.expiresAt < new Date(),
});

// ---- Team (super admins only: the 'team' area in config/adminAccess.js) ----
const teamRouter = express.Router();

teamRouter.get('/', async (req, res) => {
  try {
    const [admins, invites] = await Promise.all([
      Admin.find({}).select('-password').sort({ createdAt: 1 }).lean(),
      AdminInvite.find({ acceptedAt: null, revokedAt: null }).sort({ createdAt: -1 }).lean(),
    ]);
    res.json({ success: true, me: String(req.admin._id), areas: access.AREAS, roles: access.ROLES,
      members: admins.map(memberView), invites: invites.map(inviteView) });
  } catch (error) {
    console.error('[team] list', error.message);
    fail(res, 500, "Couldn't load the team. Try again.");
  }
});

teamRouter.post('/invites', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!validEmail(email)) return fail(res, 400, 'Enter a valid email address.');
    const grant = accessFrom(req.body);
    if (!grant) return fail(res, 400, 'Pick at least one area this person can see.');
    if (await Admin.exists({ email, active: { $ne: false } })) return fail(res, 409, 'This person already has admin access. Change their access in the team list instead.');
    await AdminInvite.updateMany({ email, acceptedAt: null, revokedAt: null }, { $set: { revokedAt: new Date() } });
    const { invite, link, emailed } = await newInvite({ email, grant, by: req.admin });
    res.status(201).json({ success: true, invite: inviteView(invite), link, emailed,
      message: emailed ? `Invite sent to ${email}.` : `Invite created, but the email didn't send. Copy the link and send it yourself.` });
  } catch (error) {
    console.error('[team] invite', error.message);
    fail(res, 500, "Couldn't create the invite. Try again.");
  }
});

teamRouter.post('/invites/:inviteId/resend', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.inviteId)) return fail(res, 404, "We couldn't find this invite.");
    const old = await AdminInvite.findOneAndUpdate({ _id: req.params.inviteId, acceptedAt: null, revokedAt: null }, { $set: { revokedAt: new Date() } });
    if (!old) return fail(res, 404, 'This invite was already used or cancelled.');
    const grant = { role: old.role, roleTemplate: old.roleTemplate, permissions: access.permissionsOf(old) };
    const { invite, link, emailed } = await newInvite({ email: old.email, grant, by: req.admin });
    res.json({ success: true, invite: inviteView(invite), link, emailed, message: emailed ? `New invite sent to ${old.email}.` : 'New link created, but the email didn\'t send. Copy the link and send it yourself.' });
  } catch (error) {
    console.error('[team] resend', error.message);
    fail(res, 500, "Couldn't resend the invite. Try again.");
  }
});

teamRouter.delete('/invites/:inviteId', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.inviteId)) return fail(res, 404, "We couldn't find this invite.");
  const done = await AdminInvite.findOneAndUpdate({ _id: req.params.inviteId, acceptedAt: null, revokedAt: null }, { $set: { revokedAt: new Date() } });
  if (!done) return fail(res, 404, 'This invite was already used or cancelled.');
  res.json({ success: true, message: 'Invite cancelled. The link no longer works.' });
});

async function editableMember(req, res) {
  if (!mongoose.isValidObjectId(req.params.adminId)) { fail(res, 404, "We couldn't find this person."); return null; }
  if (String(req.params.adminId) === String(req.admin._id)) { fail(res, 400, "You can't change your own access. Ask another super admin."); return null; }
  const member = await Admin.findById(req.params.adminId);
  if (!member) { fail(res, 404, "We couldn't find this person."); return null; }
  if (isAllowedAdminEmail(member.email)) { fail(res, 400, 'This is an owner account (set in ADMIN_EMAILS on the server). Change it there.'); return null; }
  return member;
}

teamRouter.patch('/members/:adminId', async (req, res) => {
  try {
    const member = await editableMember(req, res); if (!member) return;
    const grant = accessFrom(req.body);
    if (!grant) return fail(res, 400, 'Pick at least one area, or remove this person instead.');
    member.role = grant.role; member.roleTemplate = grant.roleTemplate; member.permissions = grant.permissions;
    await member.save({ validateModifiedOnly: true });
    res.json({ success: true, member: memberView(member.toObject()), message: 'Access updated. It applies straight away.' });
  } catch (error) {
    console.error('[team] update', error.message);
    fail(res, 500, "Couldn't update access. Try again.");
  }
});

teamRouter.delete('/members/:adminId', async (req, res) => {
  try {
    const member = await editableMember(req, res); if (!member) return;
    member.active = false; member.removedAt = new Date(); member.authVersion = (member.authVersion || 0) + 1;
    await member.save({ validateModifiedOnly: true });
    res.json({ success: true, message: `${member.email} no longer has admin access. They've been signed out.` });
  } catch (error) {
    console.error('[team] remove', error.message);
    fail(res, 500, "Couldn't remove access. Try again.");
  }
});

// ---- Accepting an invite (public: the link is the proof) ----
const publicRouter = express.Router();
const openInvite = (token) => AdminInvite.findOne({ tokenHash: hash(token || ''), acceptedAt: null, revokedAt: null, expiresAt: { $gt: new Date() } });

publicRouter.get('/:token', async (req, res) => {
  const invite = await openInvite(req.params.token).lean();
  if (!invite) return fail(res, 410, 'This invite link has expired or was already used. Ask for a new one.');
  res.json({ success: true, email: invite.email, invitedBy: invite.invitedByEmail, expiresAt: invite.expiresAt,
    access: invite.role === 'super' ? 'Super admin' : summary({ role: invite.role, permissions: access.permissionsOf(invite) }) });
});

publicRouter.post('/accept', async (req, res) => {
  try {
    const { token, username, password } = req.body || {};
    const name = String(username || '').trim();
    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(name)) return fail(res, 400, 'Pick a username of 3 to 30 letters, numbers, dots, dashes or underscores.');
    if (typeof password !== 'string' || password.length < 10) return fail(res, 400, 'Use a password of at least 10 characters.');
    const invite = await openInvite(token);
    if (!invite) return fail(res, 410, 'This invite link has expired or was already used. Ask for a new one.');
    if (await Admin.exists({ username: name, email: { $ne: invite.email } })) return fail(res, 409, 'That username is taken. Try another.');
    // Claim the invite first, so the same link can't be used twice at once
    const claimed = await AdminInvite.findOneAndUpdate({ _id: invite._id, acceptedAt: null, revokedAt: null }, { $set: { acceptedAt: new Date() } });
    if (!claimed) return fail(res, 410, 'This invite link was already used.');
    const fields = { username: name, password, invited: true, role: invite.role, roleTemplate: invite.roleTemplate, permissions: access.permissionsOf(invite), invitedBy: invite.invitedBy, active: true, removedAt: undefined };
    let admin = await Admin.findOne({ email: invite.email });
    if (admin) { Object.assign(admin, fields); admin.authVersion = (admin.authVersion || 0) + 1; }
    else admin = new Admin({ email: invite.email, ...fields });
    try { await admin.save(); }
    catch (error) {
      await AdminInvite.updateOne({ _id: invite._id }, { $set: { acceptedAt: null } });
      if (error.code === 11000) return fail(res, 409, 'That username is taken. Try another.');
      throw error;
    }
    await AdminInvite.updateOne({ _id: invite._id }, { $set: { acceptedAdmin: admin._id } });
    res.status(201).json({ success: true, username: admin.username, message: 'Your admin account is ready. Sign in with your username or email.' });
  } catch (error) {
    console.error('[admin-invite] accept', error.message);
    fail(res, 500, "Couldn't finish setting up your account. Try again.");
  }
});

module.exports = { teamRouter, publicRouter, accessFrom };
