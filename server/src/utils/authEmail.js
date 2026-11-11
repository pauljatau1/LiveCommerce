const { appName, buyerAppUrl, sellerAppUrl, sellerAppLink } = require('./helpers');

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const classicEmailsEnabled = () => /^(true|1)$/i.test(process.env.CLASSIC_EMAIL_TEMPLATES || '');

// Studio colours, written out because email clients ignore stylesheets
const C = { text: '#1D2A24', muted: '#5B6660', primary: '#10734F', sunken: '#F4EFE8', border: '#EEE7DE', page: '#FBF8F4' };
const BODY = "font-family:Nunito,'Segoe UI',Arial,sans-serif";
const DISPLAY = "font-family:Fredoka,Nunito,'Segoe UI',Arial,sans-serif";

const firstName = (name) => String(name || '').trim().split(/\s+/)[0];
const p = (html, style = '') => `<p style="margin:0;${style}">${html}</p>`;
const codeBox = (code) => p(escapeHtml(code), `margin-top:24px;padding:20px 0;text-align:center;background:${C.sunken};border-radius:16px;${DISPLAY};font-size:40px;line-height:1;font-weight:500;letter-spacing:.3em;color:${C.text}`);
const button = (href, label, center = false) => `<p style="margin:12px 0 0;${center ? 'text-align:center' : ''}"><a href="${escapeHtml(href)}" style="display:inline-block;min-width:192px;padding:14px 24px;border-radius:999px;background:${C.primary};color:#FFFFFF;${BODY};font-size:16px;font-weight:600;text-align:center;text-decoration:none">${escapeHtml(label)}</a></p>`;

// Text first, one code, at most one button. No images except the wordmark, so it
// loads on slow data. Inline styles only.
function layout({ brand, home, heading, body, why }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>`
    + `<body style="margin:0;padding:24px 12px;background:${C.page};color:${C.text};${BODY};font-size:15px;line-height:1.55">`
    + `<div style="max-width:600px;margin:0 auto;padding:40px 32px;background:#FFFFFF;border-radius:20px;box-sizing:border-box">`
    + `<a href="${escapeHtml(home)}" style="${DISPLAY};font-size:24px;line-height:1;font-weight:500;letter-spacing:-.02em;color:${C.primary};text-decoration:none">${escapeHtml(brand)}</a>`
    + `<h1 style="margin:36px 0 0;${DISPLAY};font-size:24px;line-height:1.2;font-weight:500;color:${C.text}">${heading}</h1>`
    + body
    + `<div style="margin-top:40px;padding-top:24px;border-top:1px solid ${C.border}">`
    + p(`${why} Questions? Reply to this email.`, `font-size:12px;line-height:1.5;color:${C.muted}`)
    + p(`${escapeHtml(brand)} · ${escapeHtml(process.env.APP_LOCATION || 'Lagos, Nigeria')}`, `margin-top:6px;font-size:12px;color:${C.muted}`)
    + '</div></div></body></html>';
}

// One layout for sign-up codes, welcome and password recovery in both apps.
// The old templates remain available for rollback, off by default.
// options: kind verify|reset|welcome, audience buyer|seller, name, store, email, code, minutes, url
function authEmail(legacy, { kind = 'verify', audience = 'buyer', name, store, email, code, minutes = 10, url, forceCurrent = false } = {}) {
  if (classicEmailsEnabled() && !forceCurrent) return legacy;
  const brand = appName();
  const seller = audience === 'seller';
  const home = seller ? sellerAppLink() : buyerAppUrl();
  const hi = firstName(name);
  const place = seller ? 'the studio' : 'the app';
  // The reset email's button skips typing the code (the studio fills it in from the link)
  const resetLink = url || (seller && code && email ? `${sellerAppUrl()}/forgot-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}` : null);
  const target = url || (seller ? sellerAppLink(kind === 'welcome' ? 'start' : '') : buyerAppUrl());
  if (!/^https?:\/\//.test(target) || !/^https?:\/\//.test(home)) throw new Error('Email links require an absolute app URL');

  let subject; let heading; let body; let why;
  if (kind === 'passwordChanged') {
    subject = `Your ${brand} password was changed`; heading = 'Your password was changed';
    body = p(`Hi${hi ? ` ${escapeHtml(hi)}` : ''}, your password has been changed. You have been signed out on your other devices.`, 'margin-top:12px') + p("If you didn't do this, request a password reset and contact support.", 'margin-top:20px') + button(home, seller ? 'Go to studio' : 'Open shop');
    why = `You got this email because the password for your ${escapeHtml(brand)} account changed.`;
  } else if (kind === 'welcome') {
    subject = seller ? `Your ${brand} store is ready` : `Welcome to ${brand}`;
    heading = seller ? `Your store is ready${hi ? `, ${escapeHtml(hi)}` : ''}` : `Welcome${hi ? `, ${escapeHtml(hi)}` : ''}`;
    body = p(seller ? 'Your products, shows and orders have a home in your studio.' : 'Watch live shows, bid and buy in one tap.', 'margin-top:12px')
      + button(target, seller ? 'Go to studio' : 'Open shop');
    why = `You got this email because you created ${seller ? 'a seller account' : 'an account'} on ${escapeHtml(brand)}.`;
  } else if (kind === 'reset') {
    subject = `Reset your ${brand} password`;
    heading = 'Reset your password';
    const whose = email ? ` for ${escapeHtml(email)}` : '';
    if (code) {
      body = p(`Hi${hi ? ` ${escapeHtml(hi)}` : ''}, we got a request to reset the password${whose}. Enter this code in ${place}:`, 'margin-top:12px')
        + codeBox(code)
        + p(`The code works for ${Number(minutes)} minutes.`, `margin-top:12px;font-size:13px;color:${C.muted};text-align:center`)
        + (resetLink ? p('Or skip the code:', `margin-top:20px;color:${C.muted};text-align:center`) + button(resetLink, 'Reset password', true) : '');
    } else {
      body = p(`Hi${hi ? ` ${escapeHtml(hi)}` : ''}, we got a request to reset the password${whose}. Choose a new one with the button below.`, 'margin-top:12px')
        + button(target, 'Reset password', true)
        + p(`The link works for ${Number(minutes)} minutes.`, `margin-top:12px;font-size:13px;color:${C.muted};text-align:center`);
    }
    body += p("If you didn't ask for this, ignore this email. Your password stays the same.", `margin-top:28px;color:${C.muted}`);
    why = `You got this email because someone asked to reset the password for your ${escapeHtml(brand)} ${seller ? 'studio' : 'account'}.`;
  } else {
    subject = code ? `Your ${brand} code is ${code}` : `Verify your email for ${brand}`;
    heading = `Here's your code${hi ? `, ${escapeHtml(hi)}` : ''}`;
    const finishing = seller ? (store ? `creating ${escapeHtml(store)}` : 'creating your store') : 'creating your account';
    body = p(`Enter this code in ${place} to finish ${finishing}.`, 'margin-top:12px')
      + (code ? codeBox(code) + p(`The code works for ${Number(minutes)} minutes.`, `margin-top:12px;font-size:13px;color:${C.muted};text-align:center`) : button(target, 'Verify email'))
      + p(`If you didn't sign up for ${escapeHtml(brand)}, you can ignore this email.`, `margin-top:20px;color:${C.muted}`);
    why = `You got this email because someone used this address to sign up${seller ? ' as a seller' : ''} on ${escapeHtml(brand)}.`;
  }

  return {
    ...legacy,
    ...(legacy.from ? {from: process.env.EMAIL_FROM} : {}),
    subject,
    html: layout({ brand, home, heading, body, why }),
    text: require('../services/email/content').plainText(layout({brand, home, heading, body, why})),
    tags: [{name:'type', value: {reset:'password-reset',passwordChanged:'password-changed',verify:'verification-code',welcome:'welcome'}[kind] || 'transactional'}],
  };
}

module.exports = { authEmail, escapeHtml, classicEmailsEnabled };
