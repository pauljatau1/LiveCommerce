
import { useState } from 'react'

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

// Sample data
const orders = Array(10).fill({
  orderNumber: "#4474048",
  customer: "Obasi Obi",
  date: "11 Jan 2025",
  item: "Nike Sport Shoe",
  channel: "Live show",
  logistics: ["Not Shipped", "Pending Pick Up", "In transit", "Delivered"][
    Math.floor(Math.random() * 4)
  ],
  destination: "Lekki, Lagos",
  status: ["Cancelled", "Refunded", "Paid"][Math.floor(Math.random() * 3)],
  amount: "₦200,000",
})

export default function OrdersDashboard() {

    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
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
                <TableHead>Item</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Logistics</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order, index) => (
                <TableRow key={index}>
                  <TableCell>{order.orderNumber}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>{order.item}</TableCell>
                  <TableCell>{order.channel}</TableCell>
                  <TableCell>{order.logistics}</TableCell>
                  <TableCell>{order.destination}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        order.status === "Cancelled"
                          ? "bg-red-100 text-red-500"
                          : order.status === "Refunded"
                          ? "bg-purple-100 text-purple-500"
                          : "bg-green-100 text-green-500"
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.amount}</TableCell>
                  <TableCell>
                  <Link to="/dashboard/order">
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

