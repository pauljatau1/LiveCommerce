// Small "STAGING" badge so a test site is never mistaken for the real one.
// Shown only when the site is built with VITE_APP_ENV=staging (set on Render);
// production builds leave it unset and show nothing.
const env = String(import.meta.env.VITE_APP_ENV || '').toLowerCase();
if (env && env !== 'production' && typeof document !== 'undefined') {
  const badge = document.createElement('div');
  badge.textContent = `${env.toUpperCase()} · test money`;
  badge.setAttribute('aria-hidden', 'true');
  Object.assign(badge.style, {
    position: 'fixed', left: '8px', bottom: '8px', zIndex: '2147483647', pointerEvents: 'none',
    background: '#B42318', color: '#fff', font: '800 11px/1 system-ui, sans-serif', letterSpacing: '0.06em',
    padding: '6px 9px', borderRadius: '999px', opacity: '0.9', boxShadow: '0 2px 6px rgba(0,0,0,.25)',
  });
  document.body.appendChild(badge);
  document.title = `[${env.toUpperCase()}] ${document.title}`;
}
