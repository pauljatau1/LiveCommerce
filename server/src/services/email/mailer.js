const crypto = require('crypto');
const { Resend } = require('resend');
const { appName } = require('../../utils/helpers');
const { escapeHtml } = require('../../utils/authEmail');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const address = value => typeof value === 'string' ? (value.match(/<([^>]+)>/)?.[1] || value).trim() : value?.email;
const addresses = to => (Array.isArray(to) ? to : [to]).map(address).filter(Boolean);
const {plainText} = require('./content');
const emailError = message => Object.assign(new Error(message), {code: 'email_failed'});

function createMailer({env = process.env, Client = Resend, sleep = wait, now = Date.now, log = console, termiiSend, sendgridSend} = {}) {
  let queue = Promise.resolve(), lastStart = null, client, clientKey, warnedConfig = false, warnedRedirect = false;
  const provider = () => (env.EMAIL_PROVIDER || 'resend').trim().toLowerCase();
  const redirecting = () => Boolean(env.EMAIL_REDIRECT_TO?.trim()) && env.APP_ENV !== 'production';
  function configuration() {
    const required = {resend: ['RESEND_API_KEY', 'EMAIL_FROM'], termii: ['TERMII_API_KEY', 'EMAIL_FROM'], sendgrid: ['SENDGRID_API_KEY', 'EMAIL_FROM']}[provider()];
    return {email: required?.every(key => Boolean(env[key]?.trim())) ? 'configured' : 'missing', redirect: redirecting()};
  }
  function checkConfig() {
    const missing = ['RESEND_API_KEY', 'EMAIL_FROM'].filter(key => !env[key]?.trim());
    if (missing.length && !warnedConfig) {
      log.warn(`[email] Missing settings: ${missing.join(', ')}.`);
      warnedConfig = true;
    }
    if (env.APP_ENV === 'production' && env.EMAIL_REDIRECT_TO && !warnedRedirect) {
      log.warn('[email] EMAIL_REDIRECT_TO is ignored in production.');
      warnedRedirect = true;
    }
    return configuration();
  }
  async function pace() {
    if (lastStart !== null) await sleep(Math.max(0, 110 - (now() - lastStart)));
    lastStart = now();
  }
  async function deliver(input) {
    // Termii's retained endpoint accepts one address, unlike the other SDKs.
    // Split before delivery so retrying one recipient never resends earlier recipients.
    const recipients = addresses(input.to);
    if (provider() === 'termii' && !redirecting() && recipients.length > 1) {
      const type = input.tags?.find(tag => tag.name === 'type')?.value || 'transactional';
      const results = [];
      for (const to of recipients) results.push(await deliver({...input, to,
        ...(input.idempotencyKey ? {idempotencyKey: `${type}/${digest(`${input.idempotencyKey}/${to}`)}`} : {}),
      }));
      return {provider: 'termii', id: results.map(result => result.id).filter(Boolean).join(',') || null};
    }
    checkConfig();
    if (configuration().email !== 'configured') throw emailError('Email is not set up yet. Please try again later.');
    const original = addresses(input.to);
    if (!original.length || original.some(to => !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(to))) throw emailError('Enter a valid email address.');
    if (!input.subject || (!input.html && !input.text)) throw emailError('Add an email subject and message.');
    const type = String(input.tags?.find(tag => tag.name === 'type')?.value || 'transactional');
    if (!/^[a-zA-Z0-9_-]{1,256}$/.test(type)) throw emailError('Choose a valid email type.');
    const tags = [...(input.tags || []).filter(tag => tag.name !== 'type'), {name: 'type', value: type}];
    // Keep old templates in source; all providers use the current brand and sender.
    const brand = env.APP_NAME || appName();
    const rebrand = value => String(value || '').replace(/\bAuqli\b/g, () => brand);
    let subject = rebrand(input.subject), html = String(input.html || '').replace(/\bAuqli\b/g, () => escapeHtml(brand)), text = rebrand(input.text || plainText(input.html));
    let to = original;
    if (redirecting()) {
      const label = original.join(', ');
      to = addresses(env.EMAIL_REDIRECT_TO);
      subject = `[to: ${label}] ${subject}`;
      const note = `<p style="font-size:12px;color:#5B6660">Staging: this was for ${escapeHtml(label)}</p>`;
      if (html) html = /<body\b[^>]*>/i.test(html) ? html.replace(/<body\b[^>]*>/i, match => match + note) : note + html;
      text = `Staging: this was for ${label}\n\n${text}`;
    }
    // A content fingerprint gives legacy callers a stable event/id key without exposing codes.
    // Explicit event IDs are used where available (reset challenges, campaigns, orders).
    const idempotencyKey = input.idempotencyKey || `${type}/${digest(JSON.stringify({original, to, subject, html, text, from: env.EMAIL_FROM, replyTo: input.replyTo || env.EMAIL_REPLY_TO, headers: input.headers}))}`;
    if (!idempotencyKey.startsWith(`${type}/`) || idempotencyKey.length > 256) throw emailError('Choose a valid email event key.');
    const payload = {from: env.EMAIL_FROM, to, subject, html: html || undefined, text, tags,
      ...(input.replyTo || env.EMAIL_REPLY_TO ? {replyTo: input.replyTo || env.EMAIL_REPLY_TO} : {}),
      ...(input.headers ? {headers: input.headers} : {}),
    };
    const selected = provider();
    const domains = [...new Set(to.map(value => value.split('@').pop()))].join(',');
    for (let attempt = 0; attempt <= 3; attempt++) {
      await pace();
      let result;
      // SDK errors are returned as {data,error}; only rejected calls enter this catch.
      try {
        if (selected === 'resend') {
          if (!client || clientKey !== env.RESEND_API_KEY) { client = new Client(env.RESEND_API_KEY); clientKey = env.RESEND_API_KEY; }
          result = await client.emails.send(payload, {idempotencyKey});
        } else if (selected === 'termii') {
          const send = termiiSend || (message => require('../termiiEmailService').legacy.sendRawHTMLEmail({email: message.to[0], subject: message.subject, html: message.html || `<p>${escapeHtml(message.text)}</p>`}));
          const response = await send(payload);
          result = response?.failed ? {error: {statusCode: response.statusCode}} : {data: {id: response?.id || response?.message_id || null}};
        } else {
          const send = sendgridSend || (message => require('../../config/sendgrid').legacySendgrid().send(message));
          const response = await send({...payload, reply_to: payload.replyTo});
          result = {data: {id: response?.[0]?.headers?.['x-message-id'] || response?.id || null}};
        }
      } catch (error) {
        if ((error.statusCode || error.response?.status) === 429 && attempt < 3) { await sleep(500 * 2 ** attempt); continue; }
        log.warn('[email] Send failed.', {type, domain: domains, provider: selected});
        throw emailError('We couldn’t send the email. Please try again shortly.');
      }
      if (result?.error) {
        if ((result.error.statusCode === 429 || result.error.name === 'rate_limit_exceeded') && attempt < 3) { await sleep(500 * 2 ** attempt); continue; }
        log.warn('[email] Send failed.', {type, domain: domains, provider: selected});
        throw emailError('We couldn’t send the email. Please try again shortly.');
      }
      if (!result?.data || (selected === 'resend' && !result.data.id)) throw emailError('We couldn’t confirm the email was sent. Please try again shortly.');
      log.info('[email] Sent.', {type, domain: domains, provider: selected, id: result.data.id});
      return {id: result.data.id, provider: selected};
    }
  }
  function send(input) {
    const pending = queue.then(() => deliver(input));
    queue = pending.catch(() => {});
    return pending;
  }
  return {send, configuration, checkConfig};
}

// TODO: add bounce/complaint handling after a real domain is verified:
// https://resend.com/docs/webhooks/introduction
module.exports = {...createMailer(), createMailer, plainText};
