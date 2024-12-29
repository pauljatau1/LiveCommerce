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
import Loader from "@/Components/Loader"
import { BASE_URL } from "@/Constants/Server"

export default function OrdersDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [sellerId, setSellerId] = useState(null)

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
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    )
  }

  return (
    <>
      <SearchBar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
   
      <div className="p-6">
       

        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="border-b h-auto p-0 bg-transparent">
            <TabsTrigger
              value="all"
              className="text-lg data-[state=active]:text-green-500 data-[state=active]:border-b-2 data-[state=active]:border-green-500 rounded-none px-6 pb-4"
            >
              All Orders
            </TabsTrigger>
            <TabsTrigger
              value="process"
              className="text-lg data-[state=active]:text-green-500 data-[state=active]:border-b-2 data-[state=active]:border-green-500 rounded-none px-6 pb-4"
            >
              To Process
            </TabsTrigger>
            <TabsTrigger
              value="transit"
              className="text-lg data-[state=active]:text-green-500 data-[state=active]:border-b-2 data-[state=active]:border-green-500 rounded-none px-6 pb-4"
            >
              Transit
            </TabsTrigger>
            <TabsTrigger
              value="delivered"
              className="text-lg data-[state=active]:text-green-500 data-[state=active]:border-b-2 data-[state=active]:border-green-500 rounded-none px-6 pb-4"
            >
              Delivered
            </TabsTrigger>
            <TabsTrigger
              value="cancelled"
              className="text-lg data-[state=active]:text-green-500 data-[state=active]:border-b-2 data-[state=active]:border-green-500 rounded-none px-6 pb-4"
            >
              Cancelled
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="bg-[#E6F5EB] rounded-lg p-6">
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

          <div className="bg-white rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Shipping Status</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell>{order._id}</TableCell>
                    <TableCell>{`${order.buyer.firstName} ${order.buyer.lastName}`}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{order.items.length} items</TableCell>
                    <TableCell>{order.shipping.tracking.status}</TableCell>
                    <TableCell>{`${order.delivery_address.city}, ${order.delivery_address.state}`}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          order.paymentInfo.status === "completed"
                            ? "bg-green-100 text-green-500"
                            : order.paymentInfo.status === "pending"
                            ? "bg-yellow-100 text-yellow-500"
                            : "bg-red-100 text-red-500"
                        }
                      >
                        {order.paymentInfo.status}
                      </Badge>
                    </TableCell>
                    <TableCell>₦{order.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Link to={`/dashboard/order/${order._id}`}>
                        <Button
                          variant="secondary"
                          className="bg-[#070514] text-white hover:bg-[#070514]/90"
                        >
                          View
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

