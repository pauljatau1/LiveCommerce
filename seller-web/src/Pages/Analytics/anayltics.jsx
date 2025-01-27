"use client"

import { useState, useEffect } from "react"
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
} from "recharts"
import {
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import LinearProgress from "@mui/material/LinearProgress"
import { BASE_URL } from "@/Constants/Server"
import { useOutletContext } from 'react-router-dom';
import Header from "@/components/ui/Header/Header"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function AnalyticsAndInsights() {
  const { setHeaderName, setNavName } = useOutletContext()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [dateRange, setDateRange] = useState("This Month")
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setHeaderName('Analytics & Insights')
    setNavName('')
  }, [])

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const sellerToken = localStorage.getItem("sellerToken")
        if (sellerToken) {
          const tokenData = JSON.parse(sellerToken)
          const token = tokenData.data
          const response = await fetch(`${BASE_URL}/seller/analytics/metrics`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          const data = await response.json()
          setAnalyticsData(data)
        }
      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading || !analyticsData) {
    return (
      <div className="flex flex-col justify-center items-center h-[80dvh]">
        <div className="w-1/4">
          <LinearProgress color="success" />
        </div>
      </div>
    )
  }

  const categoryData = analyticsData.categories.performance.map(cat => ({
    name: cat.category,
    value: cat.revenue
  }))

  const salesData = [
    { 
      month: "Current", 
      sales: analyticsData.revenue.lastMonth,
      orders: analyticsData.orders.lastMonth 
    }
  ]

  const customerData = [
    { 
      name: "Current", 
      newCustomers: analyticsData.customers.total - analyticsData.customers.returning,
      returningCustomers: analyticsData.customers.returning 
    }
  ]

  return (
    <div className="min-h-screen">
      <div className="p-4 md:p-8">
        <div className="mx-auto">
          <div className="flex justify-end items-center mb-8">
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <Button variant="outline" className="w-full md:w-[240px] justify-start text-left font-normal">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <Card className="bg-white -lg hover:-xl transition- duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  ₦{analyticsData.revenue.total.toLocaleString()}
                </div>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" /> 
                  {analyticsData.trends.monthOverMonth.revenue}% from last month
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white -lg hover:-xl transition- duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {analyticsData.orders.total.toLocaleString()}
                </div>
                <p className="text-xs text-blue-500 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" /> 
                  {analyticsData.trends.monthOverMonth.orders}% from last month
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white -lg hover:-xl transition- duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Customers</CardTitle>
                <Users className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {analyticsData.customers.total.toLocaleString()}
                </div>
                <p className="text-xs text-purple-500 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" /> 
                  {analyticsData.trends.monthOverMonth.customers}% from last month
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white -lg hover:-xl transition- duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {analyticsData.storeMetrics.conversionRate.toLocaleString()}%
                </div>
                <p className="text-xs text-orange-500 flex items-center mt-1">
                  Average order value: ₦{analyticsData.storeMetrics.averageOrderValue.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-8">
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl font-semibold text-gray-800">Revenue & Orders Trend</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
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

            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl font-semibold text-gray-800">Product Category Performance</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-8">
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl font-semibold text-gray-800">Customer Acquisition</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <div className="min-w-[300px]">
                  <ChartContainer
                    config={{
                      newCustomers: {
                        label: "New Customers",
                        color: "hsl(var(--chart-3))",
                      },
                      returningCustomers: {
                        label: "Returning Customers",
                        color: "hsl(var(--chart-4))",
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
                        <Bar dataKey="newCustomers" stackId="a" fill="var(--color-newCustomers)" />
                        <Bar dataKey="returningCustomers" stackId="a" fill="var(--color-returningCustomers)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl font-semibold text-gray-800">Top Selling Products</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.products.topSelling.map((product, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{product.name || `Product ${index + 1}`}</p>
                      <p className="text-sm text-gray-500">Sold: {product.soldCount}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₦{product.revenue.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Orders: {product.orderCount}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-8">
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl font-semibold text-gray-800">Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.insights.map((insight, index) => (
                  <Alert key={index}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{insight.metric}</AlertTitle>
                    <AlertDescription>
                      {insight.recommendation}
                      {insight.percentageChange > 0 && (
                        <span className="text-green-600"> (+{insight.percentageChange}%)</span>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl font-semibold text-gray-800">Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-2">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Expand Electronics Category</h3>
                    <p className="text-sm text-gray-600">
                      Given the strong performance of the Electronics category, consider expanding your product range or
                      running promotions to capitalize on this trend.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Enhance Customer Loyalty Program</h3>
                    <p className="text-sm text-gray-600">
                      With the increase in returning customers, consider enhancing your loyalty program to further encourage
                      repeat purchases and increase customer lifetime value.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <ShoppingCart className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Optimize Checkout Process</h3>
                    <p className="text-sm text-gray-600">
                      With the improved conversion rate, focus on streamlining your checkout process. Implement one-click
                      purchasing and guest checkout options to reduce cart abandonment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

