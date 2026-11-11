const { appName, buyerAppUrl, sellerAppLink } = require('./helpers');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const classicEmailsEnabled = () => /^(true|1)$/i.test(process.env.CLASSIC_EMAIL_TEMPLATES || '');
// One layout for signup/verification, welcome and password recovery in both apps.
// The old templates remain available for rollback, off by default.
function authEmail(legacy, { kind = 'verify', audience = 'buyer', name, code, minutes = 10, url } = {}) {
  if (classicEmailsEnabled()) return legacy;
  const brand = appName();
  const title = kind === 'reset' ? 'Reset your password' : kind === 'welcome' ? 'Your store is ready' : 'Verify your email';
  const target = url || (audience === 'seller' ? sellerAppLink(kind === 'welcome' ? 'start' : '') : buyerAppUrl());
  if (!/^https?:\/\//.test(target)) throw new Error('Email links require an absolute app URL');
  return { ...legacy, ...(legacy.from ? { from: { email: 'support@auqli.com', name: brand } } : {}), subject: `${title} · ${brand}`, html: `<!doctype html><html><body style="margin:0;padding:24px;background:#fbf8f4;color:#203029;font:15px/1.6 Arial,sans-serif"><main style="max-width:480px;margin:auto;background:white;border:1px solid #e7dfd3;border-radius:20px;padding:28px"><div style="font-size:24px;font-weight:500;color:#117552">${escapeHtml(brand)}</div><h1 style="font-size:20px;font-weight:600">${title}</h1><p>Hi ${escapeHtml(name || 'there')},</p><p>${kind === 'welcome' ? 'Your products, shows and orders have a home in your studio.' : code ? `Use this code to ${kind === 'reset' ? 'choose a new password' : 'verify your email'}.` : 'Choose a new password using the button below.'}</p>${code ? `<div style="font-size:32px;letter-spacing:6px;font-weight:600;color:#117552">${escapeHtml(code)}</div><p style="font-size:13px;color:#63716a">Your code expires in ${Number(minutes)} minutes.</p>` : ''}<p><a href="${escapeHtml(target)}" style="display:inline-block;background:#117552;color:white;padding:12px 20px;border-radius:24px;text-decoration:none;font-weight:600">${kind === 'reset' && !code ? 'Reset password' : audience === 'seller' ? 'Go to studio' : 'Open shop'}</a></p>${kind !== 'welcome' ? `<p style="font-size:13px;color:#63716a">${code ? 'If you didn’t ask for this code, you can ignore this email.' : `This link expires in ${Number(minutes)} minutes. If you didn’t request it, ignore this email.`}</p>` : ''}<p style="font-size:12px;color:#63716a">${escapeHtml(brand)} · <a href="mailto:support@auqli.com" style="color:#117552">Get help</a></p></main></body></html>` };
}
module.exports = { authEmail, escapeHtml, classicEmailsEnabled };
