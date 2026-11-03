import {
  Users,
  ShoppingCart,
  DollarSign,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Store,
  Package,
  Clock,
  TrendingUp,
  RotateCcw,
  Wallet,
  Video,
  CircleDollarSign,
  Banknote,
  AlertCircle,
  Activity,
  Zap,
  ChevronRight,
  Trophy,
  ShieldCheck,
  Calendar,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { api } from "@/api/axios";
import { useAuth } from "@/context/authContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// --- Types ---
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
  growth: {
    revenue: number | string;
    orders: number | string;
    buyers: number | string;
    sellers: number | string;
    products: number | string;
  };
  charts: {
    revenueAndOrders: Array<{ date: string; revenue: number; orders: number }>;
    userSignups: Array<{ date: string; buyers: number; sellers: number; total: number }>;
  };
  userMetrics: {
    activeBuyers: number;
    activeSellers: number;
    verifiedSellers: number;
    pendingVerificationSellers: number;
    identityVerifiedBuyers: number;
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
  };
  bankChangeMetrics: {
    pendingBankChangeRequests: number;
    approvedBankChangeRequests: number;
    rejectedBankChangeRequests: number;
  };
  streamMetrics: {
    scheduledStreams: number;
    liveStreams: number;
    endedStreams: number;
    cancelledStreams: number;
  };
  financialMetrics: {
    totalOrderAmount: number;
    totalWithdrawalAmount: number;
  };
  recentActivity: {
    orders: Array<any>;
    withdrawals: Array<any>;
    bankChangeRequests: Array<any>;
    streams: Array<any>;
  };
  extra: {
    topPerformers: Array<any>;
    topProducts: Array<any>;
    topBuyers: Array<any>;
    topLiveStreams: Array<any>;
    topCategories: Array<any>;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function Dashboard() {
  const { user } = useAuth();
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const StatCard = ({ title, value, growth, icon: Icon, colorClass, gradient }: any) => {
    const isPositive = parseFloat(growth) >= 0;
    return (
      <Card className="bg-slate-900/50 border-slate-800 overflow-hidden group relative">
        <div className={cn("absolute top-0 right-0 h-24 w-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20", gradient)} />
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500 tracking-wider font-mono">{title}</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{value}</h3>
            </div>
            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110", colorClass)}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
              isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
            )}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(parseFloat(growth))}%
            </div>
            <span className="text-[10px] text-slate-500 font-medium">vs last month</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ActionCard = ({ title, count, label, icon: Icon, color, link }: any) => (
    <Link to={link} className="block group">
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:bg-slate-800/80 transition-all hover:border-slate-700">
        <div className="flex items-center gap-4">
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1.5">{title}</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white leading-none">{count}</span>
              <span className="text-[10px] font-medium text-slate-600">{label}</span>
            </div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-700 group-hover:text-white transition-colors" />
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] space-y-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-slate-800" />
          <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-slate-500 text-sm font-medium animate-pulse">Synchronizing platform data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto pb-20">
      {/* Dashboard Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 uppercase text-[10px] font-bold px-2 py-0">
              Admin Control Center
            </Badge>
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">System Online</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter">
            {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{user?.username || 'Commander'}</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">Your marketplace ecosystem is processing <span className="text-slate-300">{(metrics?.counts.orders || 0).toLocaleString()}</span> total interactions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-bold text-white">{format(new Date(), "eeee, MMMM do")}</span>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Real-time Dashboard</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
            <Calendar className="h-5 w-5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Revenue (3m)"
          value={formatCurrency(metrics?.financialMetrics.totalOrderAmount || 0)}
          growth={metrics?.growth.revenue}
          icon={DollarSign}
          colorClass="bg-emerald-500 shadow-emerald-500/20"
          gradient="bg-emerald-500"
        />
        <StatCard
          title="Fulfillment Vol."
          value={metrics?.counts.orders}
          growth={metrics?.growth.orders}
          icon={ShoppingCart}
          colorClass="bg-blue-500 shadow-blue-500/20"
          gradient="bg-blue-500"
        />
        <StatCard
          title="Merchant Base"
          value={metrics?.counts.sellers}
          growth={metrics?.growth.sellers}
          icon={Store}
          colorClass="bg-orange-500 shadow-orange-500/20"
          gradient="bg-orange-500"
        />
        <StatCard
          title="User Network"
          value={metrics?.counts.buyers}
          growth={metrics?.growth.buyers}
          icon={Users}
          colorClass="bg-indigo-500 shadow-indigo-500/20"
          gradient="bg-indigo-500"
        />
      </div>

      {/* Middle Section - Visual Context */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Operational Charts */}
        <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
            <div>
              <CardTitle className="text-lg font-bold text-white">Platform Growth Velocity</CardTitle>
              <p className="text-[11px] text-slate-500 font-medium">Revenue vs Transaction volume across 90-day window</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Volume</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Revenue</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics?.charts.revenueAndOrders} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="chartOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#475569"
                    fontSize={10}
                    fontFamily="monospace"
                    tickFormatter={(v) => format(new Date(v), "dd MMM")}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#475569"
                    fontSize={10}
                    fontFamily="monospace"
                    tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#475569"
                    fontSize={10}
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '12px' }}
                    itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                    labelStyle={{ fontSize: '10px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    cursor={{ stroke: '#334155', strokeWidth: 1 }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#chartRevenue)"
                    name="Revenue"
                    animationDuration={1500}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#chartOrders)"
                    name="Volume"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* High Priority Operations (Action Center) */}
        <div className="space-y-6">
          <div className="px-1">
            <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Zap className="h-3 w-3 text-amber-500 fill-amber-500" /> Administrative Inbox
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <ActionCard
                title="Pending Withdrawals"
                count={metrics?.withdrawalMetrics.pendingWithdrawals}
                label="Awaiting payout"
                icon={Wallet}
                color="bg-amber-500 shadow-amber-500/10"
                link="/dashboard/withdrawals"
              />
              <ActionCard
                title="Seller Verifications"
                count={metrics?.userMetrics.pendingVerificationSellers}
                label="Unprocessed documents"
                icon={ShieldCheck}
                color="bg-indigo-500 shadow-indigo-500/10"
                link="/dashboard/sellers"
              />
              <ActionCard
                title="Bank Change Requests"
                count={metrics?.bankChangeMetrics.pendingBankChangeRequests}
                label="Awaiting review"
                icon={Banknote}
                color="bg-blue-500 shadow-blue-500/10"
                link="/dashboard/bankrequests"
              />
              <ActionCard
                title="Disputes & Returns"
                count={(metrics?.orderMetrics.ordersWithDisputes || 0) + (metrics?.orderMetrics.ordersWithReturns || 0)}
                label="Critical attention"
                icon={RotateCcw}
                color="bg-rose-500 shadow-rose-500/10"
                link="/dashboard/return-requests"
              />
            </div>
          </div>

          <Card className="bg-slate-900/50 border-slate-800 border-dashed relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none mb-1">Infrastructure</p>
                  <p className="text-xs text-slate-300 font-medium whitespace-nowrap">View Platform System Logs</p>
                </div>
              </div>
              <Link to="/dashboard/system-logs">
                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-slate-800">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tables Section - Marketplace Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Performance Log */}
        <Card className="lg:col-span-8 bg-slate-900/50 border-slate-800 overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-800/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-white">Consolidated Activity</CardTitle>
              <p className="text-[11px] text-slate-500 font-medium">Monitoring the 50 most recent platform state changes</p>
            </div>
            <Link to="/dashboard/orders">
              <Button variant="outline" size="sm" className="bg-slate-900 border-slate-800 text-[10px] uppercase font-bold text-slate-400 h-8 px-4 hover:bg-slate-800 hover:text-white transition-all">
                Access Archives
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-950/20">
                <TableRow className="border-slate-800/50">
                  <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-wider pl-6 py-4">Descriptor</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Timeline</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-wider text-right pr-6">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics?.recentActivity.orders.slice(0, 8).map((order) => (
                  <TableRow key={order._id} className="border-slate-800/50 group hover:bg-slate-800/30 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                          <ShoppingCart className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">Order #{order.order_id}</p>
                          <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">{order.channel || 'Marketplace'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-slate-400">{format(new Date(order.createdAt), "MMM dd, HH:mm")}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-800 bg-slate-950/50 text-slate-400 text-[9px] uppercase font-bold py-0.5 h-5">
                        {order.items?.[0]?.status || 'In Queue'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <span className="font-bold text-white text-sm tracking-tight">{formatCurrency(order.totalAmount)}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Competitive Insights & Leaderboards */}
        <div className="lg:col-span-4 space-y-6">
          {/* Top Sellers Cards */}
          <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-sm font-black uppercase text-white tracking-widest">Elite Merchants</CardTitle>
                </div>
                <div className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 uppercase tracking-tighter">Gross GMV</div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-800/50">
                {metrics?.extra.topPerformers.map((seller: any, idx) => (
                  <div key={seller._id._id} className="p-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10 border border-slate-800 shadow-md">
                          <AvatarImage src={seller._id.storeAvatar?.url} className="object-cover" />
                          <AvatarFallback className="bg-slate-800 text-slate-500">{seller._id.storeName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-1 -left-1 h-5 w-5 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800">
                          <span className="text-[10px] font-black text-slate-500">#{idx + 1}</span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate max-w-[120px]">{seller._id.storeName || 'Merchant'}</span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{seller._id.email}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-white">{formatCurrency(seller.totalRevenue)}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Social Proof - Live Context */}
          <Card className="bg-slate-900/50 border-slate-800 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 animate-pulse">
                <div className="h-1 w-1 rounded-full bg-rose-500" />
                <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Direct Pulse</span>
              </div>
            </div>
            <CardHeader className="p-5 border-b border-slate-800/50">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-rose-500" />
                <CardTitle className="text-sm font-black uppercase text-white tracking-widest">Active Streams</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-800/50">
                {metrics?.extra.topLiveStreams.map((stream: any) => (
                  <div key={stream._id} className="p-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10 border border-slate-800">
                          <AvatarImage src={stream.seller.storeAvatar?.url} className="object-cover" />
                          <AvatarFallback>S</AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" title="Online" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white line-clamp-1">{stream.title}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{stream.seller.storeName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800">
                      <Users className="h-3 w-3 text-slate-500" />
                      <span className="text-[10px] font-black text-white">{stream.viewers?.length || 0}</span>
                    </div>
                  </div>
                ))}
                {(!metrics?.extra.topLiveStreams || metrics.extra.topLiveStreams.length === 0) && (
                  <div className="p-10 text-center">
                    <Video className="h-8 w-8 text-slate-800 mx-auto mb-3 opacity-30" />
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">No Active Sessions</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;