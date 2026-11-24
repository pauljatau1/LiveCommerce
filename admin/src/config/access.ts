import { useAuth } from '@/context/authContext';

export type Level = 'none' | 'view' | 'manage';
export interface Access { super: boolean; permissions: Record<string, Level> }

// Which access area each admin page belongs to (mirrors server/src/config/adminAccess.js)
const PAGE_AREAS: [RegExp, string][] = [
  [/^\/dashboard\/team/, 'team'],
  [/^\/dashboard\/(sellers|seller-detail)/, 'sellers'],
  [/^\/dashboard\/(buyers|buyer-detail)/, 'buyers'],
  [/^\/dashboard\/(orders|order-detail)/, 'orders'],
  [/^\/dashboard\/(products|blips)/, 'products'],
  [/^\/dashboard\/streams/, 'shows'],
  [/^\/dashboard\/(categories|major-categories|listing-corrections)/, 'catalogue'],
  [/^\/dashboard\/(withdrawals|bankrequests)/, 'withdrawals'],
  [/^\/dashboard\/payments/, 'payments'],
  [/^\/dashboard\/(returns|return-detail|return-requests|refund-requests|pickup-requests|terminal-shipments)/, 'delivery'],
  [/^\/dashboard\/(announcements|resources|banners|buyer-notifications)/, 'content'],
  [/^\/dashboard\/(system-logs|error-logs)/, 'system'],
  [/^\/dashboard\/?$/, 'dashboard'],
];
export const areaForPath = (path: string) => (PAGE_AREAS.find(([re]) => re.test(path)) || [null, 'dashboard'])[1];

export const AREA_LABELS: Record<string, string> = {
  dashboard: 'the dashboard', sellers: 'Sellers', buyers: 'Buyers', orders: 'Orders', products: 'Products', shows: 'Live shows',
  catalogue: 'Categories', withdrawals: 'Withdrawals', payments: 'Payments', wallets: 'Wallet changes',
  delivery: 'Delivery and returns', content: 'Content', system: 'Logs', team: 'the team',
};

export function canDo(access: Access | undefined, area: string, level: 'view' | 'manage' = 'view') {
  if (!access) return false;
  if (access.super) return true;
  if (area === 'team') return false;
  const have = access.permissions?.[area] || 'none';
  return level === 'view' ? have !== 'none' : have === 'manage';
}

export function useAccess() {
  const { user } = useAuth();
  const access = user?.access;
  return {
    access,
    isSuper: Boolean(access?.super),
    can: (area: string, level: 'view' | 'manage' = 'view') => canDo(access, area, level),
  };
}
