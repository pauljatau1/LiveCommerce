# Shared app email

All app email enters `server/src/services/email/mailer.js`. The official Resend SDK is the default transport. EMAIL_PROVIDER selects Resend, Termii or SendGrid explicitly; it does not automatically send the same message through another provider on failure. The old Termii transport and SendGrid factory remain in source and are used only for the selected fallback. SMS stays on Termii.

The mailer uses EMAIL_FROM for outgoing sender fields and EMAIL_REPLY_TO when supplied. Resend and SendGrid accept those fields; the retained Termii fallback uses its provider-side email configuration for the actual sender. The old template bodies and subjects remain; the mailer replaces the old brand with APP_NAME at delivery. Auth templates also supply plain text, including codes, expiry, reset links and the password-change notice. Other HTML messages receive generated plain text.

## Staging and production

On staging, EMAIL_REDIRECT_TO replaces every original recipient with the configured account inbox. Subjects begin with `[to: original recipient]`; HTML and text start with a small staging note. This works for recipient arrays and all three providers. Resend’s test sender can deliver only to the email on the Resend account, so the redirect is required for testing email to arbitrary app users.

When APP_ENV is production, EMAIL_REDIRECT_TO is ignored and one warning is logged if it is set. The decision uses APP_ENV, not NODE_ENV: production Node builds on staging still redirect. Sender configuration is not given a hard-coded fallback.

`GET /health` retains its database status and adds only `email` (`configured` or `missing`) and `redirect` (boolean). It never exposes sender, recipient or key values. Startup emits one warning listing missing RESEND_API_KEY/EMAIL_FROM names; mail is not a reason to stop the app. Health configuration follows the selected provider.

## Reliability and logs

Every message has a type tag and an event/id idempotency key. Reset messages use the challenge generation’s token hash, so resending a new code is a new event. Password-change notices use account/session version. Campaigns use campaign/recipient IDs and retain recipient tracking IDs. Legacy callers receive stable, hashed content keys. No codes or email addresses appear in generated keys.

A shared queue spaces attempts by at least 110ms per process. It also spaces concurrent campaign calls. A returned SDK error fails the send even though the promise resolved; rejected/network calls are caught separately. A 429 is retried up to three times with exponential backoff and the exact same payload/key. Queue failures do not stop later messages. Resend account-wide limits can also cover other instances; 429 handling remains active for that case.

Delivery logs contain the type, recipient domain, provider and returned ID, without keys, auth subjects/codes or full bodies. Legacy email-detail logs are switched off. The mailer raises plain errors rather than exposing provider payloads. The Termii compatibility wrapper retains its previous `{failed: true}` failure result for business callers. Buyer OTP signup now retains its successful creation reply when delivery fails, matching the existing non-blocking seller registration behavior. Reset replies remain generic on failure and for unknown accounts.

Resend idempotency applies within the provider’s retention window; no permanent delivery/outbox collection has been added. Bounce/complaint hooks are deferred until a real sender domain is verified; the mailer has a TODO linking to Resend’s webhook docs.

## Admin test and checks

Admin-only `POST /api/v2/admin/test-email` takes `{ to }`, sends the password-changed template and returns `{ id }`. Guests and non-admins are refused. Bad addresses get a plain validation message; send failures return a plain 503 message. Each deliberate test is a new event.

The full [email inventory](resend-email-inventory.md) lists every active sending function, including older controllers, scheduled jobs, account/security mail, notifications, deliveries, returns and payouts. Former SendGrid send boundaries are exercised with mocked mailer calls; auth and notification flows are also tested through their real wrappers. No live messages are sent by automated tests.

Validation: 259 server suites / 3,860 tests passed; 28 studio tests and 7 buyer tests passed; both production builds passed. Mailer/provider tests, former-send-boundary checks, admin/health routes and auth failure flows use mocked delivery. No live emails were sent.

Render variable names:

- RESEND_API_KEY
- EMAIL_FROM
- EMAIL_REDIRECT_TO
- EMAIL_PROVIDER
- EMAIL_REPLY_TO (optional)

Existing APP_ENV determines whether redirects are enabled; APP_NAME supplies the brand. Keep staging and production environment settings separate. The old provider credentials remain available only for their selected fallback.

## How to check on staging

1. Configure the Resend test sender and redirect to the Resend account inbox. Confirm `/health` reports configured email with redirects enabled.
2. As an admin, post to `/api/v2/admin/test-email`. Confirm the returned ID and delivery to Paul’s inbox.
3. Request a seller password reset for an app user. Confirm a six-digit code, `[to: …]` subject prefix and staging note in Paul’s inbox. The code/link should still complete the reset; the password-changed email should follow.
4. Use the buyer OTP signup flow (or resend its signup verification code for a new buyer). Confirm the verification email reaches the same inbox. The newer auto-verified buyer registration path does not require a signup code; its behavior remains unchanged.
5. Confirm the test, reset and signup messages appear in the Resend dashboard’s Emails list, with their type tags.
6. Optional: send a small campaign and confirm queued delivery without a burst above the limit. Automated tests cover 429 retries and provider failures; do not intentionally break staging credentials for this check.
