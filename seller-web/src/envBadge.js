// Small "STAGING" tag so a test site is never mistaken for the real one.
// Shown only when the site is built with VITE_APP_ENV=staging (set on Render);
// production builds leave it unset and show nothing. It sits in the top-left
// corner; pages make room for it with the env-badge class (see .lv --badge).
const env = String(import.meta.env.VITE_APP_ENV || '').toLowerCase();
if (env && env !== 'production' && typeof document !== 'undefined') {
  const badge = document.createElement('div');
  badge.textContent = `${env.toUpperCase()} · test money`;
  badge.setAttribute('aria-hidden', 'true');
  Object.assign(badge.style, {
    position: 'fixed', left: '8px', top: 'max(2px, env(safe-area-inset-top))', zIndex: '2147483647', pointerEvents: 'none',
    background: '#B42318', color: '#fff', font: '800 12px/1 system-ui, sans-serif', letterSpacing: '0.04em',
    padding: '2px 6px', borderRadius: '6px', opacity: '0.9',
  });
  document.body.appendChild(badge);
  document.documentElement.classList.add('env-badge');
  document.title = `[${env.toUpperCase()}] ${document.title}`;
}
