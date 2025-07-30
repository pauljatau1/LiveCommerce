import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useSidebar } from '@/context/sidebarContext';
import { useAuth } from '@/context/authContext';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { api } from '@/api/axios';
import { Badge } from '@/components/ui/badge';

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
  RotateCcw,
  Truck,
  TruckIcon,
  Bell,
  MessageSquare,
  BoltIcon,
  Zap,
  FolderTree,
  Terminal,
  AlertTriangle
} from 'lucide-react';

// Interface for simplified seller data
interface SimpleSeller {
  _id: string;
  isVerified: boolean;
}

// Interface for simplified refund request data
interface SimpleRefundRequest {
  refundRequest: {
    status: string;
  }
}

// Interface for simplified withdrawal data
interface SimpleWithdrawal {
  status: string;
}

// Interface for simplified bank request stats
interface BankRequestStats {
  pending: number;
}

const mainLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Package, label: 'Products', path: '/dashboard/products' },
  { icon: Zap, label: 'Blips', path: '/dashboard/blips' },
  { icon: FolderTree, label: 'Major Categories', path: '/dashboard/major-categories' },
  { icon: Folder, label: 'Categories', path: '/dashboard/categories' },
  { icon: Users, label: 'Sellers', path: '/dashboard/sellers', showPendingCount: true },
  { icon: Users, label: 'Buyers', path: '/dashboard/buyers' },
  { icon: Bell, label: 'Buyer Notif.', path: '/dashboard/buyer-notifications' },
  { icon: ShoppingBag, label: 'Orders', path: '/dashboard/orders' },
  { icon: PackageOpen, label: 'Returns', path: '/dashboard/returns' },
  { icon: RotateCcw, label: 'Refund Req', path: '/dashboard/refund-requests', showPendingCount: true },
  { icon: Truck, label: 'Pickup Requests', path: '/dashboard/pickup-requests' },
  { icon: Terminal, label: 'Terminal Shipments', path: '/dashboard/terminal-shipments' },
  { icon: DollarSign, label: 'Withdrawals', path: '/dashboard/withdrawals', showPendingCount: true },
  { icon: DollarSign, label: 'Payments', path: '/dashboard/payments' },
  { icon: Video, label: 'Streams', path: '/dashboard/streams' },
  { icon: Image, label: 'Banners', path: '/dashboard/banners' },
  { icon: Megaphone, label: 'Announcements', path: '/dashboard/announcements' },
  { icon: FileText, label: 'Resources', path: '/dashboard/resources' },
  { icon: FileText, label: 'Return Requests', path: '/dashboard/return-requests' },
  { icon: Building2, label: 'Bank Requests', path: '/dashboard/bankrequests', showPendingCount: true },
  { icon: AlertTriangle, label: 'System Logs', path: '/dashboard/error-logs' },
];



function Sidebar() {
  const location = useLocation();
  const { isOpen, close } = useSidebar();
  const { logout } = useAuth();
  const [pendingSellersCount, setPendingSellersCount] = useState(0);
  const [pendingRefundsCount, setPendingRefundsCount] = useState(0);
  const [pendingWithdrawalsCount, setPendingWithdrawalsCount] = useState(0);
  const [pendingBankRequestsCount, setPendingBankRequestsCount] = useState(0);
  const [pendingPickupRequestsCount, setPendingPickupRequestsCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPendingCounts();
  }, []);

  const fetchPendingCounts = async () => {
    try {
      setLoading(true);
      
      // Fetch pending sellers
      const sellersResponse = await api.get("/api/admin/sellers");
      let sellers: SimpleSeller[] = [];
      if (Array.isArray(sellersResponse.data.sellers)) {
        sellers = sellersResponse.data.sellers;
      } else if (Array.isArray(sellersResponse.data)) {
        sellers = sellersResponse.data;
      }
      const pendingSellers = sellers.filter(seller => !seller.isVerified).length;
      setPendingSellersCount(pendingSellers);
      
      // Fetch pending refund requests
      const refundsResponse = await api.get("/api/order/refund-requests");
      const refundRequests = refundsResponse.data.refundRequests as SimpleRefundRequest[];
      const pendingRefunds = refundRequests.filter(req => req.refundRequest.status === "pending").length;
      setPendingRefundsCount(pendingRefunds);
      
      // Fetch pending withdrawals
      const withdrawalsResponse = await api.get("/api/admin/withdrawals");
      const withdrawals = withdrawalsResponse.data as SimpleWithdrawal[];
      const pendingWithdrawals = withdrawals.filter(withdrawal => withdrawal.status === "pending").length;
      setPendingWithdrawalsCount(pendingWithdrawals);
      
      // Fetch pending bank requests
      const bankRequestsResponse = await api.get("/api/admin/bank-requests/stats");
      const bankRequestStats = bankRequestsResponse.data.data as BankRequestStats;
      setPendingBankRequestsCount(bankRequestStats.pending);

      // Fetch pending pickup requests
      const pickupRequestsResponse = await api.get("/api/pickup");
      const pickupRequests = pickupRequestsResponse.data.data.pickupRequests || [];
      const pendingPickup = pickupRequests.filter((req: any) => req.status === "pending").length;
      setPendingPickupRequestsCount(pendingPickup);
      
    } catch (err) {
      console.error("Error fetching pending counts:", err);
    } finally {
      setLoading(false);
    }
  };

  const getPendingCount = (path: string) => {
    if (path === '/dashboard/sellers') return pendingSellersCount;
    if (path === '/dashboard/refund-requests') return pendingRefundsCount;
    if (path === '/dashboard/withdrawals') return pendingWithdrawalsCount;
    if (path === '/dashboard/bankrequests') return pendingBankRequestsCount;
    if (path === '/dashboard/pickup-requests') return pendingPickupRequestsCount;
    return 0;
  };

  const getPendingDot = (path: string) => {
    if (path === '/dashboard/sellers') return pendingSellersCount > 0;
    if (path === '/dashboard/refund-requests') return pendingRefundsCount > 0;
    if (path === '/dashboard/withdrawals') return pendingWithdrawalsCount > 0;
    if (path === '/dashboard/bankrequests') return pendingBankRequestsCount > 0;
    if (path === '/dashboard/pickup-requests') return pendingPickupRequestsCount > 0;
    return false;
  };

  const handleLogout = (e: React.MouseEvent, path: string) => {
    if (path === '/logout') {
      e.preventDefault();
      logout();
    }
    
    if (window.innerWidth < 768) {
      close();
    }
  };

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
            // const pendingCount = link.showPendingCount ? getPendingCount(link.path) : 0;
            const showPendingDot = getPendingDot(link.path);
            
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg transition-colors",
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
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </div>
                {/* Pending Dot */}
                {showPendingDot && (
                  <span className="ml-2 relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400"></span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        {/* <nav className="p-4 space-y-2">
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
                onClick={(e) => handleLogout(e, link.path)}
              >
                <Icon className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav> */}
      </aside>
    </>
  );
}

export default Sidebar;
