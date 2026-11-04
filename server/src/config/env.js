// Startup check for environment settings.
// Core settings are required in production; feature settings only switch
// features on or off, so a missing one is reported but does not stop the server.

const CORE = ['MONGODB_URI', 'JWT_SECRET', 'SESSION_SECRET'];

const FEATURES = {
  'Live video (Agora)': ['AGORA_APP_ID', 'AGORA_APP_CERTIFICATE'],
  'Show recording (Agora cloud recording)': [
    'AGORA_CUSTOMER_ID', 'AGORA_CUSTOMER_SECRET',
    'RECORDING_S3_BUCKET', 'RECORDING_S3_ACCESS_KEY', 'RECORDING_S3_SECRET_KEY',
  ],
  'Payments and wallet (Paystack)': ['PAYSTACK_SECRET_KEY', 'PAYSTACK_PUBLIC_KEY'],
  'Delivery (Shipbubble)': ['SHIPBUBBLE_API_KEY'],
  'AI features (Gemini)': ['GEMINI_API_KEY'],
  'SMS and phone OTP (Termii)': ['TERMII_API_KEY', 'TERMII_SENDER_ID'],
  'Media storage (S3)': ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'CDN_S3_BUCKET', 'CDN_URL'],
  'Email (SendGrid)': ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL'],
  'Google sign-in': ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL'],
};

const isSet = (name) => typeof process.env[name] === 'string' && process.env[name].trim() !== '';

const featureStatus = () =>
  Object.entries(FEATURES).map(([feature, vars]) => ({
    feature,
    enabled: vars.every(isSet),
    missing: vars.filter((v) => !isSet(v)),
  }));

const checkEnv = (log = console) => {
  const missingCore = CORE.filter((v) => !isSet(v));
  if (missingCore.length) {
    const message = `Missing required settings: ${missingCore.join(', ')}`;
    if (process.env.NODE_ENV === 'production') throw new Error(message);
    log.warn(`${message} (allowed outside production)`);
  }

  for (const { feature, enabled, missing } of featureStatus()) {
    if (enabled) log.info(`[features] ${feature}: on`);
    else log.info(`[features] ${feature}: off (missing ${missing.join(', ')})`);
  }
};

module.exports = { checkEnv, featureStatus, CORE, FEATURES };
