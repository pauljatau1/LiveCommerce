import { 
    Users, 
    ShoppingCart, 
    DollarSign, 
    ArrowUp, 
    ArrowDown,
    ArrowUpRight,
    Store,
    Package,
    RefreshCcw,
    Building2,
    Clock,
    TrendingUp,
    RotateCcw,
    Wallet,
    Video,
    CircleDollarSign,
    Settings,
    LineChart,
    Mail,
    Shield,
    LayoutDashboard,

    Banknote
  } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";

import { useEffect, useState } from "react";
import { api } from "@/api/axios";

// Define interface for the API response
interface PlatformMetrics {
  counts: {
    buyers: number;
    sellers: number;
    products: number;
    orders: number;
    streams: number;
    transactions: number;
    withdrawals: number;
    bankChangeRequests: number;
  };
  userMetrics: {
    activeBuyers: number;
    inactiveBuyers: number;
    activeSellers: number;
    inactiveSellers: number;
    verifiedSellers: number;
    pendingVerificationSellers: number;
    identityVerifiedBuyers: number;
    buyerVerificationRate: string;
    sellerVerificationRate: string;
  };
  orderMetrics: {
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    ordersWithReturns: number;
    ordersWithDisputes: number;
  };
  withdrawalMetrics: {
    pendingWithdrawals: number;
    processingWithdrawals: number;
    completedWithdrawals: number;
    rejectedWithdrawals: number;
    pendingWithdrawalRate: string;
  };
  bankChangeMetrics: {
    pendingBankChangeRequests: number;
    approvedBankChangeRequests: number;
    rejectedBankChangeRequests: number;
    pendingBankChangeRate: string;
  };
  streamMetrics: {
    scheduledStreams: number;
    liveStreams: number;
    endedStreams: number;
    cancelledStreams: number;
    cancelledStreamRate: string;
  };
  financialMetrics: {
    totalOrderAmount: number;
    totalWithdrawalAmount: number;
  };
  recentActivity: {
    orders: Array<{
      _id: string;
      order_id: string;
      totalAmount: number;
      createdAt: string;
    }>;
    withdrawals: Array<{
      _id: string;
      seller: string;
      amount: number;
      status: string;
      requestDate: string;
      reference: string;
    }>;
    bankChangeRequests: Array<{
      _id: string;
      seller: string;
      status: string;
      requestDate: string;
      newBankDetails: {
        bankName: string;
      };
    }>;
    streams: Array<{
      _id: string;
      seller: string;
      title: string;
      status: string;
      scheduledStartTime: string;
      actualStartTime: string;
    }>;
  };
  extra: {
    topPerformers: Array<{
      _id: {
        storeAvatar?: {
          url: string;
        };
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        storeName?: string;
        businessName?: string;
      };
      totalRevenue: number;
      totalOrders: number;
    }>;
    topProducts: Array<{
      _id: {
        _id: string;
        name: string;
        price: number;
        category: string;
        seller: {
          storeName: string;
        };
        images: Array<{ url: string }>;
      };
      totalSold: number;
      totalRevenue: number;
    }>;
    topBuyers: Array<{
      _id: {
        avatar?: { url: string };
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
      totalSpent: number;
      orderCount: number;
    }>;
    topCategories: Array<{
      _id: string;
      count: number;
    }>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/admin/platform-metrics');
        setMetrics(response.data.data);
      } catch (error) {
        console.error('Error fetching platform metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  return (
    <div className="space-y-6 p-4">
     

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            <Card className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="bg-primary/10 p-2 md:p-3 rounded-lg">
                  <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs md:text-sm">Total Orders</p>
                  <h3 className="text-xl md:text-2xl font-bold">{metrics?.counts.orders}</h3>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="bg-primary/10 p-2 md:p-3 rounded-lg">
                  <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs md:text-sm">Total Revenue</p>
                  <h3 className="text-xl md:text-2xl font-bold">{formatCurrency(metrics?.financialMetrics.totalOrderAmount || 0)}</h3>
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="bg-primary/10 p-2 md:p-3 rounded-lg">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs md:text-sm">Total Users</p>
                  <h3 className="text-xl md:text-2xl font-bold">{(metrics?.counts.buyers || 0) + (metrics?.counts.sellers || 0)}</h3>
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="bg-primary/10 p-2 md:p-3 rounded-lg">
                  <Package className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs md:text-sm">Total Products</p>
                  <h3 className="text-xl md:text-2xl font-bold">{metrics?.counts.products}</h3>
                </div>
              </div>
            </Card>
          </div>

          {/* Navigation Section */}
          <Card className="p-4 md:p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Navigation</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <Link to="/dashboard/orders">
                <Card className="p-4 hover:bg-gray-800 transition-colors cursor-pointer h-full">
                  <div className="flex flex-col items-center justify-center text-center h-full">
                    <ShoppingCart className="h-8 w-8 mb-2 text-primary" />
                    <span className="text-sm font-medium">Orders</span>
                  </div>
                </Card>
              </Link>
              
              <Link to="/dashboard/products">
                <Card className="p-4 hover:bg-gray-800 transition-colors cursor-pointer h-full">
                  <div className="flex flex-col items-center justify-center text-center h-full">
                    <Package className="h-8 w-8 mb-2 text-green-500" />
                    <span className="text-sm font-medium">Products</span>
                  </div>
                </Card>
              </Link>
              
              <Link to="/dashboard/buyers">
                <Card className="p-4 hover:bg-gray-800 transition-colors cursor-pointer h-full">
                  <div className="flex flex-col items-center justify-center text-center h-full">
                    <Users className="h-8 w-8 mb-2 text-blue-500" />
                    <span className="text-sm font-medium">Buyers</span>
                  </div>
                </Card>
              </Link>
              
              <Link to="/dashboard/sellers">
                <Card className="p-4 hover:bg-gray-800 transition-colors cursor-pointer h-full">
                  <div className="flex flex-col items-center justify-center text-center h-full">
                    <Store className="h-8 w-8 mb-2 text-purple-500" />
                    <span className="text-sm font-medium">Sellers</span>
                  </div>
                </Card>
              </Link>
              
              <Link to="/dashboard/streams">
                <Card className="p-4 hover:bg-gray-800 transition-colors cursor-pointer h-full">
                  <div className="flex flex-col items-center justify-center text-center h-full">
                    <Video className="h-8 w-8 mb-2 text-red-500" />
                    <span className="text-sm font-medium">Streams</span>
                  </div>
                </Card>
              </Link>
              
              <Link to="/dashboard/withdrawals">
                <Card className="p-4 hover:bg-gray-800 transition-colors cursor-pointer h-full">
                  <div className="flex flex-col items-center justify-center text-center h-full">
                    <Wallet className="h-8 w-8 mb-2 text-amber-500" />
                    <span className="text-sm font-medium">Withdrawals</span>
                  </div>
                </Card>
              </Link>
              
              <Link to="/dashboard/payments">
                <Card className="p-4 hover:bg-gray-800 transition-colors cursor-pointer h-full">
                  <div className="flex flex-col items-center justify-center text-center h-full">
                    <CircleDollarSign className="h-8 w-8 mb-2 text-emerald-500" />
                    <span className="text-sm font-medium">Payments</span>
                  </div>
                </Card>
              </Link>
              
              <Link to="/dashboard/bankrequests">
                <Card className="p-4 hover:bg-gray-800 transition-colors cursor-pointer h-full">
                  <div className="flex flex-col items-center justify-center text-center h-full">
                    <Banknote className="h-8 w-8 mb-2 text-gray-400" />
                    <span className="text-sm font-medium">Bank Requests</span>
                  </div>
                </Card>
              </Link>
            </div>
          </Card>

          {/* Business Overview */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Orders Stats */}
            <Card className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h3 className="text-lg font-semibold text-white">Orders Overview</h3>
                <Link to="/dashboard/orders">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">View All Orders</Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 md:p-4 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
                    <p className="text-xs md:text-sm text-muted-foreground">Pending Orders</p>
                  </div>
                  <p className="text-lg md:text-xl font-bold mt-2">{metrics?.orderMetrics.pendingOrders}</p>
                </div>

                <div className="p-3 md:p-4 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                    <p className="text-xs md:text-sm text-muted-foreground">Processing Orders</p>
                  </div>
                  <p className="text-lg md:text-xl font-bold mt-2">{metrics?.orderMetrics.processingOrders}</p>
                </div>

                <div className="p-3 md:p-4 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <RefreshCcw className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
                    <p className="text-xs md:text-sm text-muted-foreground">Orders With Returns</p>
                  </div>
                  <p className="text-lg md:text-xl font-bold mt-2">{metrics?.orderMetrics.ordersWithReturns}</p>
                </div>

                <div className="p-3 md:p-4 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
                    <p className="text-xs md:text-sm text-muted-foreground">Delivered Orders</p>
                  </div>
                  <p className="text-lg md:text-xl font-bold mt-2">{metrics?.orderMetrics.deliveredOrders}</p>
                </div>
              </div>
            </Card>

            {/* User Stats */}
            <Card className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h3 className="text-lg font-semibold text-white">User Overview</h3>
                <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                  <Link to="/dashboard/buyers" className="w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="w-full">Buyers</Button>
                  </Link>
                  <Link to="/dashboard/sellers" className="w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="w-full">Sellers</Button>
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 md:p-4 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                    <p className="text-xs md:text-sm text-muted-foreground">Active Buyers</p>
                  </div>
                  <p className="text-lg md:text-xl font-bold mt-2">{metrics?.userMetrics.activeBuyers}</p>
                </div>

                <div className="p-3 md:p-4 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 md:h-5 md:w-5 text-indigo-500" />
                    <p className="text-xs md:text-sm text-muted-foreground">Active Sellers</p>
                  </div>
                  <p className="text-lg md:text-xl font-bold mt-2">{metrics?.userMetrics.activeSellers}</p>
                </div>

                <div className="p-3 md:p-4 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-cyan-500" />
                    <p className="text-xs md:text-sm text-muted-foreground">Verified Sellers</p>
                  </div>
                  <p className="text-lg md:text-xl font-bold mt-2">{metrics?.userMetrics.verifiedSellers}</p>
                </div>

                <div className="p-3 md:p-4 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 md:h-5 md:w-5 text-pink-500" />
                    <p className="text-xs md:text-sm text-muted-foreground">Pending Verifications</p>
                  </div>
                  <p className="text-lg md:text-xl font-bold mt-2">{metrics?.userMetrics.pendingVerificationSellers}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Financial Stats */}
            <Card className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h3 className="text-lg font-semibold text-white">Financial Overview</h3>
                <Link to="/dashboard/payments">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">View All</Button>
                </Link>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ArrowUp className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                    <span className="text-xs md:text-sm">Total Order Amount</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold">{formatCurrency(metrics?.financialMetrics.totalOrderAmount || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
                    <span className="text-xs md:text-sm">Total Withdrawal Amount</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold">{formatCurrency(metrics?.financialMetrics.totalWithdrawalAmount || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                    <span className="text-xs md:text-sm">Net Balance</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold">
                    {formatCurrency((metrics?.financialMetrics.totalOrderAmount || 0) - (metrics?.financialMetrics.totalWithdrawalAmount || 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CircleDollarSign className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
                    <span className="text-xs md:text-sm">Pending Withdrawals</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold">{metrics?.withdrawalMetrics.pendingWithdrawals}</span>
                </div>
              </div>
            </Card>

            {/* Withdrawals Stats */}
            <Card className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h3 className="text-lg font-semibold text-white">Withdrawal Status</h3>
                <Link to="/dashboard/withdrawals">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">View All</Button>
                </Link>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    <span className="text-xs md:text-sm">Pending</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold">{metrics?.withdrawalMetrics.pendingWithdrawals}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <RefreshCcw className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                    <span className="text-xs md:text-sm">Processing</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold">{metrics?.withdrawalMetrics.processingWithdrawals}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ArrowUp className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                    <span className="text-xs md:text-sm">Completed</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold">{metrics?.withdrawalMetrics.completedWithdrawals}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
                    <span className="text-xs md:text-sm">Rejected</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold">{metrics?.withdrawalMetrics.rejectedWithdrawals}</span>
                </div>
              </div>
            </Card>

            {/* Live Streams Stats */}
            <Card className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h3 className="text-lg font-semibold text-white">Live Streams</h3>
                <Link to="/dashboard/streams">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">View All</Button>
                </Link>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    <span className="text-xs md:text-sm">Total Streams</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold">
                    {metrics?.counts.streams}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                    <span className="text-xs md:text-sm">Live Streams</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold">
                    {metrics?.streamMetrics.liveStreams}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                    <span className="text-xs md:text-sm">Scheduled</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold">
                    {metrics?.streamMetrics.scheduledStreams}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
                    <span className="text-xs md:text-sm">Cancelled</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold">
                    {metrics?.streamMetrics.cancelledStreams}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Bank Change Requests */}
          <Card className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <h3 className="text-lg font-semibold text-white">Bank Change Requests</h3>
              <Link to="/dashboard/bankrequests">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">View All</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 md:p-4 bg-gray-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
                  <span className="text-xs md:text-sm">Pending Requests</span>
                </div>
                <p className="text-lg md:text-xl font-bold mt-2">{metrics?.bankChangeMetrics.pendingBankChangeRequests}</p>
              </div>

              <div className="p-3 md:p-4 bg-gray-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <ArrowUp className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                  <span className="text-xs md:text-sm">Approved Requests</span>
                </div>
                <p className="text-lg md:text-xl font-bold mt-2">{metrics?.bankChangeMetrics.approvedBankChangeRequests}</p>
              </div>

              <div className="p-3 md:p-4 bg-gray-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
                  <span className="text-xs md:text-sm">Rejected Requests</span>
                </div>
                <p className="text-lg md:text-xl font-bold mt-2">{metrics?.bankChangeMetrics.rejectedBankChangeRequests}</p>
              </div>
            </div>
          </Card>

          {/* Top Performers, Products, Buyers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {/* Top Performing Sellers */}
            <Card className="p-4 md:p-6 h-full flex flex-col justify-between">
              <h3 className="text-lg font-semibold text-white mb-4">Top Performing Sellers</h3>
              <div className="flex-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seller</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Orders</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics?.extra.topPerformers?.slice(0, 5)
                      .map((seller) => (
                        <TableRow key={seller._id._id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={seller._id.storeAvatar?.url} />
                                <AvatarFallback>{seller._id.firstName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs">{seller._id.storeName || `${seller._id.firstName} ${seller._id.lastName}`}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{formatCurrency(seller.totalRevenue)}</TableCell>
                          <TableCell className="text-xs">{seller.totalOrders}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Top Products */}
            <Card className="p-4 md:p-6 h-full flex flex-col justify-between">
              <h3 className="text-lg font-semibold text-white mb-4">Top Products</h3>
              <div className="flex-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Units Sold</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics?.extra.topProducts?.slice(0, 5)
                      ?.filter(product => product && product._id && Array.isArray(product._id.images))
                      .map((product) => (
                        <TableRow key={product._id._id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 rounded-none">
                                <AvatarImage src={product._id?.images?.[0]?.url || undefined} />
                                <AvatarFallback>P</AvatarFallback>
                              </Avatar>
                              <span className="text-xs">{product._id?.name || "Unknown"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{product.totalSold}</TableCell>
                          <TableCell className="text-xs">{formatCurrency(product.totalRevenue)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Top Buyers */}
            <Card className="p-4 md:p-6 h-full flex flex-col justify-between">
              <h3 className="text-lg font-semibold text-white mb-4">Top Buyers</h3>
              <div className="flex-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Orders</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics?.extra?.topBuyers?.slice(0, 5).map((buyer) => (
                      <TableRow key={buyer?._id?._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={buyer?._id?.avatar?.url} />
                              <AvatarFallback>{buyer?._id?.firstName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{`${buyer?._id?.firstName} ${buyer?._id?.lastName}`}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{formatCurrency(buyer.totalSpent)}</TableCell>
                        <TableCell className="text-xs">{buyer.orderCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;