import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Package,
  Settings,
  Folder,
  LogOut,
  Megaphone,
  Image,
  DollarSign,
  Video,
  FileText,
  PackageOpen,
  Building2
} from 'lucide-react';

const mainLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Package, label: 'Products', path: '/dashboard/products' },
  { icon: Folder, label: 'Categories', path: '/dashboard/categories' },
  { icon: Users, label: 'Sellers', path: '/dashboard/sellers' },
  { icon: Users, label: 'Buyers', path: '/dashboard/buyers' },
  { icon: ShoppingBag, label: 'Orders', path: '/dashboard/orders' },
  { icon: PackageOpen, label: 'Returns', path: '/dashboard/returns' },
  { icon: DollarSign, label: 'Withdrawals', path: '/dashboard/withdrawals' },
  { icon: DollarSign, label: 'Payments', path: '/dashboard/payments' },
  { icon: Video, label: 'Streams', path: '/dashboard/streams' },
  { icon: Image, label: 'Banners', path: '/dashboard/banners' },
  { icon: Megaphone, label: 'Announcements', path: '/dashboard/announcements' },
  { icon: FileText, label: 'Resources', path: '/dashboard/resources' },
  { icon: Building2, label: 'Bank Requests', path: '/dashboard/bankrequests' },
];

const bottomLinks = [
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  { icon: LogOut, label: 'Logout', path: '/logout' },
];

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed w-64 bg-card h-[calc(100vh-4rem)] border-r flex flex-col justify-between">
      <nav className="p-4 pt-10 space-y-2 flex-grow overflow-y-auto">
        {mainLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                "hover:bg-secondary hover:text-primary",
                location.pathname === link.path ?
                  "bg-secondary text-primary" :
                  "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <nav className="p-4 space-y-2">
        {bottomLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                "hover:bg-secondary hover:text-primary",
                location.pathname === link.path ?
                  "bg-secondary text-primary" :
                  "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
