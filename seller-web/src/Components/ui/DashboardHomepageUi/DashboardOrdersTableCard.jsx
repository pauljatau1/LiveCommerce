import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { orderService } from "@/services/orderService";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, ExternalLink } from "lucide-react";

function getStatusColor(status) {
  const statusColors = {
    pending: "bg-yellow-100 hover:bg-yellow-200 text-yellow-700",
    pickup_arranged: "bg-blue-100 hover:bg-blue-200 text-blue-700",
    picked_up: "bg-green-100 hover:bg-green-200 capitalize text-green-700",
    in_transit: "bg-purple-100 hover:bg-purple-200 text-purple-700",
    delivered: "bg-green-100 hover:bg-green-200 text-green-700",
    failed: "bg-red-100 hover:bg-red-200 text-red-700",
    confirmed: "bg-cyan-100 hover:bg-cyan-200 text-cyan-700",
    cancelled: "bg-red-100 hover:bg-red-200 text-red-700",
    abandoned: "bg-orange-100 hover:bg-orange-200 text-orange-800",
  };

  return statusColors[status] || "bg-gray-100 text-gray-700";
}

export default function DashboardOrdersTableCard() {
  const navigate = useNavigate();

  const { data: orders, isPending } = useQuery({
    queryKey: ["orders"],
    queryFn: () => orderService.fetchSellerOrders()
  });

  return (
    <div className="w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <div className="bg-white border-b border-gray-200 p-4 md:p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">
            Latest Orders
          </h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Manage and track your recent orders
          </p>
        </div>
        <div className="flex flex-wrap w-full sm:w-auto gap-2 md:gap-3">
          <Button className="bg-green-600 text-white hover:bg-green-700 text-xs md:text-sm w-full sm:w-auto">
            <Link to="/dashboard/orders" className="flex items-center">
              View All Orders
              <ExternalLink className="ml-1 h-3 w-3 md:h-4 md:w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {!isPending ? (
        <>
          <div className="hidden md:block overflow-x-auto">
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
                  orders
                    ?.slice(0, 10)
                    .sort(
                      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                    )
                    .map((order) => (
                      <TableRow key={order?._id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{order?.order_id}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium capitalize">{`${order?.buyer?.firstName} ${order?.buyer?.lastName}`}</div>
                            <div className="text-sm capitalize text-gray-500">
                              {order?.delivery_address?.city}
                            </div>
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
                          <Badge
                            className={
                              getStatusColor(
                                order.isStale
                                  ? "abandoned"
                                  : order.shipping.tracking.status
                              ) +
                              " capitalize transition-all duration-300 rounded-md py-1"
                            }
                          >
                            {order.isStale
                              ? "abandoned"
                              : order.shipping.tracking.status.replace(
                                "_",
                                " "
                              )}
                          </Badge>
                        </TableCell>
                        <TableCell>
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
                            {order.isStale
                              ? "abandoned"
                              : order.paymentInfo.status === "awaiting_cod"
                                ? "Cash on Delivery"
                                : order.paymentInfo.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          ₦{order.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {order.channel.charAt(0).toUpperCase() +
                            order.channel.slice(1)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <Badge
                              className={
                                order.isStale
                                  ? "bg-orange-100 hover:bg-orange-200 capitalize transition-all duration-300 px-3 rounded-md py-1 text-orange-800"
                                  : order.isOpen
                                    ? "bg-blue-100 hover:bg-blue-200 capitalize transition-all duration-300 px-3 rounded-md py-1 text-blue-700"
                                    : "bg-gray-100 hover:bg-gray-200 capitalize transition-all duration-300 px-3 rounded-md py-1 text-gray-700"
                              }
                            >
                              {order.isStale
                                ? "abandoned"
                                : order.isOpen
                                  ? "Open"
                                  : "Closed"}
                            </Badge>
                            {!order.orderStatus?.hasReturn ? (
                              <Badge className="bg-green-100 ml-2 flex-nowrap whitespace-nowrap hover:bg-green-200 capitalize transition-all duration-300 px-3 rounded-md py-1 text-green-700">
                                No Issues
                              </Badge>
                            ) : (
                              <Badge className="bg-orange-100 ml-2 flex-nowrap whitespace-nowrap hover:bg-orange-200 capitalize transition-all duration-300 px-3 rounded-md py-1 text-orange-700">
                                Order Issues
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link to={`/dashboard/order/${order._id}`}>
                            <Button
                              variant="secondary"
                              className="bg-green-600 font-inter px-2 lg:px-3 text-white hover:bg-green-700"
                            >
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
                        <h3 className="text-lg font-medium text-slate-800 mb-1">
                          No Orders Found
                        </h3>
                        <p className="text-slate-500 text-sm max-w-md mb-4">
                          There are no orders to display at this time.
                        </p>
                        <div className="flex gap-3">
                          <Button
                            variant="default"
                            className="bg-green-600 hover:bg-green-700 text-white ml-3"
                            onClick={() => navigate("/dashboard/products")}
                          >
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            View Products
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden">
            {orders.length > 0 ? (
              orders
                ?.slice(0, 10)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((order) => (
                  <div
                    key={order?._id}
                    className="border-b border-gray-200 p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-sm font-medium">
                          {order?.order_id}
                        </span>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>
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
                        {order.isStale
                          ? "abandoned"
                          : order.isOpen
                            ? "Open"
                            : "Closed"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Customer</p>
                        <p className="text-sm font-medium capitalize truncate">{`${order?.buyer?.firstName} ${order?.buyer?.lastName}`}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="text-sm font-medium">
                          ₦{order.totalAmount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Shipping</p>
                        <Badge
                          className={`text-xs px-2 py-0.5 ${getStatusColor(
                            order.isStale
                              ? "abandoned"
                              : order.shipping.tracking.status
                          ) +
                            " capitalize transition-all duration-300 rounded-md"
                            }`}
                        >
                          {order.isStale
                            ? "abandoned"
                            : order.shipping.tracking.status.replace("_", " ")}
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
                          {order.isStale
                            ? "abandoned"
                            : order.paymentInfo.status === "awaiting_cod"
                              ? "COD"
                              : order.paymentInfo.status}
                        </Badge>
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
                          <div className="text-xs text-gray-500">
                            +{order.items.length - 2} more items
                          </div>
                        )}
                      </div>
                    </div>

                    <Link
                      to={`/dashboard/order/${order._id}`}
                      className="block w-full"
                    >
                      <Button
                        variant="outline"
                        className="border-green-600 text-green-600 hover:bg-green-50 w-full text-xs py-1"
                      >
                        View Order Details
                      </Button>
                    </Link>
                  </div>
                ))
            ) : (
              <div className="p-6 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="bg-slate-50 p-4 rounded-full mb-4">
                    <ShoppingBag className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-base font-medium text-slate-800 mb-1">
                    No Orders Found
                  </h3>
                  <p className="text-slate-500 text-xs mb-4">
                    There are no orders to display at this time.
                  </p>
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white text-xs mt-2"
                    onClick={() => navigate("/dashboard/products")}
                  >
                    <ShoppingBag className="w-3 h-3 mr-2" />
                    View Products
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#16783A]"></div>
        </div>
      )}
    </div>
  );
}

