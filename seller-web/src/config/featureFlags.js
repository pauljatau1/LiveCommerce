// Classic UI remains available for rollback; default to the studio everywhere.
export const classicDashboardEnabled = (env = import.meta.env || {}) => /^(true|1)$/i.test(env.VITE_CLASSIC_DASHBOARD || '');
export const CLASSIC_DASHBOARD = classicDashboardEnabled();
export const studioDestination = (pathname = '') => {
  const section = pathname.replace(/^\/dashboard\/?/, '').split('/')[0];
  return ({ products: '/studio/products', orders: '/studio/orders', 'earnings-payouts': '/studio/money', settings: '/studio/me', 'live-streams': '/studio/shows' })[section] || '/studio';
};
export const safeStudioReturn = (path) => typeof path === 'string' && /^\/studio(?:[/?#]|$)/.test(path) ? path : '/studio';
