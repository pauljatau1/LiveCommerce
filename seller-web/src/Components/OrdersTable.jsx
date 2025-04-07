import React, { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag } from "lucide-react"

const OrdersTable = ({ orders = { orders: [] } }) => {
  const [date, setDate] = useState()

  const getStatusColor = (status) => {
    const statusColors = {
      pending: "bg-yellow-100 hover:bg-yellow-200 capitalize transition-all duration-300 rounded-md py-1 text-yellow-700",
      pickup_arranged: "bg-blue-100 hover:bg-blue-200 capitalize transition-all duration-300 rounded-md py-1 text-blue-700",
      picked_up: "bg-green-100 hover:bg-green-200 capitalize transition-all duration-300 rounded-md py-1 text-green-700",
      "in-transit": "bg-purple-100 hover:bg-purple-200 capitalize transition-all duration-300 rounded-md py-1 text-purple-700",
      in_transit: "bg-purple-100 hover:bg-purple-200 capitalize transition-all duration-300 rounded-md py-1 text-purple-700",
      delivered: "bg-green-100 hover:bg-green-200 capitalize transition-all duration-300 rounded-md py-1 text-green-700",
      failed: "bg-red-100 hover:bg-red-200 capitalize transition-all duration-300 rounded-md py-1 text-red-700",
      cancelled: "bg-red-100 hover:bg-red-200 capitalize transition-all duration-300 rounded-md py-1 text-red-700",
    }
    return statusColors[status] || "bg-gray-100 text-gray-700"
  }

  // Handle the case where orders is undefined or not in the expected format
  const ordersList = Array.isArray(orders?.orders) ? orders.orders : Array.isArray(orders) ? orders : [];

  const filteredOrders = ordersList.filter((order) => {
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
              <TableHead className="font-semibold">Order Details</TableHead>
              <TableHead className="font-semibold">Customer</TableHead>
              <TableHead className="font-semibold">Items</TableHead>
              <TableHead className="font-semibold">Shipping</TableHead>
              <TableHead className="font-semibold">Payment</TableHead>
              <TableHead className="font-semibold">Amount</TableHead>
              <TableHead className="font-semibold">Channel</TableHead>
              <TableHead className="font-semibold">Order Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length > 0 ? (
              filteredOrders
                ?.slice(0, 10)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((order) => (
                  <TableRow key={order?._id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{order?.order_id}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium capitalize">{`${order?.buyer?.firstName} ${order?.buyer?.lastName}`}</div>
                        <div className="text-sm capitalize text-gray-500">{order?.delivery_address?.city}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="capitalize text-sm">
                            {item?.productName?.length > 20
                              ? `${item?.productName?.slice(0, 20)}...`
                              : item?.productName}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.shipping.tracking.status)}>
                        {order.shipping.tracking.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          order.paymentInfo.status === "paid"
                            ? "bg-green-100 hover:bg-green-200 capitalize transition-all duration-300 px-3 rounded-md py-1 text-green-700"
                            : order.paymentInfo.status === "pending"
                              ? "bg-yellow-100 hover:bg-yellow-200 capitalize transition-all duration-300 px-3 rounded-md py-1 text-yellow-700"
                              : order.paymentInfo.status === "awaiting_cod"
                                ? "bg-purple-100 hover:bg-purple-200 capitalize transition-all duration-300 px-3 rounded-md py-1 text-purple-700"
                                : "bg-red-100 hover:bg-red-200 capitalize transition-all duration-300 px-3 rounded-md py-1 text-red-700"
                        }
                      >
                        {order.paymentInfo.status === "awaiting_cod" ? "Cash on Delivery" : order.paymentInfo.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">₦{order.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>{order.channel.charAt(0).toUpperCase() + order.channel.slice(1)}</TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Badge
                          className={
                            order.isOpen
                              ? "bg-blue-100 hover:bg-blue-200 capitalize transition-all duration-300 px-3 rounded-md py-1 text-blue-700"
                              : "bg-gray-100 hover:bg-gray-200 capitalize transition-all duration-300 px-3 rounded-md py-1 text-gray-700"
                          }
                        >
                          {order.isOpen ? "Open" : "Closed"}
                        </Badge>
                        {!order.orderStatus?.hasReturn ? (
                          <Badge className="bg-green-100 ml-4 hover:bg-green-200 capitalize transition-all duration-300 px-3 rounded-md py-1 text-green-700">
                            No Issues
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-100 ml-4 hover:bg-orange-200 capitalize transition-all duration-300 px-3 rounded-md py-1 text-orange-700">
                            Order Issues
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link to={`/dashboard/order/${order._id}`}>
                        <Button variant="secondary" className="bg-green-600 font-inter px-2 lg:px-3 text-white hover:bg-green-700">
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan="9" className="text-center py-12">
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-slate-50 p-4 rounded-full mb-4">
                      <ShoppingBag className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 mb-1">No Orders Found</h3>
                    <p className="text-slate-500 text-sm max-w-md mb-4">
                      There are no orders matching your current filters. Try adjusting your search criteria or date range.
                    </p>
                    <Button 
                      variant="outline" 
                      className="border-slate-300 hover:bg-slate-100"
                      onClick={() => setDate(null)}
                    >
                      Clear Filters
                    </Button>
                  </div>
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
