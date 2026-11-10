import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useSidebar } from '@/context/sidebarContext';
import { useAuth } from '@/context/authContext';
import { X, ChevronDown, ChevronRight, LayoutDashboard, Users, ShoppingBag, Package, Folder, LogOut, Megaphone, Image, DollarSign, Video, FileText, PackageOpen, Building2, RotateCcw, Truck, Bell, AlertTriangle, Terminal, FolderTree, Zap, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { api } from '@/api/axios';

// Interfaces
interface SimpleSeller {
  _id: string;
  isVerified: boolean;
}

interface SimpleRefundRequest {
  refundRequest: {
    status: string;
  }
}

interface SimpleWithdrawal {
  status: string;
}

interface BankRequestStats {
  pending: number;
}

// Navigation Groups
const navGroups = [
  {
    title: "Intelligence",
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    ]
  },
  {
    title: "Marketplace OS",
    items: [
      { icon: Package, label: 'Inventory', path: '/dashboard/products' },
      { icon: Package, label: 'Listing AI corrections', path: '/dashboard/listing-corrections' },
      { icon: Zap, label: 'Blips', path: '/dashboard/blips' },
      { icon: FolderTree, label: 'Major Cat', path: '/dashboard/major-categories' },
      { icon: Folder, label: 'Categories', path: '/dashboard/categories' },
      { icon: Video, label: 'Direct Streams', path: '/dashboard/streams' },
      { icon: Image, label: 'Display Banners', path: '/dashboard/banners' },
      { icon: Megaphone, label: 'Global Alerts', path: '/dashboard/announcements' },
    ]
  },
  {
    title: "User Management",
    items: [
      { icon: Users, label: 'Sellers', path: '/dashboard/sellers', showPendingCount: true },
      { icon: Users, label: 'Buyers', path: '/dashboard/buyers' },
      { icon: Bell, label: 'Buyer Comms', path: '/dashboard/buyer-notifications' },
    ]
  },
  {
    title: "Fulfillment & Supply",
    items: [
      { icon: ShoppingBag, label: 'Active Orders', path: '/dashboard/orders' },
      { icon: PackageOpen, label: 'Reverse Logistics', path: '/dashboard/returns' },
      { icon: FileText, label: 'Dispute Cases', path: '/dashboard/return-requests' },
      { icon: Truck, label: 'Carrier Pickup', path: '/dashboard/pickup-requests' },
      { icon: Terminal, label: 'Shipment Hub', path: '/dashboard/terminal-shipments' },
    ]
  },
  {
    title: "Financial Engine",
    items: [
      { icon: DollarSign, label: 'Payouts', path: '/dashboard/withdrawals', showPendingCount: true },
      { icon: DollarSign, label: 'Payment Ledger', path: '/dashboard/payments' },
      { icon: RotateCcw, label: 'Refund Processing', path: '/dashboard/refund-requests', showPendingCount: true },
      { icon: Building2, label: 'Vault Access', path: '/dashboard/bankrequests', showPendingCount: true },
    ]
  },
  {
    title: "Core Infrastructure",
    items: [
      { icon: FileText, label: 'Documentation', path: '/dashboard/resources' },
      { icon: AlertTriangle, label: 'Security Logs', path: '/dashboard/error-logs' },
    ]
  }
];

function Sidebar() {
  const location = useLocation();
  const { isOpen, close } = useSidebar();
  const { logout } = useAuth();

  // Pending counts state
  const [pendingSellersCount, setPendingSellersCount] = useState(0);
  const [pendingRefundsCount, setPendingRefundsCount] = useState(0);
  const [pendingWithdrawalsCount, setPendingWithdrawalsCount] = useState(0);
  const [pendingBankRequestsCount, setPendingBankRequestsCount] = useState(0);
  const [pendingPickupRequestsCount, setPendingPickupRequestsCount] = useState(0);

  // Expanded groups state
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Intelligence": true,
    "Marketplace OS": true,
    "User Management": true,
    "Fulfillment & Supply": true,
    "Financial Engine": true,
    "Core Infrastructure": true
  });

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  useEffect(() => {
    fetchPendingCounts();
  }, []);

  const fetchPendingCounts = async () => {
    try {
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
      const refundRequests = (refundsResponse.data.refundRequests || []) as SimpleRefundRequest[];
      const pendingRefunds = refundRequests.filter(req => req.refundRequest.status === "pending").length;
      setPendingRefundsCount(pendingRefunds);

      // Fetch pending withdrawals
      const withdrawalsResponse = await api.get("/api/admin/withdrawals");
      const withdrawals = (withdrawalsResponse.data || []) as SimpleWithdrawal[];
      const pendingWithdrawals = withdrawals.filter(withdrawal => withdrawal.status === "pending").length;
      setPendingWithdrawalsCount(pendingWithdrawals);

      // Fetch pending bank requests
      const bankRequestsResponse = await api.get("/api/admin/bank-requests/stats");
      const bankRequestStats = bankRequestsResponse.data.data as BankRequestStats;
      setPendingBankRequestsCount(bankRequestStats.pending);

      // Fetch pending pickup requests
      const pickupRequestsResponse = await api.get("/api/pickup");
      const pickupRequests = pickupRequestsResponse.data.data?.pickupRequests || [];
      const pendingPickup = pickupRequests.filter((req: any) => req.status === "pending").length;
      setPendingPickupRequestsCount(pendingPickup);

    } catch (err) {
      console.error("Error fetching pending counts:", err);
    }
  };

  const getPendingCountValue = (path: string) => {
    if (path === '/dashboard/sellers') return pendingSellersCount;
    if (path === '/dashboard/refund-requests') return pendingRefundsCount;
    if (path === '/dashboard/withdrawals') return pendingWithdrawalsCount;
    if (path === '/dashboard/bankrequests') return pendingBankRequestsCount;
    if (path === '/dashboard/pickup-requests') return pendingPickupRequestsCount;
    return 0;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={close}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed z-50 bg-[#020617] h-screen border-r border-slate-800/60 flex flex-col transition-all duration-500 ease-in-out shadow-2xl overflow-hidden",
          "md:w-64 md:translate-x-0 md:z-30",
          isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full"
        )}
      >
        {/* Subtle Decorative Gradient */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

        {/* Sidebar Header Space (Mobile Close Only) */}
        <div className="flex md:hidden items-center justify-between p-4 border-b border-slate-800/60 bg-slate-950/20">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">TERMINAL ACCESS</span>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white" onClick={close}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Info */}
        <div className="p-4 pt-6 flex-grow overflow-y-auto overflow-x-hidden scrollbar-none hover:scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <div className="space-y-8">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-2">
                <div
                  className="flex items-center justify-between px-3 py-1 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] cursor-pointer hover:text-slate-300 transition-all group/header"
                  onClick={() => toggleGroup(group.title)}
                >
                  <span className="group-hover/header:translate-x-1 transition-transform">{group.title}</span>
                  {expandedGroups[group.title] ? <ChevronDown className="h-3 w-3 opacity-50 group-hover/header:opacity-100 transition-opacity" /> : <ChevronRight className="h-3 w-3 opacity-50 group-hover/header:opacity-100 transition-opacity" />}
                </div>

                {expandedGroups[group.title] && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
                    {group.items.map((link) => {
                      const Icon = link.icon;
                      const pendingCount = getPendingCountValue(link.path);
                      const isActive = location.pathname === link.path;

                      return (
                        <Link
                          key={link.path}
                          to={link.path}
                          className={cn(
                            "group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 text-xs relative",
                            isActive ?
                              "bg-blue-600/10 text-blue-400 font-bold border border-blue-500/20" :
                              "text-slate-400 hover:bg-slate-800/40 hover:text-white border border-transparent"
                          )}
                          onClick={() => {
                            if (window.innerWidth < 768) {
                              close();
                            }
                          }}
                        >
                          {/* Active Indicator Tip */}
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-500 rounded-r-full" />
                          )}

                          <div className="flex items-center space-x-3">
                            <Icon className={cn("h-4 w-4 transition-transform duration-300 group-hover:scale-110", isActive ? "text-blue-400" : "text-slate-500 group-hover:text-blue-400")} />
                            <span className="tracking-tight">{link.label}</span>
                          </div>

                          {/* Pending Indicator Badge */}
                          {pendingCount > 0 && (
                            <div className={cn(
                              "flex items-center justify-center px-1.5 py-0.5 rounded-lg text-[9px] font-black border transition-all duration-300",
                              isActive ? "bg-blue-500 text-white border-blue-400" : "bg-blue-500/10 text-blue-400 border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white"
                            )}>
                              {pendingCount > 99 ? '99+' : pendingCount}
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Global Control Bar (Logout/Signout) */}
        <div className="p-3 border-t border-slate-800/60 bg-slate-950/40 mt-auto pb-12">
          <Button
            variant="ghost"
            className="w-full justify-between h-11 rounded-xl bg-slate-900 shadow-inner group transition-all hover:bg-rose-500/10 border border-slate-800/50 hover:border-rose-500/20"
            onClick={logout}
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-rose-500 group-hover:text-white transition-all duration-500">
                <LogOut className="h-4 w-4" />
              </div>
              <div className="flex flex-col items-start gap-0">
                <span className="text-xs font-bold text-slate-300 group-hover:text-rose-400">Terminate</span>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-tight">Session</span>
              </div>
            </div>
            <ChevronLeft className="h-4 w-4 text-slate-700 group-hover:text-rose-500 transition-all opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0" />
          </Button>
        </div>

        {/* Status Indicator */}
        <div className="px-5 py-2 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.2em] text-slate-600 bg-slate-950/40">
          <div className="flex items-center gap-1.5">
            <div className="h-1 w-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span>Core v2.4.0</span>
          </div>
          <span className="opacity-50 tracking-tighter font-mono">200ms</span>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
