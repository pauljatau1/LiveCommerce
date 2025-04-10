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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
        {/* Header with Date Range Selector */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-5 rounded-xl shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Seller Analytics</h1>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Select value={period} onValueChange={(value) => setPeriod(value)}>
              <SelectTrigger className="w-full md:w-[180px] bg-white border-2">
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
            <Button variant="outline" onClick={handleRetry} className="bg-white hover:bg-gray-50 border-2">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(summary.totalRevenue || 0)}
            change={0} // You can add this if you have period comparison
            icon={<FaChartLine />}
            gradient="from-blue-500 to-indigo-600"
          />
          <MetricCard
            title="Orders"
            value={formatNumber(summary.totalOrders || 0)}
            change={0}
            icon={<FaShoppingCart />}
            gradient="from-amber-500 to-orange-600"
          />
          <MetricCard
            title="Customers"
            value={formatNumber(summary.uniqueBuyers || 0)}
            change={0}
            icon={<FaUsers />}
            gradient="from-violet-500 to-purple-600"
          />
          <MetricCard
            title="Products"
            value={formatNumber(summary.totalProducts || 0)}
            change={0}
            icon={<FaBoxOpen />}
            gradient="from-emerald-500 to-green-600"
          />
        </div>

        {/* Insights & Recommendations */}
        {(insights?.length > 0 || recommendations?.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Insights */}
            {insights?.length > 0 && (
              <Card className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
                <CardHeader className="border-b bg-gray-50/50 pb-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <FaChartLine className="text-blue-500" />
                    Business Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {insights.map((insight, index) => (
                      <Alert key={index} className="border-l-4 border-blue-500 bg-blue-50">
                        <AlertDescription className="text-blue-700">{insight}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {recommendations?.length > 0 && (
              <Card className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
                <CardHeader className="border-b bg-gray-50/50 pb-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <FaExclamationTriangle className="text-amber-500" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {recommendations.map((recommendation, index) => (
                      <Alert key={index} className="border-l-4 border-amber-500 bg-amber-50">
                        <AlertDescription className="text-amber-700">{recommendation}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Revenue Chart & Order Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Chart */}
          <Card className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="text-blue-500" />
                Revenue Trend
              </CardTitle>
              <CardDescription className="text-gray-600">Daily revenue during selected period</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis stroke="#3b82f6" />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Revenue']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      name="Revenue" 
                      stroke="#3b82f6" 
                      strokeWidth={2} 
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Order Data */}
          <Card className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="text-amber-500" />
                Order Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Average Order Value</p>
                    <p className="text-xl font-bold">{formatCurrency(summary.averageOrderValue || 0)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Repeat Customer Rate</p>
                    <p className="text-xl font-bold">{ordersData.repeatCustomerRate || 0}%</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-3">Orders by Status</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium capitalize">Pending</span>
                      <span className="text-sm font-bold">{ordersData.pendingOrders || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium capitalize">Fulfilled</span>
                      <span className="text-sm font-bold">{ordersData.fulfilledOrders || 0}</span>
                    </div>
                  </div>
                </div>

                {Object.keys(ordersData.ordersByChannel || {}).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">Orders by Channel</h3>
                    <div className="h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={ordersByChannelData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {ordersByChannelData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [value, 'Orders']} />
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Performance */}
          <Card className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FaBoxOpen className="text-emerald-500" />
                Product Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Products</p>
                    <p className="text-xl font-bold">{summary.totalProducts || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Low Stock Items</p>
                    <p className="text-xl font-bold">{productsData.lowStockProducts?.length || 0}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-3">Best Selling Products</h3>
                  <div className="space-y-2">
                    {(productsData.mostSoldProducts || []).slice(0, 5).map((product, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium">{product.name}</span>
                        <span className="text-sm font-bold">{product.sold} sold</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stream Analytics */}
          <Card className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FaChartLine className="text-violet-500" />
                Stream Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Streams</p>
                    <p className="text-xl font-bold">{streamsData.totalStreams || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Avg. Viewers/Stream</p>
                    <p className="text-xl font-bold">{streamsData.averageViewersPerStream || 0}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Live</p>
                    <p className="text-lg font-bold">{streamsData.liveStreams || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Ended</p>
                    <p className="text-lg font-bold">{streamsData.endedStreams || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Scheduled</p>
                    <p className="text-lg font-bold">{streamsData.scheduledStreams || 0}</p>
                  </div>
                </div>
                
                {streamsData.topPerformingStreams?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">Top Performing Streams</h3>
                    <div className="space-y-2">
                      {streamsData.topPerformingStreams.map((stream, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium">{stream.title}</span>
                          <span className="text-sm font-bold">{stream.viewerCount} viewers</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Store Visits & Followers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Store Visits Chart */}
          <Card className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="text-blue-500" />
                Store Visits by Month
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={visitsChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#3b82f6" />
                    <Tooltip 
                      formatter={(value) => [formatNumber(value), 'Visits']}
                    />
                    <Bar 
                      dataKey="visits" 
                      name="Visits" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Followers */}
          <Card className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FaUsers className="text-indigo-500" />
                Followers
              </CardTitle>
              <CardDescription className="text-gray-600">
                Total Followers: {formatNumber(followersData.totalFollowers || 0)}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {(followersData.recentFollowers || []).map((follower, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {follower.name ? follower.name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2) : 'NA'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {follower.name || 'Unknown Follower'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Followed: {formatDate(follower.followDate)}
                        </p>
                      </div>
                    </div>
                    {follower.orderCount > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{follower.orderCount} orders</p>
                      </div>
                    )}
                  </div>
                ))}
                {(followersData.recentFollowers || []).length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No followers yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders & Ratings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Orders */}
          <Card className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <FaShoppingCart className="text-amber-500" />
                  Recent Orders
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {(ordersData.recentOrders || []).map((order, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">Order #{order.order_id}</h3>
                        <p className="text-sm text-gray-600">
                          {order.buyerName} - {formatDate(order.date)}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'Open' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {order.status}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-600">{order.items} item(s) - {order.channel}</span>
                      <span className="text-sm font-bold">{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>
                ))}
                {(ordersData.recentOrders || []).length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No recent orders</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ratings Distribution */}
          <Card className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FaChartPie className="text-violet-500" />
                Ratings Distribution
              </CardTitle>
              <CardDescription className="text-gray-600">
                Average Rating: {summary.ratingsAverage?.toFixed(1) || 0} ({summary.totalReviews || 0} reviews)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {Object.entries(ratingsDistribution || {}).length > 0 ? (
                <div className="space-y-4">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = ratingsDistribution[rating] || 0;
                    const percentage = summary.totalReviews > 0 
                      ? (count / summary.totalReviews * 100) 
                      : 0;
                    
                    return (
                      <div key={rating} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">{rating} Star</span>
                          <span className="text-sm font-bold">{count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <LinearProgress 
                          variant="determinate" 
                          value={percentage} 
                          className="h-2 rounded-full"
                          sx={{
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: rating >= 4 ? 'var(--emerald-500)' : 
                                             rating === 3 ? 'var(--amber-500)' : 'var(--red-500)',
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No ratings yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Updated MetricCard Component
const MetricCard = ({ title, value, change, icon, gradient }) => {
  const isPositive = change >= 0;
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 transition-all duration-200 hover:shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className={`bg-gradient-to-r ${gradient} p-3 rounded-xl shadow-md`}>
            {React.cloneElement(icon, { className: 'text-white text-xl' })}
          </div>
          <div className={`text-sm font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'} 
            flex items-center gap-1 px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
            {isPositive ? <ArrowUpRight size={16} /> : <TrendingDown size={16} />}
            {Math.abs(change)}%
          </div>
        </div>
        <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6 md:p-8">
    <div className="max-w-[1920px] mx-auto space-y-8">
      {/* Header with date range */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-5 rounded-xl shadow-sm">
        <Skeleton className="h-8 w-[200px] mb-4 md:mb-0" />
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Skeleton className="h-10 w-full md:w-[180px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
      </div>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-6 w-[70px] rounded-full" />
            </div>
            <Skeleton className="h-4 w-[100px] mb-2" />
            <Skeleton className="h-8 w-[150px]" />
          </div>
        ))}
      </div>
      
      {/* Revenue Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-6 w-[180px]" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-4 w-[80px]" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Order and Product Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-6 w-[180px]" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(2)].map((_, j) => (
                    <div key={j} className="bg-gray-50 p-4 rounded-lg">
                      <Skeleton className="h-4 w-[100px] mb-2" />
                      <Skeleton className="h-6 w-[80px]" />
                    </div>
                  ))}
                </div>
                <div>
                  <Skeleton className="h-4 w-[150px] mb-4" />
                  <div className="space-y-2">
                    {[...Array(3)].map((_, j) => (
                      <Skeleton key={j} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-6 w-[180px]" />
              </div>
              <Skeleton className="h-4 w-[220px] mt-1" />
            </CardHeader>
            <CardContent className="pt-6">
              <Skeleton className="h-[300px] w-full rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Customer & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50 pb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-[180px]" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-[120px] mb-2" />
                      <Skeleton className="h-3 w-[100px]" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-[80px] mb-2" />
                    <Skeleton className="h-3 w-[60px]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50 pb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-[180px]" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                  <Skeleton className="h-5 w-[200px] mb-3" />
                  <Skeleton className="h-4 w-[250px] mb-2" />
                  <Skeleton className="h-4 w-[180px]" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Category Table */}
      <Card className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
        <CardHeader className="border-b bg-gray-50/50 pb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-[180px]" />
          </div>
          <Skeleton className="h-4 w-[220px] mt-1" />
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  {[...Array(5)].map((_, i) => (
                    <th key={i} className="px-6 py-3 bg-gray-50">
                      <Skeleton className="h-4 w-full" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

const ErrorDisplay = ({ message, onRetry }) => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6 md:p-8 flex items-center justify-center">
    <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Data Loading Error</h2>
      <AlertDescription className="text-gray-600 mb-6">{message}</AlertDescription>
      {onRetry && (
        <Button onClick={onRetry} className="w-full">
          Retry
        </Button>
      )}
    </div>
  </div>
);

export default AnalyticsAndInsights;
