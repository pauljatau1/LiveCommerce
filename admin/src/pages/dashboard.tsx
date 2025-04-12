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
    CircleDollarSign
  } from "lucide-react";
  import { Card } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
import { useAuth } from "@/context/authContext";
import { useEffect, useState, useMemo } from "react";
import { api } from "@/api/axios";
import { Link } from "react-router-dom";

// Define interfaces for API responses
interface OrdersResponse {
  orders: Array<{
    _id: string;
    order_id: string;
    buyer: {
      firstName: string;
      lastName: string;
    };
    totalAmount: number;
    createdAt: string;
    paymentInfo: {
      status: string;
    };
    isOpen: boolean;
  }>;
  totalOrders: number;
}

interface Seller {
  _id: string;
  businessName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
}

interface Buyer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

interface ReturnStatistics {
  statistics: {
    byStatus: {
      _id: string;
      count: number;
      totalRefundAmount: number;
    }[];
    topReasons: {
      _id: string;
      count: number;
    }[];
  };
}

interface Product {
  _id: string;
  name: string;
  stock: number;
}

interface StreamAnalytics {
  data?: {
    totalStreams: number;
    activeStreams: number;
    totalViewers: number;
    totalInteractions: number;
  };
  totalStreams?: number;
  activeStreams?: number;
  totalViewers?: number;
  totalInteractions?: number;
}

interface FinancialSummary {
  totalInflow: number;
  totalOutflow: number;
  netBalance: number;
  pendingAmount: number;
}

interface Withdrawal {
  _id: string;
  seller: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestDate: string;
  reference: string;
}

interface WithdrawalsSummary {
  total: number;
  pending: number;
  pendingAmount: number;
}

// Add a Stream interface to track stream data
interface Stream {
  id: string;
  status: 'scheduled' | 'live' | 'ended' | 'expired';
  viewersCount: number;
  bidCount: number;
}

function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // State for all data
  const [ordersData, setOrdersData] = useState<OrdersResponse | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [returnStats, setReturnStats] = useState<ReturnStatistics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [streamAnalytics, setStreamAnalytics] = useState<StreamAnalytics | null>(null);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawalsSummary, setWithdrawalsSummary] = useState<WithdrawalsSummary | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);

  // Fetch all data in parallel
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Create an array of promises for all API calls
        const [
          ordersResponse,
          sellersResponse,
          buyersResponse,
          returnStatsResponse,
          productsResponse,
          streamAnalyticsResponse,
          financialSummaryResponse,
          withdrawalsResponse,
          streamsResponse
        ] = await Promise.all([
          api.get('/api/admin/orders?page=1&limit=100'),
          api.get('/api/admin/sellers'),
          api.get('/api/admin/users'),
          api.get('/api/returns/admin/statistics'),
          api.get('/api/admin/products'),
          api.get('/api/admin/streams/analytics'),
          api.get('/api/admin/financial/summary'),
          api.get('/api/admin/withdrawals'),
          api.get('/api/admin/streams?limit=100')
        ]);
        
        // Set state for all responses
        setOrdersData(ordersResponse.data);
        setSellers(sellersResponse.data);
        setBuyers(buyersResponse.data);
        setReturnStats(returnStatsResponse.data);
        setProducts(productsResponse.data);
        
        // Handle streams data
        let streamsData: Stream[] = [];
        if (streamsResponse.data && streamsResponse.data.data && Array.isArray(streamsResponse.data.data.streams)) {
          streamsData = streamsResponse.data.data.streams;
        } else if (Array.isArray(streamsResponse.data)) {
          streamsData = streamsResponse.data;
        }
        setStreams(streamsData);
        
        // Handle stream analytics with different possible structures
        const streamData = streamAnalyticsResponse.data;
        console.log("Stream Analytics Data:", streamData);
        console.log("Streams Data:", streamsData);
        
        // Handle different response structures from the API
        if (streamData) {
          if (streamData.data) {
            // If the data is nested under 'data' property
            setStreamAnalytics(streamData);
          } else if (typeof streamData.totalStreams === 'number') {
            // If data is directly at the top level of the response
            setStreamAnalytics(streamData);
          } else {
            // Calculate analytics from the streamsData if no analytics provided
            const liveStreams = streamsData.filter(stream => stream.status === 'live');
            const viewers = streamsData.reduce((total, stream) => total + (stream.viewersCount || 0), 0);
            const interactions = streamsData.reduce((total, stream) => total + (stream.bidCount || 0), 0);
            
            setStreamAnalytics({
              totalStreams: streamsData.length,
              activeStreams: liveStreams.length,
              totalViewers: viewers,
              totalInteractions: interactions
            });
          }
        } else if (streamsData.length > 0) {
          // If no analytics but we have streams data
          const liveStreams = streamsData.filter(stream => stream.status === 'live');
          const viewers = streamsData.reduce((total, stream) => total + (stream.viewersCount || 0), 0);
          const interactions = streamsData.reduce((total, stream) => total + (stream.bidCount || 0), 0);
          
          setStreamAnalytics({
            totalStreams: streamsData.length,
            activeStreams: liveStreams.length,
            totalViewers: viewers,
            totalInteractions: interactions
          });
        }
        
        setFinancialSummary(financialSummaryResponse.data);
        
        // Calculate withdrawal summary from response
        const withdrawalsData = withdrawalsResponse.data;
        setWithdrawals(withdrawalsData);
        
        if (withdrawalsData && Array.isArray(withdrawalsData)) {
          const pending = withdrawalsData.filter(w => w.status === 'pending');
          const pendingAmount = pending.reduce((total, w) => total + w.amount, 0);
          
          setWithdrawalsSummary({
            total: withdrawalsData.length,
            pending: pending.length,
            pendingAmount
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Derived data using useMemo
  
  // Calculate total revenue from paid orders
  const totalRevenue = useMemo(() => {
    return ordersData?.orders
      ?.filter(order => order.paymentInfo?.status === 'paid')
      ?.reduce((sum, order) => sum + (order.totalAmount || 0), 0) || 0;
  }, [ordersData?.orders]);

  // Calculate pending orders count
  const pendingOrders = useMemo(() => {
    return ordersData?.orders
      ?.filter(order => order.paymentInfo?.status === 'pending')
      ?.length || 0;
  }, [ordersData?.orders]);

  // Calculate average order value
  const averageOrderValue = useMemo(() => {
    const paidOrders = ordersData?.orders?.filter(order => order.paymentInfo?.status === 'paid') || [];
    if (paidOrders.length === 0) return 0;
    return totalRevenue / paidOrders.length;
  }, [totalRevenue, ordersData?.orders]);

  // Calculate out of stock and low stock products
  const outOfStockProducts = useMemo(() => {
    return products?.filter(product => product.stock === 0)?.length || 0;
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products?.filter(product => product.stock > 0 && product.stock <= 20)?.length || 0;
  }, [products]);

  // Calculate total refund amount
  const totalRefundAmount = useMemo(() => {
    return returnStats?.statistics.byStatus
      ?.reduce((sum, status) => sum + (status.totalRefundAmount || 0), 0) || 0;
  }, [returnStats]);

  // Calculate pending returns count
  const pendingReturns = useMemo(() => {
    return returnStats?.statistics.byStatus
      ?.find(status => status._id === 'PENDING_SELLER_REVIEW')?.count || 0;
  }, [returnStats]);

  // Calculate new users in the last week
  const newBuyersThisWeek = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return buyers.filter(buyer => new Date(buyer.createdAt) >= oneWeekAgo).length;
  }, [buyers]);

  const newSellersThisWeek = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return sellers.filter(seller => new Date(seller.createdAt) >= oneWeekAgo).length;
  }, [sellers]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get withdrawal status style
  const getWithdrawalStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get recent orders
  const recentOrders = useMemo(() => {
    return ordersData?.orders?.slice(0, 5) || [];
  }, [ordersData?.orders]);

  // Get recent withdrawals
  const recentWithdrawals = useMemo(() => {
    return withdrawals?.slice(0, 5) || [];
  }, [withdrawals]);

    return (
      <div className="space-y-6 p-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Hi {user?.username}</h2>
          <p className="text-muted-foreground">
            Here's what's happening across Auqli today
          </p>
        </div>
  
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
                  <h3 className="text-xl md:text-2xl font-bold">{ordersData?.totalOrders || 0}</h3>
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
                  <h3 className="text-xl md:text-2xl font-bold">{formatCurrency(totalRevenue)}</h3>
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
                  <h3 className="text-xl md:text-2xl font-bold">{buyers.length + sellers.length}</h3>
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
                  <h3 className="text-xl md:text-2xl font-bold">{products?.length || 0}</h3>
                </div>
              </div>
            </Card>
          </div>

          {/* Secondary Stats - E-commerce */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Orders & Revenue */}
            <Card className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h3 className="text-lg font-semibold text-white">Orders & Revenue</h3>
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
                  <p className="text-lg md:text-xl font-bold mt-2">{pendingOrders}</p>
                </div>

                <div className="p-3 md:p-4 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                    <p className="text-xs md:text-sm text-muted-foreground">Avg. Order Value</p>
                  </div>
                  <p className="text-lg md:text-xl font-bold mt-2">{formatCurrency(averageOrderValue)}</p>
                </div>

                <div className="p-3 md:p-4 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <RefreshCcw className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
                    <p className="text-xs md:text-sm text-muted-foreground">Return Requests</p>
                  </div>
                  <p className="text-lg md:text-xl font-bold mt-2">{pendingReturns}</p>
                </div>

                <div className="p-3 md:p-4 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
                    <p className="text-xs md:text-sm text-muted-foreground">Refund Amount</p>
                  </div>
                  <p className="text-lg md:text-xl font-bold mt-2">{formatCurrency(totalRefundAmount)}</p>
                </div>
              </div>
            </Card>

            {/* User Stats */}
            <Card className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h3 className="text-lg font-semibold text-white">User Activity</h3>
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
                    <p className="text-xs md:text-sm text-muted-foreground">Total Buyers</p>
                  </div>
                  <p className="text-lg md:text-xl font-bold mt-2">{buyers.length}</p>
                </div>

                <div className="p-3 md:p-4 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 md:h-5 md:w-5 text-indigo-500" />
                    <p className="text-xs md:text-sm text-muted-foreground">Total Sellers</p>
                  </div>
                  <p className="text-lg md:text-xl font-bold mt-2">{sellers.length}</p>
                </div>

                <div className="p-3 md:p-4 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-cyan-500" />
                    <p className="text-xs md:text-sm text-muted-foreground">New Buyers</p>
                  </div>
                  <p className="text-lg md:text-xl font-bold mt-2">{newBuyersThisWeek}</p>
                </div>

                <div className="p-3 md:p-4 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 md:h-5 md:w-5 text-pink-500" />
                    <p className="text-xs md:text-sm text-muted-foreground">New Sellers</p>
                  </div>
                  <p className="text-lg md:text-xl font-bold mt-2">{newSellersThisWeek}</p>
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
                    <span className="text-xs md:text-sm">Total Inflow</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold">{formatCurrency(financialSummary?.totalInflow || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
                    <span className="text-xs md:text-sm">Total Outflow</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold">{formatCurrency(financialSummary?.totalOutflow || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                    <span className="text-xs md:text-sm">Net Balance</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold">{formatCurrency(financialSummary?.netBalance || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CircleDollarSign className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
                    <span className="text-xs md:text-sm">Pending Withdrawals</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold">{withdrawalsSummary?.pending || 0}</span>
                </div>
              </div>
            </Card>

            {/* Product Stats */}
            <Card className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h3 className="text-lg font-semibold text-white">Inventory Status</h3>
                <Link to="/dashboard/products">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">View All</Button>
                </Link>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    <span className="text-xs md:text-sm">Total Products</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold">{products?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
                    <span className="text-xs md:text-sm">Out of Stock</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold">{outOfStockProducts}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
                    <span className="text-xs md:text-sm">Low Stock</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold">{lowStockProducts}</span>
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
                    {streamAnalytics?.data?.totalStreams || streamAnalytics?.totalStreams || streams.length || 0}+
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                    <span className="text-xs md:text-sm">Live Streams</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold">
                    {streamAnalytics?.data?.activeStreams || streamAnalytics?.activeStreams || streams.filter(s => s.status === 'live').length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                    <span className="text-xs md:text-sm">Scheduled</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold">
                    {streams.filter(s => s.status === 'scheduled').length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                    <span className="text-xs md:text-sm">Total Viewers</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold">
                    {streamAnalytics?.data?.totalViewers || streamAnalytics?.totalViewers || streams.reduce((sum, s) => sum + (s.viewersCount || 0), 0) || 0}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Activity Tables */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Recent Orders */}
            <Card className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Orders</h3>
                <Link to="/dashboard/orders">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">View All</Button>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Order ID</TableHead>
                      <TableHead className="hidden sm:table-cell">Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.length > 0 ? (
                      recentOrders.map((order) => (
                        <TableRow key={order._id}>
                          <TableCell className="font-medium">{order.order_id}</TableCell>
                          <TableCell className="hidden sm:table-cell">{order.buyer.firstName} {order.buyer.lastName}</TableCell>
                          <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                          <TableCell>
                            <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium
                              ${order.isOpen 
                                ? "bg-green-100 text-green-700" 
                                : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              <div className={`h-1.5 w-1.5 rounded-full
                                ${order.isOpen ? "bg-green-600" : "bg-gray-600"}`} 
                              />
                              {order.isOpen ? "Open" : "Closed"}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">No recent orders</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Recent Withdrawals */}
            <Card className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Withdrawals</h3>
                <Link to="/dashboard/withdrawals">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">View All</Button>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Reference</TableHead>
                      <TableHead className="hidden sm:table-cell">Seller</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentWithdrawals.length > 0 ? (
                      recentWithdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal._id}>
                          <TableCell className="font-medium">{withdrawal.reference}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {withdrawal.seller.firstName} {withdrawal.seller.lastName}
                          </TableCell>
                          <TableCell>{formatCurrency(withdrawal.amount)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${getWithdrawalStatusStyle(withdrawal.status)}`}>
                              {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">No recent withdrawals</TableCell>
                      </TableRow>
                    )}
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