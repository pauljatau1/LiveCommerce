// Which websites may call the API and open live-show sockets from a browser.
//
// ALLOWED_ORIGINS: comma-separated origins, e.g.
//   https://shop.example.com,https://studio.example.com
// Outside production, any http://localhost:<port> is also allowed.
// Requests with no Origin header (server-to-server, curl, native apps) are
// not restricted by CORS and are always let through.

const LOCALHOST = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const allowedOrigins = () =>
  (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const normalised = origin.replace(/\/+$/, '');
  if (allowedOrigins().includes(normalised)) return true;
  return process.env.NODE_ENV !== 'production' && LOCALHOST.test(normalised);
};

// Same signature for the cors package and for Socket.io
const originCheck = (origin, callback) => callback(null, isAllowedOrigin(origin));

const corsOptions = { origin: originCheck, credentials: true };

module.exports = { allowedOrigins, isAllowedOrigin, originCheck, corsOptions };
