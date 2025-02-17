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
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-8 mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-2">
            <Button variant="outline" className="bg-white hover:bg-gray-50">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange}
            </Button>
            <Select onValueChange={(value) => setDateRange(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="This Week">This Week</SelectItem>
                <SelectItem value="This Month">This Month</SelectItem>
                <SelectItem value="This Quarter">This Quarter</SelectItem>
                <SelectItem value="This Year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(revenue.total)}
            change={revenue.growth}
            icon={<FaChartLine />}
            color="blue"
          />
          <MetricCard
            title="Orders"
            value={formatNumber(orders.total)}
            change={orders.growth}
            icon={<FaShoppingCart />}
            color="green"
          />
          <MetricCard
            title="Customers"
            value={formatNumber(customers.total)}
            change={customers.new}
            icon={<FaUsers />}
            color="purple"
          />
          <MetricCard
            title="Active Products"
            value={formatNumber(products.active)}
            change={products.turnoverRate}
            icon={<FaBoxOpen />}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white -sm hover:-md transition-all duration-200 border-none">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg font-semibold">Revenue & Orders Trend</CardTitle>
              <CardDescription className="text-gray-500">Monthly performance analysis</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="min-w-[300px]">
                <ChartContainer
                  config={{
                    sales: {
                      label: "Sales",
                      color: "hsl(var(--chart-1))",
                    },
                    orders: {
                      label: "Orders",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[200px] md:h-[350px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis
                        dataKey="month"
                        stroke="#6b7280"
                        tick={{ fontSize: window.innerWidth < 768 ? 12 : 14 }}
                      />
                      <YAxis
                        yAxisId="left"
                        stroke="#6b7280"
                        tick={{ fontSize: window.innerWidth < 768 ? 12 : 14 }}
                        width={window.innerWidth < 768 ? 40 : 60}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#6b7280"
                        tick={{ fontSize: window.innerWidth < 768 ? 12 : 14 }}
                        width={window.innerWidth < 768 ? 40 : 60}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend
                        wrapperStyle={{ fontSize: window.innerWidth < 768 ? 12 : 14 }}
                      />
                      <Line yAxisId="left" type="monotone" dataKey="sales" stroke="var(--color-sales)" strokeWidth={2} />
                      <Line yAxisId="right" type="monotone" dataKey="orders" stroke="var(--color-orders)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white -sm hover:-md transition-all duration-200 border-none">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg font-semibold">Product Category Performance</CardTitle>
              <CardDescription className="text-gray-500">Breakdown of revenue by category</CardDescription>
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white -sm hover:-md transition-all duration-200 border-none">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg font-semibold">Customer Acquisition</CardTitle>
              <CardDescription className="text-gray-500">New vs. returning customers</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="min-w-[300px]">
                <ChartContainer
                  config={{
                    newCustomers: {
                      label: "New Customers",
                      color: COLORS[0], // Use the first color from the COLORS array
                    },
                    returningCustomers: {
                      label: "Returning Customers",
                      color: COLORS[1], // Use the second color from the COLORS array
                    },
                  }}
                  className="h-[200px] md:h-[350px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={customerData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis
                        dataKey="name"
                        stroke="#6b7280"
                        tick={{ fontSize: window.innerWidth < 768 ? 10 : 14 }}
                      />
                      <YAxis
                        stroke="#6b7280"
                        tick={{ fontSize: window.innerWidth < 768 ? 10 : 14 }}
                        width={window.innerWidth < 768 ? 35 : 60}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend
                        wrapperStyle={{ fontSize: window.innerWidth < 768 ? 10 : 14 }}
                      />
                      <Bar dataKey="newCustomers" fill={COLORS[0]} />
                      <Bar dataKey="returningCustomers" fill={COLORS[1]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white -sm hover:-md transition-all duration-200 border-none">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg font-semibold">Top Selling Products</CardTitle>
              <CardDescription className="text-gray-500">Most popular items</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {products.topSelling.map((product, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{product.name || `Product ${index + 1}`}</p>
                      <p className="text-sm text-gray-500">Sold: {product.soldCount}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₦{product.revenue}</p>
                      <p className="text-sm text-gray-500">Orders: {product.orderCount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white -sm hover:-md transition-all duration-200 border-none">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg font-semibold">Key Insights</CardTitle>
              <CardDescription className="text-gray-500">Important metrics and recommendations</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {formattedRecommendations.map((rec, index) => (
                <Alert key={index} className="mb-4 border-l-4 border-blue-500 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <AlertTitle className="font-semibold text-blue-700">{rec.message}</AlertTitle>
                  <AlertDescription className="text-blue-600">
                    {rec.affectedProducts?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium">Affected Products:</p>
                        <ul className="mt-2 space-y-2">
                          {rec.affectedProducts.map((product, idx) => (
                            <li key={product.id || idx} className="text-sm text-gray-600">
                              {product.name}
                              {product.currentStock !== 'N/A' &&
                                ` - Stock: ${product.currentStock}`}
                              {product.daysListed !== 'N/A' &&
                                ` - Listed: ${product.daysListed} days ago`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-white -sm hover:-md transition-all duration-200 border-none">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg font-semibold">Recommendations</CardTitle>
              <CardDescription className="text-gray-500">Actions to improve performance</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
                  <div className="bg-blue-100 p-2 rounded-full shrink-0">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-700">Expand Electronics Category</h3>
                    <p className="text-sm text-blue-600 mt-1">
                      Given the strong performance of the Electronics category, consider expanding your product range or
                      running promotions to capitalize on this trend.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg">
                  <div className="bg-green-100 p-2 rounded-full shrink-0">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-700">Enhance Customer Loyalty Program</h3>
                    <p className="text-sm text-green-600 mt-1">
                      With the increase in returning customers, consider enhancing your loyalty program to further encourage
                      repeat purchases and increase customer lifetime value.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-purple-50 rounded-lg">
                  <div className="bg-purple-100 p-2 rounded-full shrink-0">
                    <ShoppingCart className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-700">Optimize Checkout Process</h3>
                    <p className="text-sm text-purple-600 mt-1">
                      With the improved conversion rate, focus on streamlining your checkout process. Implement one-click
                      purchasing and guest checkout options to reduce cart abandonment.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Alerts */}
        <div className="bg-white p-6 rounded-lg  mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaExclamationTriangle className="text-yellow-500 mr-2" />
            Inventory Alerts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formattedRecommendations[0].affectedProducts.map(product => (
              <div key={product.id} className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-gray-600">
                  Current Stock: <span className="text-red-500">{product.currentStock}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Category Analysis */}
        <div className="bg-white p-6 rounded-lg ">
          <h2 className="text-xl font-semibold mb-4">Category Performance</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Price
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(categoryAnalysis).map(([category, stats]) => (
                  <tr key={category}>
                    <td className="px-6 py-4 whitespace-nowrap">{category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatCurrency(stats.totalRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{stats.totalOrders}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatCurrency(stats.averagePrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, change, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className="bg-white p-6 rounded-lg ">
      <div className="flex items-center justify-between mb-4">
        <div className={`${colorClasses[color]} p-3 rounded-full`}>
          {React.cloneElement(icon, { className: 'text-white text-xl' })}
        </div>
        <div className="text-sm font-medium text-green-500">
          {change > 0 ? '+' : ''}{change}%
        </div>
      </div>
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
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
