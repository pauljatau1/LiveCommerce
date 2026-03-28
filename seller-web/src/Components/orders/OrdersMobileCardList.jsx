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

export default function OrdersMobileCardList({ orders }) {
  return (
    <div className="sm:hidden">
      {orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-medium">{order?.order_id}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <Badge
                    className={
                      order.isStale
                        ? "text-xs bg-orange-100 hover:bg-orange-200 capitalize transition-all duration-300 px-2 rounded-md py-0.5 text-orange-800"
                        : order.isOpen
                          ? "text-xs bg-blue-100 hover:bg-blue-200 capitalize transition-all duration-300 px-2 rounded-md py-0.5 text-blue-700"
                          : "text-xs bg-gray-100 hover:bg-gray-200 capitalize transition-all duration-300 px-2 rounded-md py-0.5 text-gray-700"
                    }
                  >
                    {order.isStale ? "abandoned" : order.isOpen ? "Open" : "Closed"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Customer</p>
                    <p className="text-sm font-medium capitalize truncate">
                      {`${order?.buyer?.firstName} ${order?.buyer?.lastName}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="text-sm font-medium">₦{(order.totalAmount - (order.shipping?.fee?.amount || 0)).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Shipping</p>
                    <Badge className={`text-xs px-2 py-0.5 ${getStatusColor(order.isStale ? "abandoned" : order.shipping.tracking.status)}`}>
                      {order.isStale ? "abandoned" : order.shipping.tracking.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Payment</p>
                    <Badge
                      className={`text-xs px-2 py-0.5 ${order.isStale
                        ? "bg-orange-100 hover:bg-orange-200 capitalize transition-all duration-300 rounded-md text-orange-800"
                        : order.paymentInfo.status === "paid"
                          ? "bg-green-100 hover:bg-green-200 capitalize transition-all duration-300 rounded-md text-green-700"
                          : order.paymentInfo.status === "pending"
                            ? "bg-yellow-100 hover:bg-yellow-200 capitalize transition-all duration-300 rounded-md text-yellow-700"
                            : order.paymentInfo.status === "awaiting_cod"
                              ? "bg-purple-100 hover:bg-purple-200 capitalize transition-all duration-300 rounded-md text-purple-700"
                              : "bg-red-100 hover:bg-red-200 capitalize transition-all duration-300 rounded-md text-red-700"
                        }`}
                    >
                      {order.isStale ? "abandoned" : order.paymentInfo.status === "awaiting_cod" ? "COD" : order.paymentInfo.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs text-gray-500">Channel:</p>
                  <div className="flex items-center gap-1 text-xs">
                    {order.channel === "marketplace" ? (
                      <>
                        <ShoppingBag className="h-3 w-3 text-blue-600" />
                        <span className="text-blue-600">Marketplace</span>
                      </>
                    ) : order.channel === "live" ? (
                      <>
                        <Video className="h-3 w-3 text-purple-600" />
                        <span className="text-purple-600">Liveshow</span>
                      </>
                    ) : order.channel === "liveshow" ? (
                      <>
                        <Tv className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">Live Show</span>
                      </>
                    ) : order.channel === "auction" ? (
                      <>
                        <Gavel className="h-3 w-3 text-orange-600" />
                        <span className="text-orange-600">Auction</span>
                      </>
                    ) : order.channel === "blips" ? (
                      <>
                        <Radio className="h-3 w-3 text-pink-600" />
                        <span className="text-pink-600">Blips</span>
                      </>
                    ) : (
                      order.channel.charAt(0).toUpperCase() + order.channel.slice(1)
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Items</p>
                  <div className="space-y-1">
                    {order.items.slice(0, 2).map((item, index) => (
                      <div key={index} className="capitalize text-xs">
                        {item?.productName?.length > 25
                          ? `${item?.productName?.slice(0, 25)}...`
                          : item?.productName}
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <div className="text-xs text-gray-500">+{order.items.length - 2} more items</div>
                    )}
                  </div>
                </div>

                <Link to={`/dashboard/orders/order/${order._id}`} className="block w-full">
                  <Button variant="secondary" className="bg-green-600 text-white hover:bg-green-700 w-full text-xs py-1">
                    View Order Details
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}


