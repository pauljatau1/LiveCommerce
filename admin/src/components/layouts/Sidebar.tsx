import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useSidebar } from '@/context/sidebarContext';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  Building2,
  RotateCcw
} from 'lucide-react';

const mainLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Package, label: 'Products', path: '/dashboard/products' },
  { icon: Folder, label: 'Categories', path: '/dashboard/categories' },
  { icon: Users, label: 'Sellers', path: '/dashboard/sellers' },
  { icon: Users, label: 'Buyers', path: '/dashboard/buyers' },
  { icon: ShoppingBag, label: 'Orders', path: '/dashboard/orders' },
  { icon: PackageOpen, label: 'Returns', path: '/dashboard/returns' },
  { icon: RotateCcw, label: 'Refund Requests', path: '/dashboard/refund-requests' },
  { icon: DollarSign, label: 'Withdrawals', path: '/dashboard/withdrawals' },
  { icon: DollarSign, label: 'Payments', path: '/dashboard/payments' },
  { icon: Video, label: 'Streams', path: '/dashboard/streams' },
  { icon: Image, label: 'Banners', path: '/dashboard/banners' },
  { icon: Megaphone, label: 'Announcements', path: '/dashboard/announcements' },
  { icon: FileText, label: 'Resources', path: '/dashboard/resources' },
  { icon: FileText, label: 'Return Requests', path: '/dashboard/return-requests' },
  { icon: Building2, label: 'Bank Requests', path: '/dashboard/bankrequests' },
];

const bottomLinks = [
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  { icon: LogOut, label: 'Logout', path: '/logout' },
];

function Sidebar() {
  const location = useLocation();
  const { isOpen, close } = useSidebar();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={close}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed z-50 bg-card h-[calc(100vh-4rem)] border-r flex flex-col justify-between transition-all duration-300",
          "md:w-64 md:translate-x-0 md:z-30",
          isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 md:hidden">
          <h2 className="font-bold text-primary">Menu</h2>
          <Button variant="ghost" size="icon" onClick={close}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="p-4 pt-6 md:pt-10 space-y-2 flex-grow overflow-y-auto">
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
                onClick={() => {
                  if (window.innerWidth < 768) {
                    close();
                  }
                }}
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
                onClick={() => {
                  if (window.innerWidth < 768) {
                    close();
                  }
                }}
              >
                <Icon className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
