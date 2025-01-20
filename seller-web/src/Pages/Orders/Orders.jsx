import { useState, useEffect } from 'react'

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Link } from 'react-router-dom'
import SearchBar from '@/Components/ui/DashboardHomepageUi/SearchBar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import LinearProgress from "@mui/material/LinearProgress";
import { BASE_URL } from "@/Constants/Server";
import Header from "@/Components/ui/Header/Header";

export default function OrdersDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [sellerId, setSellerId] = useState(null)
  const [activeTab, setActiveTab] = useState('all')

  // Filter orders based on active tab
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'process') return order.shipping.tracking.status === 'pending';
    if (activeTab === 'transit') return ['pickup_arranged', 'picked_up', 'in_transit'].includes(order.shipping.tracking.status);
    if (activeTab === 'delivered') return order.shipping.tracking.status === 'delivered';
    if (activeTab === 'cancelled') return order.shipping.tracking.status === 'failed';
    return true;
  });

  console.log(sellerId)

  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        const sellerToken = localStorage.getItem('sellerToken')
        if (sellerToken) {
          const tokenData = JSON.parse(sellerToken)
          const token = tokenData.data
          const response = await fetch(`${BASE_URL}/seller/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          const data = await response.json()
          setSellerId(data._id)
          fetchOrders(data._id, token)
        }
      } catch (error) {
        console.error('Error fetching seller profile:', error)
        setLoading(false)
      }
    }

    const fetchOrders = async (id, token) => {
      try {
        const response = await fetch(`${BASE_URL}/order/seller/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await response.json()
        setOrders(data)
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSellerProfile()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[80dvh]">
        <div className="w-1/4">
          <LinearProgress color="success" />
        </div>
      </div>
    )
  }

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-700',
      pickup_arranged: 'bg-blue-100 text-blue-700',
      picked_up: 'bg-green-100 text-green-700',
      in_transit: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <>
      <Header headerTitle="ORDERS" showHeader={true} showSearch />

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="border-b h-auto p-0 bg-transparent">
            <TabsTrigger
              value="all"
              className="text-lg data-[state=active]:text-green-600 data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-6 pb-4"
            >
              All Orders
            </TabsTrigger>
            <TabsTrigger
              value="process"
              className="text-lg data-[state=active]:text-green-600 data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-6 pb-4"
            >
              To Process
            </TabsTrigger>
            <TabsTrigger
              value="transit"
              className="text-lg data-[state=active]:text-green-600 data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-6 pb-4"
            >
              Transit
            </TabsTrigger>
            <TabsTrigger
              value="delivered"
              className="text-lg data-[state=active]:text-green-600 data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-6 pb-4"
            >
              Delivered
            </TabsTrigger>
            <TabsTrigger
              value="cancelled"
              className="text-lg data-[state=active]:text-green-600 data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-6 pb-4"
            >
              Cancelled
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="bg-[#F8FAF9] rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Latest Orders</h2>
            <div className="flex gap-4">
              <Select defaultValue="month">
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Month to date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month to date</SelectItem>
                  <SelectItem value="week">Week to date</SelectItem>
                  <SelectItem value="year">Year to date</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="channel">
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="channel">Channel</SelectItem>
                  <SelectItem value="live">Live show</SelectItem>
                  <SelectItem value="store">Store</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Order Details</TableHead>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Items</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Payment</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order._id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{order._id}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{`${order.buyer.firstName} ${order.buyer.lastName}`}</div>
                        <div className="text-sm text-gray-500">{order.delivery_address.city}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="text-sm">
                            {item.productName} x {item.quantity}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.shipping.tracking.status)}>
                        {order.shipping.tracking.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          order.paymentInfo.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : order.paymentInfo.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }
                      >
                        {order.paymentInfo.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      ₦{order.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Link to={`/dashboard/order/${order._id}`}>
                        <Button
                          variant="secondary"
                          className="bg-green-600 text-white hover:bg-green-700"
                        >
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center mt-6">
            <Select defaultValue="20">
              <SelectTrigger className="bg-white w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20 PER PAGE</SelectItem>
                <SelectItem value="30">30 PER PAGE</SelectItem>
                <SelectItem value="40">40 PER PAGE</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-4">
              <Button variant="outline" className="bg-white">
                ← Back
              </Button>
              <Button variant="outline" className="bg-white">
                Next →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

