import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Link } from "react-router-dom";
import { ShoppingBag, Video, Gavel, Radio, Tv } from "lucide-react";

const getStatusColor = (status) => {
  const statusColors = {
    pending: "bg-yellow-100 px-3 hover:bg-yellow-200 capitalize transition-all duration-300 rounded-md py-1 text-yellow-700",
    confirmed: "bg-cyan-100 px-3 hover:bg-cyan-200 capitalize transition-all duration-300 rounded-md py-1 text-cyan-700",
    pickup_arranged: "bg-blue-100 px-3 hover:bg-blue-200 capitalize transition-all duration-300 rounded-md py-1 text-blue-700",
    picked_up: "bg-green-100 px-3 hover:bg-green-200 capitalize transition-all duration-300 rounded-md py-1 text-green-700",
    "in-transit": "bg-purple-100 px-3 hover:bg-purple-200 capitalize transition-all duration-300 rounded-md py-1 text-purple-700",
    in_transit: "bg-purple-100 px-3 hover:bg-purple-200 capitalize transition-all duration-300 rounded-md py-1 text-purple-700",
    delivered: "bg-green-100 px-3 hover:bg-green-200 capitalize transition-all duration-300 rounded-md py-1 text-green-700",
    Delivered: "bg-green-100 px-3 hover:bg-green-200 capitalize transition-all duration-300 rounded-md py-1 text-green-700",
    failed: "bg-red-100 px-3 hover:bg-red-200 capitalize transition-all duration-300 rounded-md py-1 text-red-700",
    cancelled: "bg-red-100 px-3 hover:bg-red-200 capitalize transition-all duration-300 rounded-md py-1 text-red-700",
    abandoned: "bg-orange-100 px-3 hover:bg-orange-200 capitalize transition-all duration-300 rounded-md py-1 text-orange-800",
  };
  return statusColors[status] || "bg-gray-100 text-gray-700";
};

export default function OrdersTable({ orders }) {
  return (
    <div className="hidden sm:block bg-white rounded-lg overflow-hidden border border-gray-100">
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
          {orders.length > 0 ? (
            orders.map((order) => (
              <TableRow key={order._id} className="hover:bg-gray-50">
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
                    <div className="font-medium capitalize ">{`${order?.buyer?.firstName} ${order?.buyer?.lastName}`}</div>
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
                  <Badge className={getStatusColor(order.isStale ? "abandoned" : order.shipping.tracking.status)}>
                    {order.isStale ? "abandoned" : order.shipping.tracking.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {['failed', 'cancelled'].includes(order.shipping.tracking.status) ? (
                    <Badge className="bg-blue-100 hover:bg-blue-200 capitalize transition-all duration-300 px-3 rounded-md py-1 text-blue-700">
                      refunded
                    </Badge>
                  ) : (
                    <Badge
                      className={
                        order.isStale
                          ? "bg-orange-100 hover:bg-orange-200 capitalize transition-all duration-300 px-3 rounded-md py-1 text-orange-800"
                          : order.paymentInfo.status === "paid"
                            ? "bg-green-100 hover:bg-green-200 capitalize transition-all duration-300 px-3 rounded-md py-1 text-green-700"
                            : order.paymentInfo.status === "pending"
                              ? "bg-yellow-100 hover:bg-yellow-200 capitalize transition-all duration-300 px-3 rounded-md py-1 text-yellow-700"
                              : order.paymentInfo.status === "awaiting_cod"
                                ? "bg-purple-100 hover:bg-purple-200 capitalize transition-all duration-300 px-3 rounded-md py-1 text-purple-700"
                                : "bg-red-100 hover:bg-red-200 capitalize transition-all duration-300 px-3 rounded-md py-1 text-red-700"
                      }
                    >
                      {order.isStale ? "abandoned" : order.paymentInfo.status === "awaiting_cod" ? "Cash on Delivery" : order.paymentInfo.status}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="font-medium">₦{(order.totalAmount - (order.shipping?.fee?.amount || 0)).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {order.channel === "marketplace" ? (
                      <>
                        <ShoppingBag className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-600">Marketplace</span>
                      </>
                    ) : order.channel === "live" ? (
                      <>
                        <Video className="h-4 w-4 text-purple-600" />
                        <span className="text-purple-600">Liveshow</span>
                      </>
                    ) : order.channel === "liveshow" ? (
                      <>
                        <Tv className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">Live Show</span>
                      </>
                    ) : order.channel === "auction" ? (
                      <>
                        <Gavel className="h-4 w-4 text-orange-600" />
                        <span className="text-orange-600">Auction</span>
                      </>
                    ) : order.channel === "blips" ? (
                      <>
                        <Radio className="h-4 w-4 text-pink-600" />
                        <span className="text-pink-600">Blips</span>
                      </>
                    ) : (
                      order.channel.charAt(0).toUpperCase() + order.channel.slice(1)
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Badge
                      className={
                        order.isStale
                          ? "bg-orange-100 hover:bg-orange-200 capitalize transition-all duration-300 px-3 rounded-md py-1 text-orange-800"
                          : order.isOpen
                            ? "bg-blue-100 hover:bg-blue-200 capitalize transition-all duration-300 px-3 rounded-md py-1 text-blue-700"
                            : "bg-gray-100 hover:bg-gray-200 capitalize transition-all duration-300 px-3 rounded-md py-1 text-gray-700"
                      }
                    >
                      {order.isStale ? "abandoned" : order.isOpen ? "Open" : "Closed"}
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
              <TableCell colSpan="9" className="text-center py-16">
                {/* Empty handled at caller when using mobile/card split */}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}


