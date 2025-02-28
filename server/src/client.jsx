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
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import LinearProgress from "@mui/material/LinearProgress";
import { BASE_URL } from "@/Constants/Server";
import { useOutletContext } from 'react-router-dom';
import Header from "@/components/ui/Header/Header";
import { FaChartLine, FaShoppingCart, FaUsers, FaBoxOpen, FaChartPie, FaExclamationTriangle } from 'react-icons/fa';
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
                  {customer.firstName?.[0]}{customer.lastName?.[0]}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {customer.firstName} {customer.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  First Purchase: {formatDate(customer.firstPurchaseDate)}
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dateRange, setDateRange] = useState("This Month");
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setHeaderName('Analytics & Insights');
    setNavName('');
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const sellerToken = localStorage.getItem("sellerToken");
        if (!sellerToken) throw new Error("No auth token found");

        const tokenData = JSON.parse(sellerToken);
        const response = await fetch(`${BASE_URL}/seller/advanced-analytics?timeframe=30d`, {
          headers: {
            Authorization: `Bearer ${tokenData.data}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch analytics");

        const data = await response.json();
        setAnalyticsData(data);
      } catch (error) {
        console.error("Error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay message={error} />;
  if (!analyticsData) return <ErrorDisplay message="No data available" />;

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
        {/* Key Metrics Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(revenue.total)}
            change={revenue.growth}
            icon={<FaChartLine />}
            color="indigo"
            gradient="from-indigo-500 to-blue-600"
          />
          <MetricCard
            title="Orders"
            value={formatNumber(orders.total)}
            change={orders.growth}
            icon={<FaShoppingCart />}
            color="emerald"
            gradient="from-emerald-500 to-green-600"
          />
          <MetricCard
            title="Customers"
            value={formatNumber(customers.total)}
            change={customers.growth}
            icon={<FaUsers />}
            color="violet"
            gradient="from-violet-500 to-purple-600"
          />
          <MetricCard
            title="Active Products"
            value={formatNumber(products.active)}
            change={products.turnoverRate}
            icon={<FaBoxOpen />}
            color="amber"
            gradient="from-amber-500 to-orange-600"
          />
        </div>

        {/* Revenue & Performance Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <RevenueBreakdownCard 
            title="Revenue by Category" 
            data={revenue.byCategory} 
          />
          <PerformanceMetricsCard
            title="Performance Metrics"
            metrics={[
              { name: 'Revenue Growth', value: revenue.growth, color: 'primary' },
              { name: 'Order Growth', value: orders.growth, color: 'secondary' },
              { name: 'Customer Growth', value: customers.growth, color: 'success' },
              { name: 'Product Turnover', value: products.turnoverRate, color: 'warning' }
            ]}
          />
        </div>

        {/* Orders & Products Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-white -lg rounded-xl border-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="text-blue-500" />
                Order Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Average Order Value</p>
                    <p className="text-xl font-bold">{formatCurrency(orders.averageOrderValue)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Fulfillment Time</p>
                    <p className="text-xl font-bold">{orders.fulfillmentTime} days</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Orders by Status</h3>
                  {Object.entries(orders.byStatus || {}).map(([status, count], index) => (
                    <div key={index} className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600 capitalize">{status || 'Processing'}</span>
                      <span className="text-sm font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white -lg rounded-xl border-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FaBoxOpen className="text-amber-500" />
                Product Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Active Products</p>
                    <p className="text-xl font-bold">{products.active}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Low Stock Items</p>
                    <p className="text-xl font-bold">{products.lowStock}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Top Selling Products</h3>
                  <div className="space-y-2">
                    {products.topSelling?.map((product, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{product.name}</span>
                        <span className="text-sm text-gray-600">{formatNumber(product.soldCount || 0)} sold</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Analysis & Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-white -lg rounded-xl border-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FaChartPie className="text-emerald-500" />
                Product Category Performance
              </CardTitle>
              <CardDescription className="text-gray-600">Breakdown of revenue by category</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="min-w-[300px]">
                <ChartContainer
                  config={{
                    value: {
                      label: "Sales",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[200px] md:h-[350px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={window.innerWidth < 768 ? 60 : 100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          window.innerWidth > 768 ? `${name} ${(percent * 100).toFixed(0)}%` : `${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white -lg rounded-xl border-none overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="text-blue-500" />
                Sales Trend
              </CardTitle>
              <CardDescription className="text-gray-600">Monthly sales and orders comparison</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ChartContainer className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#8884d8" />
                    <Line type="monotone" dataKey="orders" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Customer Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <TopCustomersCard customers={analyticsData.customers?.topCustomers || []} />
          <Card className="bg-white -lg rounded-xl border-none overflow-hidden">
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
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Updated MetricCard Component
const MetricCard = ({ title, value, change, icon, color, gradient }) => {
  return (
    <div className="bg-white rounded-xl -lg overflow-hidden">
      <div className={`p-6 transition-all duration-200 hover:scale-[1.02]`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`bg-gradient-to-r ${gradient} p-3 rounded-xl`}>
            {React.cloneElement(icon, { className: 'text-white text-xl' })}
          </div>
          <div className={`text-sm font-medium ${change > 0 ? 'text-emerald-500' : 'text-red-500'} 
            flex items-center gap-1`}>
            {change > 0 ? <ArrowUpRight size={16} /> : <TrendingDown size={16} />}
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
  <div className="p-6 space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-[100px] mb-4" />
            <Skeleton className="h-8 w-[200px]" />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const ErrorDisplay = ({ message }) => (
  <div className="p-6">
    <Alert variant="destructive">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  </div>
);

export default AnalyticsAndInsights;
