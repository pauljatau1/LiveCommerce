import { useState, useEffect } from "react";
import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ArrowUpRight,
  AlertCircle,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  CalendarIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import LinearProgress from "@mui/material/LinearProgress";
import { BASE_URL } from "@/Constants/Server";
import { useOutletContext } from 'react-router-dom';
import Header from "@/components/ui/Header/Header";
import { FaChartLine, FaShoppingCart, FaUsers, FaBoxOpen, FaChartPie, FaExclamationTriangle, FaExclamationCircle } from 'react-icons/fa';
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Helper functions
const formatCurrency = (value) => {
  if (!value && value !== 0) return '₦0';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(value);
};

const formatNumber = (value) => {
  if (!value && value !== 0) return '0';
  return new Intl.NumberFormat('en-NG').format(value);
};

const formatPercentage = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return '0%';
  return `${Math.round(value)}%`;
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

const formatRecommendations = (recs) => {
  if (!Array.isArray(recs)) return [];

  return recs.map(rec => ({
    type: rec?.type || 'unknown',
    priority: rec?.priority || 'low',
    message: rec?.message || 'No message available',
    affectedProducts: Array.isArray(rec?.affectedProducts)
      ? rec.affectedProducts.map(product => ({
          id: product?.id || '',
          name: product?.name || 'Unknown Product',
          currentStock: typeof product?.currentStock === 'number' ? product.currentStock : 'N/A',
          daysListed: typeof product?.daysListed === 'number' ? product.daysListed : 'N/A'
        }))
      : []
  }));
};

// Add new performance metrics section
const PerformanceMetricsCard = ({ title, metrics }) => (
  <Card className="bg-white -lg rounded-xl border-none overflow-hidden">
    <CardHeader className="border-b bg-gray-50/50 pb-4">
      <CardTitle className="text-lg font-semibold flex items-center gap-2">
        <FaChartLine className="text-violet-500" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-6">
      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">{metric.name}</span>
              <span className="text-sm font-bold">{formatPercentage(metric.value)}</span>
            </div>
            <LinearProgress 
              variant="determinate" 
              value={metric.value} 
              className="h-2 rounded-full"
              sx={{
                backgroundColor: 'rgba(0,0,0,0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: `var(--${metric.color || 'primary'})`,
                }
              }}
            />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Add new revenue breakdown section
const RevenueBreakdownCard = ({ title, data }) => (
  <Card className="bg-white -lg rounded-xl border-none overflow-hidden">
    <CardHeader className="border-b bg-gray-50/50 pb-4">
      <CardTitle className="text-lg font-semibold flex items-center gap-2">
        <DollarSign className="text-emerald-500" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-6">
      <div className="space-y-4">
        {Object.entries(data).map(([category, amount], index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">{category}</span>
            <span className="text-sm font-bold">{formatCurrency(amount)}</span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Add this new component after the existing card components
const TopCustomersCard = ({ customers }) => (
  <Card className="bg-white -lg rounded-xl border-none overflow-hidden">
    <CardHeader className="border-b bg-gray-50/50 pb-4">
      <CardTitle className="text-lg font-semibold flex items-center gap-2">
        <FaUsers className="text-indigo-500" />
        Top Customers
      </CardTitle>
      <CardDescription className="text-gray-600">Customers by total spend and orders</CardDescription>
    </CardHeader>
    <CardContent className="pt-6">
      <div className="space-y-4">
        {customers?.map((customer, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {customer.name ? customer.name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2) : 'NA'}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {customer.name || 'Unknown Customer'}
                </p>
                <p className="text-sm text-gray-500">
                  First Purchase: {customer.firstPurchaseDate ? formatDate(customer.firstPurchaseDate) : 'N/A'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">{formatCurrency(customer.totalSpent)}</p>
              <p className="text-sm text-gray-500">{customer.totalOrders} orders</p>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Updated MetricCard Component with refined design and smaller font sizes
const MetricCard = ({ title, value, change, icon, gradient }) => {
  const isPositive = change >= 0;
  
  return (
    <div className="bg-white rounded-xl -sm hover:-md transition- duration-300 border border-gray-100/40 overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={`bg-gradient-to-r ${gradient} p-2.5 rounded-lg -sm`}>
            {React.cloneElement(icon, { className: 'text-white text-lg' })}
          </div>
          {change !== 0 && (
            <div className={`text-xs ${isPositive ? 'text-emerald-600' : 'text-red-600'} 
              flex items-center gap-1 px-1.5 py-0.5 rounded-full ${isPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
              {isPositive ? <ArrowUpRight size={12} /> : <TrendingDown size={12} />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <h3 className="text-gray-500 text-xs font-medium mb-1">{title}</h3>
        <p className="text-2xl font-semibold text-gray-800 tracking-tight">{value}</p>
      </div>
    </div>
  );
};

const AnalyticsAndInsights = () => {
  const { setHeaderName, setNavName } = useOutletContext();
  const [period, setPeriod] = useState("month");
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customDateRange, setCustomDateRange] = useState({
    startDate: null,
    endDate: null
  });

  useEffect(() => {
    setHeaderName('Analytics & Insights');
    setNavName('');
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const sellerToken = localStorage.getItem("sellerToken");
      if (!sellerToken) throw new Error("No auth token found");

      const tokenData = JSON.parse(sellerToken);
      
      let url = `${BASE_URL}/seller/analytics?period=${period}`;
      
      // Add custom date range if selected
      if (period === "custom" && customDateRange.startDate && customDateRange.endDate) {
        url += `&startDate=${customDateRange.startDate}&endDate=${customDateRange.endDate}`;
      }
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${tokenData.data}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch analytics (Status: ${response.status})`);
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error("Error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const handleRetry = () => {
    fetchAnalytics();
  };

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay message={error} onRetry={handleRetry} />;
  if (!analyticsData) return <ErrorDisplay message="No data available" onRetry={handleRetry} />;

  // Destructure data from the response
  const {
    summary,
    insights,
    recommendations,
    ordersData,
    productsData,
    streamsData,
    followersData,
    chartData,
    ratingsDistribution,
    storeVisitsByMonth
  } = analyticsData;

  // Transform chart data for the line chart
  const revenueChartData = chartData.map(item => ({
    date: item.date,
    revenue: item.revenue
  }));

  // Transform category data for the pie chart
  const ordersByChannelData = Object.entries(ordersData.ordersByChannel || {}).map(([name, value]) => ({
    name,
    value
  }));

  // Format store visits by month for the bar chart
  const visitsChartData = storeVisitsByMonth.map(item => ({
    month: item.month,
    visits: item.count
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="sm:p-6 pt-3 md:p-8 max-w-[1920px] mx-auto">
        {/* Header with Date Range Selector */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white p-4 rounded-xl -sm border border-gray-100/60">
          <h1 className="text-xl font-bold text-gray-800 mb-4 md:mb-0 tracking-tight">Seller Analytics</h1>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Select value={period} onValueChange={(value) => setPeriod(value)}>
              <SelectTrigger className="w-full md:w-[180px] bg-white border border-gray-200">
                <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                <SelectValue>
                  {period === "week" ? "Last 7 Days" : 
                   period === "month" ? "Last 30 Days" : 
                   period === "year" ? "Last Year" : "Custom Range"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={handleRetry} 
              className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700"
            >
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(summary.totalRevenue || 0)}
            change={0}
            icon={<FaChartLine />}
            gradient="from-indigo-600 to-blue-700"
          />
          <MetricCard
            title="Orders"
            value={formatNumber(summary.totalOrders || 0)}
            change={0}
            icon={<FaShoppingCart />}
            gradient="from-amber-600 to-orange-700"
          />
          <MetricCard
            title="Customers"
            value={formatNumber(summary.uniqueBuyers || 0)}
            change={0}
            icon={<FaUsers />}
            gradient="from-violet-600 to-purple-700"
          />
          <MetricCard
            title="Products"
            value={formatNumber(summary.totalProducts || 0)}
            change={0}
            icon={<FaBoxOpen />}
            gradient="from-emerald-600 to-green-700"
          />
        </div>

        {/* Revenue Chart & Order Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Chart */}
          <Card className="bg-white rounded-xl -sm border border-gray-100/40 overflow-hidden hover:-md transition- duration-300">
            <CardHeader className="border-b border-gray-100 bg-gray-50/40 pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <TrendingUp className="text-indigo-600 h-4 w-4" />
                Revenue Trend
              </CardTitle>
              <CardDescription className="text-gray-600 text-xs">Daily revenue during selected period</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      stroke="#6b7280" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickFormatter={(value) => `₦${value/1000}k`}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Revenue']}
                      contentStyle={{ 
                        background: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        box: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      name="Revenue" 
                      stroke="#4f46e5" 
                      strokeWidth={2} 
                      dot={{ r: 3, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 1.5 }}
                      activeDot={{ r: 5, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 1.5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Order Data */}
          <Card className="bg-white rounded-xl -sm border border-gray-100/40 overflow-hidden hover:-md transition- duration-300">
            <CardHeader className="border-b border-gray-100 bg-gray-50/40 pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <ShoppingCart className="text-amber-600 h-4 w-4" />
                Order Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100/60">
                    <p className="text-xs text-gray-600 mb-1">Average Order Value</p>
                    <p className="text-base font-medium text-gray-800">{formatCurrency(summary.averageOrderValue || 0)}</p>
                  </div>
                  <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100/60">
                    <p className="text-xs text-gray-600 mb-1">Repeat Customer Rate</p>
                    <p className="text-base font-medium text-gray-800">{ordersData.repeatCustomerRate || 0}%</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xs font-medium mb-3 text-gray-700">Orders by Status</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2.5 bg-gray-50/70 rounded-lg border border-gray-100/60">
                      <span className="text-xs font-medium capitalize text-gray-700">Pending</span>
                      <span className="text-xs font-medium text-amber-600">{ordersData.pendingOrders || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 bg-gray-50/70 rounded-lg border border-gray-100/60">
                      <span className="text-xs font-medium capitalize text-gray-700">Fulfilled</span>
                      <span className="text-xs font-medium text-emerald-600">{ordersData.fulfilledOrders || 0}</span>
                    </div>
                  </div>
                </div>

                {Object.keys(ordersData.ordersByChannel || {}).length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium mb-3 text-gray-700">Orders by Channel</h3>
                    <div className="h-[140px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={ordersByChannelData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={55}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {ordersByChannelData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [value, 'Orders']}
                            contentStyle={{ 
                              background: 'rgba(255, 255, 255, 0.95)', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              box: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Data & Stream Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Product Performance */}
          <Card className="bg-white rounded-xl -sm border border-gray-100/40 overflow-hidden hover:-md transition- duration-300">
            <CardHeader className="border-b border-gray-100 bg-gray-50/40 pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <FaBoxOpen className="text-emerald-600 h-4 w-4" />
                Product Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100/60">
                    <p className="text-xs text-gray-600 mb-1">Total Products</p>
                    <p className="text-base font-medium text-gray-800">{summary.totalProducts || 0}</p>
                  </div>
                  <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100/60">
                    <p className="text-xs text-gray-600 mb-1">Low Stock Items</p>
                    <p className="text-base font-medium text-gray-800">{productsData.lowStockProducts?.length || 0}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xs font-medium mb-3 text-gray-700">Best Selling Products</h3>
                  <div className="space-y-2">
                    {(productsData.mostSoldProducts || []).slice(0, 5).map((product, index) => (
                      <div key={index} className="flex justify-between items-center p-2.5 bg-gray-50/70 rounded-lg border border-gray-100/60 hover:bg-gray-100/80 transition-colors duration-200">
                        <span className="text-xs font-medium text-gray-700">{product.name}</span>
                        <span className="text-xs font-medium text-emerald-600">{product.sold} sold</span>
                      </div>
                    ))}
                    {(productsData.mostSoldProducts || []).length === 0 && (
                      <div className="flex justify-center items-center p-6 bg-gray-50/70 rounded-lg border border-gray-100/60">
                        <span className="text-xs text-gray-500">No data available</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stream Analytics */}
          <Card className="bg-white rounded-xl -sm border border-gray-100/40 overflow-hidden hover:-md transition- duration-300">
            <CardHeader className="border-b border-gray-100 bg-gray-50/40 pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <FaChartLine className="text-violet-600 h-4 w-4" />
                Stream Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100/60">
                    <p className="text-xs text-gray-600 mb-1">Total Streams</p>
                    <p className="text-base font-medium text-gray-800">{streamsData.totalStreams || 0}</p>
                  </div>
                  <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100/60">
                    <p className="text-xs text-gray-600 mb-1">Avg. Viewers/Stream</p>
                    <p className="text-base font-medium text-gray-800">{streamsData.averageViewersPerStream || 0}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-50/70 p-2.5 rounded-lg border border-gray-100/60">
                    <p className="text-xs text-gray-600 mb-1">Live</p>
                    <p className="text-sm font-medium text-green-600">{streamsData.liveStreams || 0}</p>
                  </div>
                  <div className="bg-gray-50/70 p-2.5 rounded-lg border border-gray-100/60">
                    <p className="text-xs text-gray-600 mb-1">Ended</p>
                    <p className="text-sm font-medium text-gray-700">{streamsData.endedStreams || 0}</p>
                  </div>
                  <div className="bg-gray-50/70 p-2.5 rounded-lg border border-gray-100/60">
                    <p className="text-xs text-gray-600 mb-1">Scheduled</p>
                    <p className="text-sm font-medium text-indigo-600">{streamsData.scheduledStreams || 0}</p>
                  </div>
                </div>
                
                {streamsData.topPerformingStreams?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium mb-3 text-gray-700">Top Performing Streams</h3>
                    <div className="space-y-2">
                      {streamsData.topPerformingStreams.map((stream, index) => (
                        <div key={index} className="flex justify-between items-center p-2.5 bg-gray-50/70 rounded-lg border border-gray-100/60 hover:bg-gray-100/80 transition-colors duration-200">
                          <span className="text-xs font-medium text-gray-700 truncate max-w-[65%]">{stream.title}</span>
                          <span className="text-xs font-medium text-violet-600">{stream.viewerCount} viewers</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {streamsData.topPerformingStreams?.length === 0 && (
                  <div className="flex justify-center items-center p-5 bg-gray-50/70 rounded-lg border border-gray-100/60">
                    <span className="text-xs text-gray-500">No stream data available</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders & Ratings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Orders */}
          <Card className="bg-white rounded-xl -sm border border-gray-100/40 overflow-hidden hover:-md transition- duration-300">
            <CardHeader className="border-b border-gray-100 bg-gray-50/40 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <FaShoppingCart className="text-amber-600 h-4 w-4" />
                  Recent Orders
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {(ordersData.recentOrders || []).map((order, index) => (
                  <div key={index} className="p-3 bg-gray-50/70 rounded-lg border border-gray-100/60 hover:bg-gray-100/80 transition-all duration-200">
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <h3 className="font-medium text-gray-800 text-xs">Order #{order.order_id}</h3>
                        <p className="text-xs text-gray-600">
                          {order.buyerName} - {formatDate(order.date)}
                        </p>
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-xs ${
                        order.status === 'Open' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {order.status}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1.5">
                      <span className="text-xs text-gray-600">{order.items} item(s) - {order.channel}</span>
                      <span className="text-xs font-medium text-gray-800">{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>
                ))}
                {(ordersData.recentOrders || []).length === 0 && (
                  <div className="flex justify-center items-center py-8 bg-gray-50/70 rounded-lg border border-gray-100/60">
                    <p className="text-gray-500 text-xs">No recent orders</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Followers */}
          <Card className="bg-white rounded-xl -sm border border-gray-100/40 overflow-hidden hover:-md transition- duration-300">
            <CardHeader className="border-b border-gray-100 bg-gray-50/40 pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <FaUsers className="text-indigo-600 h-4 w-4" />
                Followers
              </CardTitle>
              <CardDescription className="text-gray-600 text-xs">
                Total Followers: {formatNumber(followersData.totalFollowers || 0)}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {(followersData.recentFollowers || []).map((follower, index) => (
                  <div key={index} className="flex items-center justify-between p-2.5 bg-gray-50/70 rounded-lg border border-gray-100/60 hover:bg-gray-100/80 transition-colors duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center -sm">
                        <span className="text-white font-medium text-xs">
                          {follower.name ? follower.name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2) : 'NA'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-xs">
                          {follower.name || 'Unknown Follower'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Followed: {formatDate(follower.followDate)}
                        </p>
                      </div>
                    </div>
                    {follower.orderCount > 0 && (
                      <div className="text-right">
                        <p className="text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{follower.orderCount} orders</p>
                      </div>
                    )}
                  </div>
                ))}
                {(followersData.recentFollowers || []).length === 0 && (
                  <div className="flex justify-center items-center py-8 bg-gray-50/70 rounded-lg border border-gray-100/60">
                    <p className="text-gray-500 text-xs">No followers yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ratings Distribution */}
        <div className="mb-6">
          <Card className="bg-white rounded-xl -sm border border-gray-100/40 overflow-hidden hover:-md transition- duration-300">
            <CardHeader className="border-b border-gray-100 bg-gray-50/40 pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <FaChartPie className="text-violet-600 h-4 w-4" />
                Ratings Distribution
              </CardTitle>
              <CardDescription className="text-gray-600 text-xs">
                Average Rating: {summary.ratingsAverage?.toFixed(1) || 0} ({summary.totalReviews || 0} reviews)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {Object.entries(ratingsDistribution || {}).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = ratingsDistribution[rating] || 0;
                    const percentage = summary.totalReviews > 0 
                      ? (count / summary.totalReviews * 100) 
                      : 0;
                    
                    return (
                      <div key={rating} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-700">{rating} Star</span>
                          <span className="text-xs font-medium text-gray-800">{count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <LinearProgress 
                          variant="determinate" 
                          value={percentage} 
                          className="h-1.5 rounded-full"
                          sx={{
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: rating >= 4 ? 'rgb(16, 185, 129)' : 
                                             rating === 3 ? 'rgb(245, 158, 11)' : 'rgb(239, 68, 68)',
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex justify-center items-center py-6 bg-gray-50/70 rounded-lg border border-gray-100/60">
                  <p className="text-gray-500 text-xs">No ratings yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Insights & Recommendations */}
        {(insights?.length > 0 || recommendations?.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Insights */}
            {insights?.length > 0 && (
              <Card className="bg-white rounded-xl -sm border-none overflow-hidden">
                <CardHeader className="border-b border-gray-100 bg-gray-50/40 pb-4">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <FaChartLine className="text-indigo-600 h-4 w-4" />
                    Business Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="space-y-3">
                    {insights.map((insight, index) => (
                      <Alert key={index} className="border-l-4 border-indigo-500 bg-indigo-50/50 py-2">
                        <AlertDescription className="text-indigo-800 text-xs">{insight}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {recommendations?.length > 0 && (
              <Card className="bg-white rounded-xl -sm border-none overflow-hidden">
                <CardHeader className="border-b border-gray-100 bg-gray-50/40 pb-4">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <FaExclamationTriangle className="text-amber-600 h-4 w-4" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="space-y-3">
                    {recommendations.map((recommendation, index) => (
                      <Alert key={index} className="border-l-4 border-amber-500 bg-amber-50/50 py-2">
                        <AlertDescription className="text-amber-800 text-xs">{recommendation}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6 md:p-8">
    <div className="max-w-[1920px] mx-auto space-y-8">
      {/* Header with date range */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-5 rounded-xl -sm border border-gray-100/60">
        <Skeleton className="h-8 w-[200px] mb-4 md:mb-0 rounded-md" />
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Skeleton className="h-10 w-full md:w-[180px] rounded-md" />
          <Skeleton className="h-10 w-[100px] rounded-md" />
        </div>
      </div>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl -sm border border-gray-100/40 p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <Skeleton className="h-6 w-[70px] rounded-full" />
            </div>
            <Skeleton className="h-4 w-[100px] mb-2 rounded-md" />
            <Skeleton className="h-8 w-[150px] rounded-md" />
          </div>
        ))}
      </div>
      
      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="bg-white rounded-xl -sm border border-gray-100/40 overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-gray-50/40 pb-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-6 w-[180px] rounded-md" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

const ErrorDisplay = ({ message, onRetry }) => (
  <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6 md:p-8 flex items-center justify-center">
    <div className="max-w-md w-full bg-white rounded-xl -md p-8 text-center border border-gray-100/60">
      <div className="mb-6 flex justify-center">
        <div className="bg-red-50 p-3 rounded-full">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Data Loading Error</h2>
      <AlertDescription className="text-gray-600 mb-6 text-sm">{message}</AlertDescription>
      {onRetry && (
        <Button 
          onClick={onRetry} 
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
        >
          Retry
        </Button>
      )}
    </div>
  </div>
);

export default AnalyticsAndInsights;
