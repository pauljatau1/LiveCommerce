import { useState, useEffect } from "react";
import { Calendar } from "@/Components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover";
import { CalendarIcon, ShoppingBag, Video, Gavel, Radio, Tv, FilterX, Filter, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { Tabs, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";
import { Button } from "@/Components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Badge } from "@/Components/ui/badge";
import { BASE_URL } from "@/Constants/Server";
import { Input } from "@/Components/ui/input";
import { useOutletContext } from "react-router-dom";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/Components/ui/drawer";

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
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    currentPage: 1,
    limit: 20
  });
  const [date, setDate] = useState();
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState("-createdAt");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    setHeaderName("Orders");
    setNavName("");
  }, []);

  const fetchOrders = async (id, token, params = {}) => {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || currentPage,
        limit: params.limit || ordersPerPage,
        ...(date?.from && date?.to && {
          startDate: date.from.toISOString(),
          endDate: date.to.toISOString()
        }),
        ...(searchTerm && { search: searchTerm }),
        ...(paymentFilter !== "all" && { paymentStatus: paymentFilter }),
        ...(channelFilter !== "all" && { channel: channelFilter }),
        ...(activeTab !== "all" && {
          status: activeTab === "process" ? "pending" :
                 activeTab === "transit" ? "in_transit" :
                 activeTab === "delivered" ? "delivered" :
                 activeTab === "cancelled" ? "cancelled" : undefined
        }),
        sort: sortConfig
      });

      const response = await fetch(`${BASE_URL}/order/seller/${id}?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setOrders(data.orders);
      setPagination({
        total: data.pagination.total,
        pages: data.pagination.pages,
        currentPage: data.pagination.currentPage,
        limit: data.pagination.limit
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

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

    fetchSellerProfile();
  }, []);

  // Refetch orders when filters change
  useEffect(() => {
    if (sellerId) {
      const sellerToken = JSON.parse(localStorage.getItem("sellerToken"));
      fetchOrders(sellerId, sellerToken.data);
    }
  }, [currentPage, ordersPerPage, date, searchTerm, paymentFilter, channelFilter, activeTab, sortConfig]);

  const handleOrdersPerPageChange = (e) => {
    setOrdersPerPage(Number.parseInt(e, 10));
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => Math.max(1, prevPage - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(pagination.pages, prevPage + 1));
  };

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

  // Mobile version of tabs
  const MobileTabs = () => {
    return (
      <div className="mb-4 sm:hidden">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="process">To Process</SelectItem>
            <SelectItem value="transit">Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  };

  // Mobile filters drawer
  const MobileFilters = () => {
    return (
      <Drawer open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DrawerContent className="px-4 pb-6">
          <DrawerHeader>
            <DrawerTitle>Filter Orders</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-4 p-1">
            <div>
              <p className="text-sm font-medium mb-2">Date Range</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start bg-[#0BB24817] hover:bg-[#DEFFEE] transition-all duration-300 text-left font-normal",
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
                    numberOfMonths={1}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">Search</p>
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">Payment Status</p>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">Channel</p>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="marketplace">Marketplace</SelectItem>
                  <SelectItem value="live">liveshow</SelectItem>
                  <SelectItem value="auction">auction</SelectItem>
                  <SelectItem value="blips">Blips</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DrawerFooter className="pt-2">
            <Button 
              variant="outline" 
              className="w-full border-slate-300 hover:bg-slate-100"
              onClick={() => {
                setDate(null);
                setSearchTerm("");
                setPaymentFilter("all");
                setChannelFilter("all");
              }}
            >
              <FilterX className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
            <DrawerClose asChild>
              <Button className="w-full bg-green-600 hover:bg-green-700">Apply Filters</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  };

  return (
    <>
      <div className="relative">
        <div className="sm:hidden flex justify-between items-center sm:px-4 py-3">
          <h2 className="text-lg font-semibold font-inter">Orders</h2>
          <Link to="/dashboard/returns">
            <Button
              variant="outline"
              className="border-green-600 text-green-600 font-inter px-2 text-xs hover:bg-green-600 hover:text-white"
            >
              Returns Center
            </Button>
          </Link>
        </div>
        
        <Link to="/dashboard/returns" className="hidden sm:block">
          <Button
            variant="outline"
            className="absolute top-4 right-4 border-green-600 text-green-600 font-inter px-2 lg:px-3 hover:bg-green-600 hover:text-white"
          >
            Returns Center
          </Button>
        </Link>
        
        <div className="py-3 sm:py-6">
          {/* Mobile Tabs */}
          <MobileTabs />
          
          {/* Desktop Tabs */}
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

          <div className="bg-[#F8FAF9] rounded-lg sm:p-6 shadow-sm">
            <div className="flex flex-col xl:flex-row justify-between gap-4 xl:items-center mb-6">
              <div className="flex justify-between items-center w-full xl:w-auto">
                <h2 className="text-xl lg:text-2xl font-semibold font-inter">Latest Orders</h2>
                
                {/* Mobile Filter Button */}
                <Button 
                  variant="outline" 
                  className="sm:hidden border-green-600 text-green-600"
                  onClick={() => setIsFilterOpen(true)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
              
              {/* Mobile Filters Drawer */}
              <MobileFilters />
              
              {/* Desktop Filters */}
              <div className="hidden sm:flex flex-wrap gap-4">
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
                    <SelectItem value="live">liveshow</SelectItem>
                    <SelectItem value="auction">auction</SelectItem>
                    <SelectItem value="blips">Blips</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          
            {/* Desktop Table */}
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
                      <TableCell colSpan="9" className="text-center py-16">
                        <div className="flex flex-col items-center justify-center">
                          <div className="bg-slate-50 p-5 rounded-full mb-5">
                            <ShoppingBag className="w-10 h-10 text-slate-400" />
                          </div>
                          <h3 className="text-xl font-semibold text-slate-800 mb-2">No Orders Found</h3>
                          <p className="text-slate-600 text-sm max-w-md mb-6 text-center">
                            There are no orders matching your current filters. Try adjusting your search criteria, date range, or payment status.
                          </p>
                          <div className="flex gap-3">
                            <Button 
                              variant="outline" 
                              className="border-slate-300 hover:bg-slate-100"
                              onClick={() => {
                                setDate(null);
                                setSearchTerm("");
                                setPaymentFilter("all");
                                setChannelFilter("all");
                                setActiveTab("all");
                              }}
                            >
                              <FilterX className="w-4 h-4 mr-2" />
                              Clear All Filters
                            </Button>
                            <Button 
                              variant="default" 
                              className="bg-green-600 hover:bg-green-700 text-white"
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

            {/* Mobile Card View */}
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
                              order.isOpen
                                ? "text-xs bg-blue-100 hover:bg-blue-200 capitalize transition-all duration-300 px-2 rounded-md py-0.5 text-blue-700"
                                : "text-xs bg-gray-100 hover:bg-gray-200 capitalize transition-all duration-300 px-2 rounded-md py-0.5 text-gray-700"
                            }
                          >
                            {order.isOpen ? "Open" : "Closed"}
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
                            <p className="text-sm font-medium">₦{order.totalAmount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Shipping</p>
                            <Badge className={`text-xs px-2 py-0.5 ${getStatusColor(order.shipping.tracking.status)}`}>
                              {order.shipping.tracking.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Payment</p>
                            <Badge
                              className={`text-xs px-2 py-0.5 ${
                                order.paymentInfo.status === "paid"
                                  ? "bg-green-100 hover:bg-green-200 capitalize transition-all duration-300 rounded-md text-green-700"
                                  : order.paymentInfo.status === "pending"
                                    ? "bg-yellow-100 hover:bg-yellow-200 capitalize transition-all duration-300 rounded-md text-yellow-700"
                                    : order.paymentInfo.status === "awaiting_cod"
                                      ? "bg-purple-100 hover:bg-purple-200 capitalize transition-all duration-300 rounded-md text-purple-700"
                                      : "bg-red-100 hover:bg-red-200 capitalize transition-all duration-300 rounded-md text-red-700"
                              }`}
                            >
                              {order.paymentInfo.status === "awaiting_cod" ? "COD" : order.paymentInfo.status}
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
                        
                        <Link to={`/dashboard/order/${order._id}`} className="block w-full">
                          <Button variant="secondary" className="bg-green-600 text-white hover:bg-green-700 w-full text-xs py-1">
                            View Order Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-white rounded-lg border border-gray-200 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-slate-50 p-4 rounded-full mb-4">
                      <ShoppingBag className="w-6 h-6 text-slate-400" />
                    </div>
                    <h3 className="text-base font-medium text-slate-800 mb-1">No Orders Found</h3>
                    <p className="text-slate-500 text-xs mb-4">
                      There are no orders matching your filters. Try adjusting your search criteria.
                    </p>
                    <Button 
                      variant="outline" 
                      className="border-slate-300 hover:bg-slate-100 text-xs"
                      onClick={() => {
                        setDate(null);
                        setSearchTerm("");
                        setPaymentFilter("all");
                        setChannelFilter("all");
                        setActiveTab("all");
                      }}
                    >
                      <FilterX className="w-3 h-3 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-3 sm:gap-0">
              <Select value={ordersPerPage.toString()} onValueChange={handleOrdersPerPageChange}>
                <SelectTrigger className="bg-white w-full sm:w-[140px] text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 PER PAGE</SelectItem>
                  <SelectItem value="30">30 PER PAGE</SelectItem>
                  <SelectItem value="40">40 PER PAGE</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-xs sm:text-sm font-inter text-gray-500">
                  Page {pagination.currentPage} of {pagination.pages}
                </span>
                <div className="flex gap-2 sm:gap-4">
                  <Button 
                    variant="outline" 
                    className="bg-white text-xs sm:text-sm px-2 sm:px-3 py-1 h-8 sm:h-10" 
                    onClick={handlePrevPage} 
                    disabled={currentPage === 1}
                  >
                    ← Back
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-white text-xs sm:text-sm px-2 sm:px-3 py-1 h-8 sm:h-10"
                    onClick={handleNextPage}
                    disabled={currentPage === pagination.pages}
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