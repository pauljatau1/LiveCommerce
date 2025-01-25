import React, { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const OrdersTable = ({ orders }) => {
  const [date, setDate] = useState()

  const getTotalProductQuantityOrdered = (orders) => {
    const productsInAnOrder = orders?.items.length
    const totalQuantity = orders?.items.reduce((total, product) => total + product.quantity, 0)
    return { productsInAnOrder, totalQuantity }
  }

  const getStatusColor = (status) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-700",
      pickup_arranged: "bg-blue-100 text-blue-700",
      picked_up: "bg-green-100 text-green-700",
      in_transit: "bg-purple-100 text-purple-700",
      delivered: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
    }
    return statusColors[status] || "bg-gray-100 text-gray-700"
  }

  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.createdAt)
    const dateInRange = date?.from && date?.to ? orderDate >= date.from && orderDate <= date.to : true
    return dateInRange
  })

  return (
    <div className="w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <div className="bg-white border-b border-gray-200 p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Latest Orders</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and track your recent orders</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button className="bg-green-600 text-white hover:bg-green-700">
            <Link to="/dashboard/orders">View All Orders</Link>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="hidden md:table-cell font-semibold text-gray-900">Order ID</TableHead>
              <TableHead className="font-semibold text-gray-900">Items</TableHead>
              <TableHead className="font-semibold text-gray-900">Order Date</TableHead>
              <TableHead className="hidden md:table-cell font-semibold text-gray-900">Price</TableHead>
              <TableHead className="hidden md:table-cell font-semibold text-gray-900">Payment</TableHead>
              <TableHead className="font-semibold text-gray-900">Status</TableHead>
              <TableHead className="font-semibold text-gray-900">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length > 0 ? (
              filteredOrders
                ?.slice(0, 10)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((order) => (
                  <TableRow key={order?._id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="hidden md:table-cell">
                      <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {order?._id.slice(-8).toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {order?.items.map((item, index) => (
                          <div key={index} className="text-sm">
                            {item.productName} x {item.quantity}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {new Date(order?.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-medium text-gray-900">
                      {order?.totalAmount.toLocaleString("en-NG", {
                        style: "currency",
                        currency: "NGN",
                      })}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                ${
                                                  order?.paymentInfo?.status === "paid"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-yellow-100 text-yellow-800"
                                                }`}
                      >
                        {order?.paymentInfo?.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          order?.shipping?.tracking?.status,
                        )}`}
                      >
                        {order?.shipping?.tracking?.status?.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link to={`/dashboard/order/${order._id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300 transition-colors"
                        >
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan="7" className="text-center py-8 text-gray-500">
                  No orders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default OrdersTable
