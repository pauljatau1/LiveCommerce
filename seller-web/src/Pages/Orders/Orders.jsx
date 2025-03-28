import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ShoppingBag, Video, Gavel } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import SearchBar from "@/Components/ui/DashboardHomepageUi/SearchBar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import LinearProgress from "@mui/material/LinearProgress";
import { BASE_URL } from "@/Constants/Server";
import Header from "@/Components/ui/Header/Header";
import { Input } from "@/components/ui/input";
import { useOutletContext } from "react-router-dom";

const OrderSkeleton = () => {
  return (
    <div className="relative">
      {/* Returns Center Button */}
      <div className="absolute top-4 right-4">
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <div className="py-6">
        {/* Tabs Skeleton */}
        <div className="mb-8 hidden sm:block">
          <div className="border-b flex gap-6 pb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-28 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>

        <div className="bg-[#F8FAF9] rounded-lg p-6 shadow-sm">
          {/* Header and Filters */}
          <div className="flex flex-col xl:flex-row justify-between gap-4 xl:items-center mb-6">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex flex-wrap gap-4">
              <div className="h-10 w-[240px] bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-[240px] bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-[180px] bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-[180px] bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-none">
                  <TableHead className="w-[180px]">
                    <div className="h-5 w-28 bg-gray-200 rounded animate-pulse"></div>
                  </TableHead>
                  <TableHead className="w-[180px]">
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </TableHead>
                  <TableHead className="w-[200px]">
                    <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </TableHead>
                  <TableHead className="w-[100px]">
                    <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </TableHead>
                  <TableHead className="w-[150px]">
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </TableHead>
                  <TableHead className="w-[200px]">
                    <div className="h-5 w-28 bg-gray-200 rounded animate-pulse"></div>
                  </TableHead>
                  <TableHead className="w-[100px]">
                    <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5, 6].map((row) => (
                  <TableRow key={row} className="border-b hover:bg-gray-50">
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="h-5 w-36 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="h-8 w-28 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-8 w-28 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="h-7 w-20 bg-gray-200 rounded-md animate-pulse"></div>
                        <div className="h-7 w-24 bg-gray-200 rounded-md animate-pulse ml-4"></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="h-9 w-28 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Skeleton */}
          <div className="flex justify-between items-center mt-6">
            <div className="h-10 w-[140px] bg-gray-200 rounded animate-pulse"></div>
            <div className="flex items-center gap-4">
              <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex gap-4">
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function OrdersDashboard() {
  const { setHeaderName, setNavName } = useOutletContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sellerId, setSellerId] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(20);
  const [totalOrders, setTotalOrders] = useState(0);
  const [date, setDate] = useState();
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });

  useEffect(() => {
    setHeaderName("Orders");
    setNavName("");
  }, []);

  // Filter orders based on active tab
  const filteredOrders = orders?.filter((order) => {
    if (activeTab === "all") return true;
    if (activeTab === "process") return order.shipping.tracking.status === "pending";
    if (activeTab === "transit") 
      return ["pickup_arranged", "picked_up", "in_transit", "in-transit"].includes(order.shipping.tracking.status);
    if (activeTab === "delivered") return order.shipping.tracking.status === "delivered";
    if (activeTab === "cancelled") return ["cancelled", "failed"].includes(order.shipping.tracking.status);
    return true;
  });

  // Filter function
  const getFilteredOrders = () => {
    return filteredOrders.filter((order) => {
      // Date range filter
      const orderDate = new Date(order?.createdAt);
      const dateInRange = date?.from && date?.to
        ? orderDate >= date.from && orderDate <= date.to
        : true;

      // Search filter
      const searchMatch = searchTerm
        ? order?._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order?.buyer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order?.buyer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order?.items?.some(item => item?.productName?.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;

      // Payment status filter
      const paymentMatch = paymentFilter === "all" ? true : order?.paymentInfo?.status === paymentFilter;

      // Channel filter
      const channelMatch = channelFilter === "all" ? true : order?.channel === channelFilter;

      return dateInRange && searchMatch && paymentMatch && channelMatch;
    }).sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      return sortConfig.direction === 'asc'
        ? (aValue > bValue ? 1 : -1)
        : (aValue < bValue ? 1 : -1);
    });
  };

  const handleOrdersPerPageChange = (e) => {
    setOrdersPerPage(Number.parseInt(e, 10));
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => Math.max(1, prevPage - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(Math.ceil(totalOrders / ordersPerPage), prevPage + 1));
  };

  console.log(sellerId);

  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        const sellerToken = localStorage.getItem("sellerToken");
        if (sellerToken) {
          const tokenData = JSON.parse(sellerToken);
          const token = tokenData.data;
          const response = await fetch(`${BASE_URL}/seller/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await response.json();
          setSellerId(data._id);
          fetchOrders(data._id, token);
        }
      } catch (error) {
        console.error("Error fetching seller profile:", error);
        setLoading(false);
      }
    };

    const fetchOrders = async (id, token) => {
      try {
        const response = await fetch(`${BASE_URL}/order/seller/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setOrders(Array.isArray(data.orders) ? data.orders : []);
        setTotalOrders(data.orders?.length || 0);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerProfile();
  }, []);

  if (loading) {
    return <OrderSkeleton />;
  }

  const getStatusColor = (status) => {
    const statusColors = {
      pending: "bg-yellow-100 px-3 hover:bg-yellow-200 capitalize transition-all duration-300 rounded-md py-1 text-yellow-700",
      pickup_arranged: "bg-blue-100 px-3 hover:bg-blue-200 capitalize transition-all duration-300 rounded-md py-1 text-blue-700",
      picked_up: "bg-green-100 px-3 hover:bg-green-200 capitalize transition-all duration-300 rounded-md py-1 text-green-700",
      "in-transit": "bg-purple-100 px-3 hover:bg-purple-200 capitalize transition-all duration-300 rounded-md py-1 text-purple-700",
      in_transit: "bg-purple-100 px-3 hover:bg-purple-200 capitalize transition-all duration-300 rounded-md py-1 text-purple-700",
      delivered: "bg-green-100 px-3 hover:bg-green-200 capitalize transition-all duration-300 rounded-md py-1 text-green-700",
      failed: "bg-red-100 px-3 hover:bg-red-200 capitalize transition-all duration-300 rounded-md py-1 text-red-700",
      cancelled: "bg-red-100 px-3 hover:bg-red-200 capitalize transition-all duration-300 rounded-md py-1 text-red-700",
    };
    return statusColors[status] || "bg-gray-100 text-gray-700";
  };

  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const paginatedOrders = getFilteredOrders().slice(startIndex, endIndex);

  return (
    <>
      <div className="relative">
        <Link to="/dashboard/returns" className="hidden sm:block">
          <Button
            variant="outline"
            className="absolute top-4 right-4 border-green-600 text-green-600 font-inter px-2 lg:px-3 hover:bg-green-600 hover:text-white"
          >
            Returns Center
          </Button>
        </Link>
        <div className="py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8 hidden sm:block">
            <TabsList className="border-b gap-6 h-auto p-0 bg-transparent">
              <TabsTrigger
                value="all"
                className="text-sm lg:text-base font-semibold w-fit data-[state=active]:text-green-600 data-[state=active]:bg-transparent font-inter data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-0 pb-2"
              >
                All Orders
              </TabsTrigger>
              <TabsTrigger
                value="process"
                className="text-sm lg:text-base font-semibold w-fit data-[state=active]:text-green-600 data-[state=active]:bg-transparent font-inter data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-0 pb-2"
              >
                To Process
              </TabsTrigger>
              <TabsTrigger
                value="transit"
                className="text-sm lg:text-base font-semibold w-fit data-[state=active]:text-green-600 data-[state=active]:bg-transparent font-inter data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-0 pb-2"
              >
                Transit
              </TabsTrigger>
              <TabsTrigger
                value="delivered"
                className="text-sm lg:text-base font-semibold w-fit data-[state=active]:text-green-600 data-[state=active]:bg-transparent font-inter data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-0 pb-2"
              >
                Delivered
              </TabsTrigger>
              <TabsTrigger
                value="cancelled"
                className="text-sm lg:text-base font-semibold w-fit data-[state=active]:text-green-600 data-[state=active]:bg-transparent font-inter data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-0 pb-2"
              >
                Cancelled
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="bg-[#F8FAF9] rounded-lg p-6 shadow-sm">
            <div className="flex flex-col xl:flex-row justify-between gap-4 xl:items-center mb-6">
              <h2 className="text-xl lg:text-2xl font-semibold font-inter">Latest Orders</h2>
              <div className="mb-4 flex flex-wrap gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start bg-[#0BB24817] hover:bg-[#DEFFEE] transition-all duration-300 text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
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

                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-[240px]"
                />

                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Payment Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                    <SelectItem value="live">Live Show</SelectItem>
                    <SelectItem value="auction">auction</SelectItem>
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
                    <TableHead className="font-semibold">Shipping</TableHead>
                    <TableHead className="font-semibold">Payment</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Channel</TableHead>
                    <TableHead className="font-semibold">Order Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((order) => (
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
                            <div key={index} className=" capitalize text-sm">
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
                              <span className="text-purple-600">Live Show</span>
                            </>
                          ) : order.channel === "auction" ? (
                            <>
                              <Gavel className="h-4 w-4 text-orange-600" />
                              <span className="text-orange-600">auction</span>
                            </>
                          ) : (
                            order.channel
                          )}
                        </div>
                      </TableCell>
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
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center mt-6">
              <Select value={ordersPerPage.toString()} onValueChange={handleOrdersPerPageChange}>
                <SelectTrigger className="bg-white w-[140px] tex-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 PER PAGE</SelectItem>
                  <SelectItem value="30">30 PER PAGE</SelectItem>
                  <SelectItem value="40">40 PER PAGE</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-4">
                <span className="text-sm font-inter text-gray-500">
                  Page {currentPage} of {Math.ceil(totalOrders / ordersPerPage)}
                </span>
                <div className="flex gap-4">
                  <Button variant="outline" className="bg-white" onClick={handlePrevPage} disabled={currentPage === 1}>
                    ← Back
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-white"
                    onClick={handleNextPage}
                    disabled={currentPage === Math.ceil(totalOrders / ordersPerPage)}
                  >
                    Next →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
