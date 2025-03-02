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
  const [dateRange, setDateRange] = useState("30d");
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const response = await fetch(`${BASE_URL}/seller/advanced-analytics?timeframe=${dateRange}`, {
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
  }, [dateRange]);

  const handleRetry = () => {
    fetchAnalytics();
  };

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay message={error} onRetry={handleRetry} />;
  if (!analyticsData) return <ErrorDisplay message="No data available" onRetry={handleRetry} />;

  const {
    revenue,
    orders,
    products,
    customers,
    performance,
    categoryAnalysis,
    recommendations
  } = analyticsData;

  const formattedRecommendations = formatRecommendations(recommendations);

  // Transform category analysis data for the pie chart
  const categoryData = Object.entries(categoryAnalysis || {}).map(([name, data]) => ({
    name,
    value: data.totalRevenue
  }));

  const salesData = [
    {
      month: "Current",
      sales: revenue?.lastMonth || 0,
      orders: orders?.lastMonth || 0
    }
  ];

  const customerData = [
    {
      name: "Current",
      newCustomers: (customers?.total || 0) - (customers?.returning || 0),
      returningCustomers: customers?.returning || 0
    }
  ];

  // Transform performance metrics into array format for display
  const performanceMetrics = [
    { name: 'Product Utilization', value: performance?.productUtilization || 0 },
    { name: 'Order Completion Rate', value: performance?.orderCompletionRate || 0 },
    { name: 'Stock Efficiency', value: performance?.stockEfficiency || 0 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
        {/* Header with Date Range Selector */}
        {/* <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-5 rounded-xl shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Analytics Dashboard</h1>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Select value={dateRange} onValueChange={(value) => setDateRange(value)}>
              <SelectTrigger className="w-full md:w-[180px] bg-white border-2">
                <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                <SelectValue>
                  {dateRange === "7d" ? "Last 7 Days" : 
                   dateRange === "30d" ? "Last 30 Days" : 
                   dateRange === "90d" ? "Last 90 Days" : 
                   dateRange === "365d" ? "Last Year" : "Custom Range"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="365d">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRetry} className="bg-white hover:bg-gray-50 border-2">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div> */}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(revenue?.total || 0)}
            change={revenue?.growth || 0}
            icon={<FaChartLine />}
            gradient="from-blue-500 to-indigo-600"
          />
          <MetricCard
            title="Orders"
            value={formatNumber(orders?.total || 0)}
            change={orders?.growth || 0}
            icon={<FaShoppingCart />}
            gradient="from-amber-500 to-orange-600"
          />
          <MetricCard
            title="Customers"
            value={formatNumber(customers?.total || 0)}
            change={customers?.growth || 0}
            icon={<FaUsers />}
            gradient="from-violet-500 to-purple-600"
          />
          <MetricCard
            title="Active Products"
            value={formatNumber(products?.active || 0)}
            change={products?.turnoverRate || 0}
            icon={<FaBoxOpen />}
            gradient="from-emerald-500 to-green-600"
          />
        </div>

        {/* Revenue Breakdown Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue by Category */}
          <Card className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FaChartPie className="text-blue-500" />
                Revenue by Category
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {Object.entries(revenue?.byCategory || {}).map(([category, amount], index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm font-medium text-gray-700">{category}</span>
                    <span className="text-sm font-bold">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Revenue by Payment Method */}
          <Card className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="text-emerald-500" />
                Revenue by Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {Object.entries(revenue?.byPaymentMethod || {}).map(([method, amount], index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm font-medium text-gray-700">{'Paystack'}</span>
                    <span className="text-sm font-bold">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Analytics & Product Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Order Analytics */}
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
                    <p className="text-xl font-bold">{formatCurrency(orders?.averageOrderValue || 0)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Fulfillment Time</p>
                    <p className="text-xl font-bold">{orders?.fulfillmentTime || 0} days</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-3">Orders by Status</h3>
                  <div className="space-y-2">
                    {Object.entries(orders?.byStatus || {}).map(([status, count], index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium capitalize">{status || 'Undefined'}</span>
                        <span className="text-sm font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
                    <p className="text-sm text-gray-600">Active Products</p>
                    <p className="text-xl font-bold">{products?.active || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Low Stock Items</p>
                    <p className="text-xl font-bold">{products?.lowStock || 0}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-3">Top Selling Products</h3>
                  <div className="space-y-2">
                    {(products?.topSelling || []).slice(0, 5).map((product, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium">{product.name}</span>
                        <span className="text-sm font-bold">{product.soldCount} sold</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics & Revenue Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Metrics */}
          <Card className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FaChartLine className="text-violet-500" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Revenue Growth</span>
                    <span className={`text-sm font-bold ${revenue?.growth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {formatPercentage(revenue?.growth || 0)}
                    </span>
                  </div>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.abs(revenue?.growth || 0)} 
                    className="h-2 rounded-full"
                    sx={{
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: revenue?.growth >= 0 ? 'var(--emerald-500)' : 'var(--red-500)',
                      }
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Order Growth</span>
                    <span className={`text-sm font-bold ${orders?.growth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {formatPercentage(orders?.growth || 0)}
                    </span>
                  </div>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.abs(orders?.growth || 0)} 
                    className="h-2 rounded-full"
                    sx={{
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: orders?.growth >= 0 ? 'var(--emerald-500)' : 'var(--red-500)',
                      }
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Customer Growth</span>
                    <span className={`text-sm font-bold ${customers?.growth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {formatPercentage(customers?.growth || 0)}
                    </span>
                  </div>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.abs(customers?.growth || 0)} 
                    className="h-2 rounded-full"
                    sx={{
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: customers?.growth >= 0 ? 'var(--emerald-500)' : 'var(--red-500)',
                      }
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Product Turnover</span>
                    <span className={`text-sm font-bold ${products?.turnoverRate >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {formatPercentage(products?.turnoverRate || 0)}
                    </span>
                  </div>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.abs(products?.turnoverRate || 0)} 
                    className="h-2 rounded-full"
                    sx={{
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: products?.turnoverRate >= 0 ? 'var(--emerald-500)' : 'var(--red-500)',
                      }
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue & Orders Trend */}
          <Card className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="text-blue-500" />
                Revenue & Orders Trend
              </CardTitle>
              <CardDescription className="text-gray-600">Monthly performance analysis</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis yAxisId="left" stroke="#3b82f6" />
                    <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'sales' ? formatCurrency(value) : formatNumber(value),
                        name === 'sales' ? 'Revenue' : 'Orders'
                      ]}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="sales" 
                      name="Revenue" 
                      stroke="#3b82f6" 
                      strokeWidth={2} 
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="orders" 
                      name="Orders" 
                      stroke="#f59e0b" 
                      strokeWidth={2} 
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Category Performance & Customer Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Category Performance */}
          <Card className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FaChartPie className="text-indigo-500" />
                Product Category Performance
              </CardTitle>
              <CardDescription className="text-gray-600">Breakdown of revenue by category</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Customer Insights */}
          <Card className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="text-violet-500" />
                Customer Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Customers</p>
                    <p className="text-xl font-bold">{formatNumber(customers?.total || 0)}</p>
                    <p className="text-sm text-emerald-600 flex items-center mt-1">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      {formatPercentage(customers?.growth || 0)} growth
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Returning Customers</p>
                    <p className="text-xl font-bold">{formatNumber(customers?.returning || 0)}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatPercentage((customers?.returning / customers?.total) * 100 || 0)} of total
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Customer Retention</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Repeat Purchase Rate</span>
                      <span className="text-sm font-bold">
                        {formatPercentage(customers?.repeatPurchaseRate || 0)}
                      </span>
                    </div>
                    <LinearProgress
                      variant="determinate"
                      value={customers?.repeatPurchaseRate || 0}
                      className="h-2 rounded-full"
                      sx={{
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: 'var(--primary)',
                        }
                      }}
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Average Customer Value</span>
                      <span className="text-sm font-bold">
                        {formatCurrency(customers?.averageValue || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Customer Activity</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">New This Period</span>
                      <span className="text-sm font-bold">{formatNumber(customers?.new || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Last 30 Days</span>
                      <span className="text-sm font-bold">{formatNumber(customers?.active30Days || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">At Risk</span>
                      <span className="text-sm font-bold text-amber-600">{formatNumber(customers?.atRisk || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Customers & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Customers */}
          <TopCustomersCard customers={customers?.topCustomers || []} />

          {/* Recommendations */}
          <Card className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FaExclamationTriangle className="text-amber-500" />
                Key Insights & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {formattedRecommendations.length > 0 ? (
                  formattedRecommendations.map((rec, index) => (
                    <Alert key={index} className="border-l-4 border-blue-500 bg-blue-50">
                      <AlertTitle className="font-semibold text-blue-700">{rec.message}</AlertTitle>
                      {rec.affectedProducts?.length > 0 && (
                        <AlertDescription className="text-blue-600 mt-2">
                          <p className="text-sm font-medium">Affected Products:</p>
                          <ul className="mt-1 space-y-1">
                            {rec.affectedProducts.slice(0, 3).map((product, idx) => (
                              <li key={idx} className="text-sm">
                                {product.name}
                                {product.currentStock !== 'N/A' && ` - Stock: ${product.currentStock}`}
                              </li>
                            ))}
                            {rec.affectedProducts.length > 3 && (
                              <li className="text-sm font-medium">
                                +{rec.affectedProducts.length - 3} more products
                              </li>
                            )}
                          </ul>
                        </AlertDescription>
                      )}
                    </Alert>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No recommendations available at this time.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Items Alert */}
        {formattedRecommendations.some(rec => rec.type === 'inventory' && rec.affectedProducts?.length > 0) && (
          <Card className="bg-white rounded-xl shadow-sm border-none overflow-hidden mb-8">
            <CardHeader className="border-b bg-amber-50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-amber-700">
                  <FaExclamationTriangle className="text-amber-500" />
                  Low Stock Alert
                  <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                    {formattedRecommendations.find(rec => rec.type === 'inventory')?.affectedProducts?.length || 0}
                  </span>
                </CardTitle>
                <Button variant="outline" size="sm" className="bg-white hover:bg-amber-50 border-amber-200 text-amber-700">
                  View All
                </Button>
              </div>
              <CardDescription className="text-amber-600">
                {formattedRecommendations.find(rec => rec.type === 'inventory')?.message || 
                 `${formattedRecommendations.find(rec => rec.type === 'inventory')?.affectedProducts?.length || 0} products are running low on stock. Consider restocking soon.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {formattedRecommendations
                  .filter(rec => rec.type === 'inventory' && rec.affectedProducts?.length > 0)
                  .flatMap(rec => rec.affectedProducts)
                  .map((product, index) => (
                    <div key={index} className="p-4 bg-amber-50 rounded-lg border border-amber-100 hover:shadow-md transition-all duration-200">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800 line-clamp-2">{product.name}</h3>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.currentStock < 0 ? 'bg-red-100 text-red-800' : 
                          product.currentStock === 0 ? 'bg-amber-100 text-amber-800' : 
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {product.currentStock < 0 ? 'Backorder' : product.currentStock === 0 ? 'Out of Stock' : 'Low Stock'}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">Current Stock:</span>
                        <span className={`text-sm font-bold flex items-center ${
                          product.currentStock < 0 ? 'text-red-600' : 
                          product.currentStock === 0 ? 'text-amber-600' : 
                          'text-amber-600'
                        }`}>
                          {product.currentStock < 0 && <FaExclamationCircle className="mr-1 text-red-600" />}
                          {product.currentStock === 0 && <FaExclamationTriangle className="mr-1 text-amber-600" />}
                          {product.currentStock}
                        </span>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-3 bg-white hover:bg-amber-50 border-amber-200 text-amber-700">
                        Restock
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Analysis Table */}
        <Card className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50 pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FaChartPie className="text-indigo-500" />
              Category Performance Details
            </CardTitle>
            <CardDescription className="text-gray-600">
              Detailed breakdown of performance by product category
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg. Price
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Growth
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(categoryAnalysis || {}).map(([category, stats]) => (
                    <tr key={category} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                        {formatCurrency(stats.totalRevenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {formatNumber(stats.totalOrders)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {formatCurrency(stats.averagePrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          stats.growth > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {stats.growth > 0 ? '+' : ''}{formatPercentage(stats.growth)}
                        </span>
                      </td>
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
