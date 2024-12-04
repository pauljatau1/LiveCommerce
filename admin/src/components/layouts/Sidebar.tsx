import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Package, 
  Settings 
} from 'lucide-react';

const sidebarLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Buyers', path: '/dashboard/buyers' },
  { icon: Users, label: 'Sellers', path: '/dashboard/sellers' },
  { icon: ShoppingBag, label: 'Orders', path: '/dashboard/orders' },
  { icon: Package, label: 'Products', path: '/dashboard/products' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-card h-[calc(100vh-4rem)] border-r">
      <nav className="p-4 space-y-2">
        {sidebarLinks.map((link) => {
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
