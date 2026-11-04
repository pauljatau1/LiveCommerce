// Who may register as an admin: a comma-separated list in ADMIN_EMAILS.
// With no list set, nobody can register as an admin.

const allowedAdminEmails = () =>
  (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const isAllowedAdminEmail = (email) =>
  typeof email === 'string' && allowedAdminEmails().includes(email.trim().toLowerCase());

module.exports = { allowedAdminEmails, isAllowedAdminEmail };
