"use client"

import { useState } from "react"
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

const salesData = [
  { month: "Jan", sales: 4000, orders: 240 },
  { month: "Feb", sales: 3000, orders: 198 },
  { month: "Mar", sales: 5000, orders: 280 },
  { month: "Apr", sales: 4500, orders: 308 },
  { month: "May", sales: 6000, orders: 389 },
  { month: "Jun", sales: 5500, orders: 380 },
]

const productData = [
  { name: "Electronics", value: 4000 },
  { name: "Clothing", value: 3000 },
  { name: "Books", value: 2000 },
  { name: "Home & Garden", value: 1500 },
  { name: "Sports", value: 1000 },
]

const customerData = [
  { name: "Week 1", newCustomers: 400, returningCustomers: 300 },
  { name: "Week 2", newCustomers: 450, returningCustomers: 320 },
  { name: "Week 3", newCustomers: 500, returningCustomers: 350 },
  { name: "Week 4", newCustomers: 470, returningCustomers: 380 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function AnalyticsAndInsights() {
  const [dateRange, setDateRange] = useState("This Month")

  return (
    <div className="min-h-screen p-8">
      <div className=" mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white -lg hover:-xl transition- duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">$45,231.89</div>
              <p className="text-xs text-green-500 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" /> +20.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white -lg hover:-xl transition- duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">2,350</div>
              <p className="text-xs text-blue-500 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" /> +10.5% from last month
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white -lg hover:-xl transition- duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Customers</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">12,234</div>
              <p className="text-xs text-purple-500 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" /> +15.2% from last month
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white -lg hover:-xl transition- duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">3.2%</div>
              <p className="text-xs text-orange-500 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" /> +2.1% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-white -lg hover:-xl transition- duration-300">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">Revenue & Orders Trend</CardTitle>
            </CardHeader>
            <CardContent>
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
                className="h-[350px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis yAxisId="left" stroke="#6b7280" />
                    <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="sales" stroke="var(--color-sales)" strokeWidth={2} />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      stroke="var(--color-orders)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="bg-white -lg hover:-xl transition- duration-300">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">Product Category Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: {
                    label: "Sales",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[350px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {productData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-white -lg hover:-xl transition- duration-300">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">Customer Acquisition</CardTitle>
            </CardHeader>
            <CardContent>
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
                className="h-[350px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={customerData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="newCustomers" stackId="a" fill="var(--color-newCustomers)" />
                    <Bar dataKey="returningCustomers" stackId="a" fill="var(--color-returningCustomers)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="bg-white -lg hover:-xl transition- duration-300">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">Key Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Revenue Growth</AlertTitle>
                <AlertDescription>
                  Your revenue has increased by 20.1% compared to last month. This growth is primarily driven by the
                  Electronics category.
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Customer Retention</AlertTitle>
                <AlertDescription>
                  Your customer retention rate is improving. 45% of this month's sales came from returning customers, up
                  from 38% last month.
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Product Performance</AlertTitle>
                <AlertDescription>
                  The Clothing category has shown a 15% increase in sales. Consider expanding your product range in this
                  category.
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Conversion Rate Optimization</AlertTitle>
                <AlertDescription>
                  Your conversion rate has improved to 3.2%. Focus on optimizing your product pages and checkout process
                  to further increase this rate.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white -lg hover:-xl transition- duration-300 mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">Recommendations</CardTitle>
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
  )
}

