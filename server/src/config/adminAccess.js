// Admin team access: which parts of the admin each person can see or change.
//
// Super admins (emails in ADMIN_EMAILS, or anyone given the super role) see
// everything and manage the team. Everyone else is invited with a set of areas,
// each 'view' (read only) or 'manage' (read and change).

const { isAllowedAdminEmail } = require('./admins');

const AREAS = [
  { key: 'dashboard', label: 'Dashboard', hint: 'Platform numbers and the live-selling overview' },
  { key: 'sellers', label: 'Sellers', hint: 'Seller accounts, verification, store details' },
  { key: 'buyers', label: 'Buyers', hint: 'Buyer accounts and their orders' },
  { key: 'orders', label: 'Orders', hint: 'Orders and their delivery' },
  { key: 'products', label: 'Products', hint: 'Listings, disabling products' },
  { key: 'shows', label: 'Live shows', hint: 'Live, scheduled and past shows' },
  { key: 'catalogue', label: 'Categories', hint: 'Categories and AI listing corrections' },
  { key: 'withdrawals', label: 'Withdrawals', hint: 'Seller payouts and bank change requests' },
  { key: 'payments', label: 'Payments', hint: 'Wallet top-ups and money movements' },
  { key: 'wallets', label: 'Wallet changes', hint: 'Add or deduct money from a wallet (manage only)' },
  { key: 'delivery', label: 'Delivery and returns', hint: 'Shipments, pickups, returns and refunds' },
  { key: 'content', label: 'Content', hint: 'Announcements, banners, resources, notifications' },
  { key: 'system', label: 'Logs', hint: 'System and error logs' },
];
const AREA_KEYS = AREAS.map((a) => a.key);
const LEVELS = ['none', 'view', 'manage'];

const all = (level) => Object.fromEntries(AREA_KEYS.map((k) => [k, level]));
const ROLES = [
  { key: 'finance', label: 'Finance', hint: 'Payouts, payments and wallet changes',
    permissions: { ...all('none'), dashboard: 'view', sellers: 'view', buyers: 'view', orders: 'view', withdrawals: 'manage', payments: 'view', wallets: 'manage' } },
  { key: 'operations', label: 'Operations', hint: 'Sellers, orders, shows and delivery',
    permissions: { ...all('none'), dashboard: 'view', sellers: 'manage', buyers: 'manage', orders: 'manage', products: 'manage', shows: 'manage', catalogue: 'manage', delivery: 'manage', content: 'view' } },
  { key: 'support', label: 'Support', hint: 'Look up buyers, sellers and orders',
    permissions: { ...all('none'), dashboard: 'view', sellers: 'view', buyers: 'view', orders: 'view', products: 'view', shows: 'view', delivery: 'view' } },
  { key: 'content', label: 'Content', hint: 'Categories, banners and announcements',
    permissions: { ...all('none'), dashboard: 'view', catalogue: 'manage', content: 'manage', products: 'view' } },
  { key: 'viewer', label: 'View only', hint: 'Can look at everything, change nothing',
    permissions: { ...all('view'), wallets: 'none' } },
];

// Keep only known areas and levels; wallet changes are manage-or-nothing.
function cleanPermissions(input = {}) {
  const out = all('none');
  for (const key of AREA_KEYS) {
    const level = input?.[key];
    if (LEVELS.includes(level)) out[key] = level;
  }
  if (out.wallets === 'view') out.wallets = 'none';
  return out;
}

const permissionsOf = (admin) => {
  const raw = admin?.permissions instanceof Map ? Object.fromEntries(admin.permissions) : admin?.permissions;
  return cleanPermissions(raw || {});
};
const isSuper = (admin) => Boolean(admin) && (isAllowedAdminEmail(admin.email) || admin.role === 'super');
// Who may use the admin at all: super admins, and invited people still active.
const hasAdminAccess = (admin) => Boolean(admin) && admin.active !== false && (isSuper(admin) || admin.invited === true);

function can(admin, area, level = 'view') {
  if (!hasAdminAccess(admin)) return false;
  if (isSuper(admin)) return true;
  if (area === 'team' || area === 'super') return false;
  const have = permissionsOf(admin)[area] || 'none';
  return level === 'view' ? have === 'view' || have === 'manage' : have === 'manage';
}

const accessSummary = (admin) => ({
  super: isSuper(admin),
  permissions: isSuper(admin) ? all('manage') : permissionsOf(admin),
});

// Which area a request belongs to, from its path inside /api/admin or /api/v2/admin.
// Anything not listed here is super-admin only, so a new route is never open by accident.
const V1 = [
  [/^\/(profile|logout)(\/|$)/, 'self'],
  [/^\/team(\/|$)/, 'team'],
  [/^\/(platform-metrics|overview|analytics)(\/|$)/, 'dashboard'],
  [/^\/(sellers|buyers)\/[^/]+\/wallet\/(add|deduct)$/, 'wallets'],
  [/^\/sellers\/[^/]+\/withdrawals(\/|$)/, 'withdrawals'],
  [/^\/sellers(\/|$)/, 'sellers'],
  [/^\/(buyers|users)(\/|$)/, 'buyers'],
  [/^\/(orders|fez-orders)(\/|$)/, 'orders'],
  [/^\/(products|product-blips|unassigned-categories)(\/|$)/, 'products'],
  [/^\/streams(\/|$)/, 'shows'],
  [/^\/(categories|major-categories|listing-corrections)(\/|$)/, 'catalogue'],
  [/^\/(withdrawals|transfers|banks|bank-account|bank-requests)(\/|$)/, 'withdrawals'],
  [/^\/financial(\/|$)/, 'payments'],
  [/^\/(announcements|banners|resources|platform-notifications)(\/|$)/, 'content'],
];
const V2 = [
  [/^\/withdrawals(\/|$)/, 'withdrawals'],
  [/^\/(shipments|webhooks)(\/|$)/, 'delivery'],
  [/^\/errors(\/|$)/, 'system'],
  [/^\/test-email(\/|$)/, 'system'],
  [/^\/sellers(\/|$)/, 'sellers'],
  [/^\/buyers(\/|$)/, 'buyers'],
  [/^\/products(\/|$)/, 'products'],
];
const areaFor = (table, path) => (table.find(([re]) => re.test(path)) || [null, 'super'])[1];
const levelFor = (method, path) => {
  if (method === 'GET' || method === 'HEAD') return 'view';
  if (/\/export$/.test(path)) return 'view';
  return 'manage';
};

// Express middleware: put it after the admin login check.
const enforce = (which = 'v1') => (req, res, next) => {
  const admin = req.admin;
  const path = req.path;
  const area = areaFor(which === 'v2' ? V2 : V1, path);
  if (area === 'self') return next();
  const level = levelFor(req.method, path);
  if (can(admin, area, level)) return next();
  const label = AREAS.find((a) => a.key === area)?.label;
  const message = area === 'team' || area === 'super'
    ? 'Only a super admin can do this.'
    : level === 'manage' && can(admin, area, 'view')
      ? `You can view ${label} but not change it. Ask a super admin for access.`
      : `You don't have access to ${label || 'this'}. Ask a super admin for access.`;
  return res.status(403).json({ success: false, code: 'no_permission', area, message });
};

module.exports = { AREAS, AREA_KEYS, ROLES, cleanPermissions, permissionsOf, isSuper, hasAdminAccess, can, accessSummary, enforce, areaFor, V1, V2 };
