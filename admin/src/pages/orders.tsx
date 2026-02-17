import {
  ShoppingCart,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Filter,
  X,
  MoreHorizontal,
  Calendar,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Building2,
  User,
  ExternalLink,
  ChevronDown
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useEffect, useState, useMemo } from "react"
import { api } from "@/api/axios"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// Define TypeScript interfaces
interface Order {
  _id: string
  order_id: string
  channel: string
  buyer: {
    _id: string
    firstName: string
    lastName: string
    email?: string
    phoneNumber?: string
  }
  buyerDetails?: {
    profileImage?: {
      url: string
      _id: string
    }[]
    username?: string
  }
  seller?: {
    _id: string
    firstName: string
    lastName: string
    email: string
    storeName: string
    businessName?: string
  }
  items: {
    product: {
      _id: string
      name: string
      images?: { url: string, _id: string }[]
      price?: number
    }
    productName: string
    quantity: number
    price: number
    status?: string
    productImages?: { url: string, _id: string }[]
  }[]
  totalAmount: number
  paymentInfo: {
    status: string
    method?: string
    paidAt?: string
    isCashOnDelivery?: boolean
  }
  status: string
  createdAt: string
  isOpen: boolean
  isStorePickup?: boolean
  isStale?: boolean
  paid?: boolean
}

interface OrdersResponse {
  orders: Order[]
  currentPage: number
  totalPages: number
  totalOrders: number
  filterOptions?: {
    status: string[]
    shipmentStatus: string[]
    paymentMethod: string[]
  }
}

function Orders() {
  const navigate = useNavigate()
  const [ordersData, setOrdersData] = useState<OrdersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [fezDialogOpen, setFezDialogOpen] = useState(false)
  const [fezOrderNo, setFezOrderNo] = useState("")
  const [isDeletingFezOrder, setIsDeletingFezOrder] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [isLoadingPage, setIsLoadingPage] = useState(false)

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    isStale: "false",
    isOpen: "",
    paid: "",
    shipmentStatus: "",
    startDate: "",
    endDate: "",
    paymentMethod: "",
    isCashOnDelivery: "",
    channel: ""
  })

  // Search input state
  const [searchInput, setSearchInput] = useState("")

  // Fetch orders when page, limit, or filters change
  useEffect(() => {
    fetchOrders(currentPage, limit)
  }, [currentPage, limit, filters])

  const fetchOrders = async (page: number, pageLimit: number) => {
    try {
      setIsLoadingPage(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageLimit.toString()
      })

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await api.get(`/api/admin/orders?${params.toString()}`)
      setOrdersData(response.data)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
      setIsLoadingPage(false)
    }
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || (ordersData && page > ordersData.totalPages)) return
    setCurrentPage(page)
  }

  const handleLimitChange = (value: string) => {
    setLimit(parseInt(value))
    setCurrentPage(1)
  }

  const handleFilterChange = (key: string, value: string) => {
    const filterValue = value === "all" ? "" : value
    setFilters(prev => ({ ...prev, [key]: filterValue }))
    setCurrentPage(1)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleFilterChange('search', searchInput)
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      isStale: "false",
      isOpen: "",
      paid: "",
      shipmentStatus: "",
      startDate: "",
      endDate: "",
      paymentMethod: "",
      isCashOnDelivery: "",
      channel: ""
    })
    setSearchInput("")
  }

  const handleDeleteFezOrder = async () => {
    if (!fezOrderNo.trim()) return
    try {
      setIsDeletingFezOrder(true);
      await api.delete(`/api/admin/fez-orders/${fezOrderNo.trim()}`);
      toast.success("Fez order cancelled successfully");
      setFezDialogOpen(false);
      setFezOrderNo("");
      fetchOrders(currentPage, limit);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to cancel Fez order");
    } finally {
      setIsDeletingFezOrder(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'processing':
      case 'confirmed':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'shipped':
      case 'in-transit':
      case 'in_transit':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'delivered':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'cancelled':
      case 'failed':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'draft':
      case 'pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const stats = useMemo(() => {
    if (!ordersData) return null;
    return {
      total: ordersData.totalOrders,
      // These would ideally come from a summary API, but we can display what we have
      paid: ordersData.orders.filter(o => o.paid).length,
      processing: ordersData.orders.filter(o => o.status === 'processing').length,
      revenue: ordersData.orders.reduce((sum, o) => sum + (o.paid ? o.totalAmount : 0), 0)
    };
  }, [ordersData]);

  const statusTabs = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Processing', value: 'processing' },
    { label: 'In-Transit', value: 'in-transit' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Orders</h2>
          <p className="text-slate-400 mt-1">Monitor and manage all customer transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={fezDialogOpen} onOpenChange={setFezDialogOpen}>
            <DialogTrigger asChild>
              {/* <Button variant="outline" className="border-rose-500/20 text-rose-400 hover:bg-rose-500/10">
                <Trash2 className="h-4 w-4 mr-2" />
                Cancel Fez Order
              </Button> */}
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Cancel Fez Delivery</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Enter the Fez order number (FEZ-...) to cancel the delivery shipment.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="FEZ-12345678"
                  value={fezOrderNo}
                  onChange={(e) => setFezOrderNo(e.target.value)}
                  className="bg-slate-950 border-slate-800 focus:ring-rose-500"
                />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setFezDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDeleteFezOrder} disabled={isDeletingFezOrder}>
                  {isDeletingFezOrder ? <Loader2 className="animate-spin h-4 w-4" /> : "Confirm Cancellation"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="border-slate-800 bg-slate-900 text-white hover:bg-slate-800">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Total Orders</p>
                <h3 className="text-2xl font-bold text-white mt-1">{stats?.total || 0}</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Paid Orders</p>
                <h3 className="text-2xl font-bold text-emerald-400 mt-1">{stats?.paid || 0}</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Processing</p>
                <h3 className="text-2xl font-bold text-amber-400 mt-1">{stats?.processing || 0}</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Sample Revenue</p>
                <h3 className="text-2xl font-bold text-white mt-1">{formatCurrency(stats?.revenue || 0)}</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleFilterChange('status', tab.value)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-all relative",
                (filters.status || 'all') === tab.value
                  ? "text-blue-400"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {tab.label}
              {(filters.status || 'all') === tab.value && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search by Order ID, Customer, or Seller..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus:ring-blue-500"
            />
          </form>

          <div className="flex flex-wrap gap-2">
            <Select value={filters.paid || "all"} onValueChange={(v) => handleFilterChange('paid', v)}>
              <SelectTrigger className="w-[140px] bg-slate-900 border-slate-800 text-white">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-white">
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="true">Paid</SelectItem>
                <SelectItem value="false">Unpaid</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-slate-800 bg-slate-900 text-white hover:bg-slate-800">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                  <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-900 border-slate-800 text-white w-56" align="end">
                <div className="p-2 space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-500 px-1">Channel</p>
                    <Select value={filters.channel || "all"} onValueChange={(v) => handleFilterChange('channel', v)}>
                      <SelectTrigger className="h-8 bg-slate-950 border-slate-800">
                        <SelectValue placeholder="Select Channel" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-slate-800 text-white">
                        <SelectItem value="all">All Channels</SelectItem>
                        <SelectItem value="marketplace">Marketplace</SelectItem>
                        <SelectItem value="livestream">Livestream</SelectItem>
                        <SelectItem value="terminal">Terminal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-500 px-1">Order Type</p>
                    <Select value={filters.isStale} onValueChange={(v) => handleFilterChange('isStale', v)}>
                      <SelectTrigger className="h-8 bg-slate-950 border-slate-800 text-white">
                        <SelectValue placeholder="Order Type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-slate-800 text-white">
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="false">Active Orders</SelectItem>
                        <SelectItem value="true">Stale Orders</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DropdownMenuSeparator className="bg-slate-800" />
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-xs h-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                    onClick={clearFilters}
                  >
                    <X className="h-3.5 w-3.5 mr-2" />
                    Clear All
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-slate-800 bg-slate-900 text-white hover:bg-slate-800">
                  <Calendar className="h-4 w-4 mr-2" />
                  Date Range
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-900 border-slate-800 text-white p-4 w-64" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Start Date</label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="bg-slate-950 border-slate-800 h-8"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">End Date</label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="bg-slate-950 border-slate-800 h-8"
                    />
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
        {loading || isLoadingPage ? (
          <div className="h-[400px] flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <p className="text-slate-400 animate-pulse">Fetching orders...</p>
          </div>
        ) : ordersData && ordersData.orders.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-950/50">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider py-4">Order Details</TableHead>
                  <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Customer</TableHead>
                  <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Store</TableHead>
                  <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Items</TableHead>
                  <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider text-right">Amount</TableHead>
                  <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider text-center">Status</TableHead>
                  <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersData.orders.map((order) => (
                  <TableRow
                    key={order._id}
                    className="border-slate-800 hover:bg-slate-800/30 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/dashboard/order-detail/${order._id}`)}
                  >
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold font-mono tracking-tight">{order.order_id}</span>
                          {order.isStale && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1 bg-slate-950 text-slate-500 border-slate-800 uppercase">Stale</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500">{format(new Date(order.createdAt), "MMM d, yyyy • h:mm a")}</span>
                          <Badge className={cn(
                            "text-[9px] h-4 px-1 border-0 uppercase font-bold",
                            order.channel === 'marketplace' ? "bg-blue-500/10 text-blue-500" :
                              order.channel === 'livestream' ? "bg-purple-500/10 text-purple-500" :
                                "bg-orange-500/10 text-orange-500"
                          )}>
                            {order.channel}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-slate-800 ring-2 ring-slate-950">
                          <AvatarImage src={order.buyerDetails?.profileImage?.[0]?.url} alt={order.buyer?.firstName} />
                          <AvatarFallback className="bg-slate-800 text-slate-400 text-xs">
                            {order.buyer?.firstName?.[0]}{order.buyer?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-white truncate max-w-[140px]">
                            {order.buyer?.firstName} {order.buyer?.lastName}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate max-w-[140px]">
                            {order.buyer?.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 text-slate-600" />
                          <span className="text-sm font-medium text-slate-300 truncate max-w-[140px]">
                            {order.seller?.storeName || order.seller?.businessName}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 pl-4 capitalize">
                          {order.seller?.firstName} {order.seller?.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2 overflow-hidden">
                          {order.items.slice(0, 3).map((item, i) => (
                            <div key={i} className="h-8 w-8 rounded-lg border-2 border-slate-900 bg-slate-800 overflow-hidden">
                              <img
                                src={item.productImages?.[0]?.url || item.product?.images?.[0]?.url}
                                className="h-full w-full object-cover"
                                alt=""
                              />
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="h-8 w-8 rounded-lg border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-slate-400">
                              +{order.items.length - 3}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-bold text-white">{formatCurrency(order.totalAmount)}</span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className={cn(
                            "text-[9px] h-4 px-1 font-bold uppercase border-0",
                            order.paid ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                          )}>
                            {order.paid ? "Paid" : "Unpaid"}
                          </Badge>
                          <span className="text-[9px] text-slate-600 uppercase font-mono">{order.paymentInfo?.method}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center gap-1.5">
                        <Badge variant="outline" className={cn("border-0 shadow-none font-bold uppercase text-[10px] h-5 px-2", getStatusColor(order.status))}>
                          {order.status}
                        </Badge>
                        {order.isStorePickup && (
                          <Badge className="bg-amber-500/10 text-amber-500 border-0 text-[8px] h-3 px-1 uppercase letter-wide">Pickup</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-white hover:bg-slate-800 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/order-detail/${order._id}`);
                          }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center text-center p-8">
            <div className="h-16 w-16 rounded-3xl bg-slate-800 flex items-center justify-center mb-4">
              <ShoppingCart className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white">No orders found</h3>
            <p className="text-slate-400 max-w-xs mt-2">
              We couldn't find any orders matching your current search or filter criteria.
            </p>
            <Button variant="link" className="text-blue-400 mt-2" onClick={clearFilters}>
              Reset all filters
            </Button>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {ordersData && ordersData.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>View</span>
              <Select value={limit.toString()} onValueChange={handleLimitChange}>
                <SelectTrigger className="h-8 w-16 bg-slate-900 border-slate-800 text-white">
                  <SelectValue placeholder={limit.toString()} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white min-w-[70px]">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-slate-500">
              Showing <span className="text-slate-300">{((currentPage - 1) * limit) + 1}</span> to <span className="text-slate-300">{Math.min(currentPage * limit, ordersData.totalOrders)}</span> of <span className="text-slate-300">{ordersData.totalOrders}</span>
            </p>
          </div>

          <Pagination>
            <PaginationContent className="gap-1">
              <PaginationItem>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-slate-900 border-slate-800 text-slate-400 disabled:opacity-30"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </PaginationItem>

              <div className="flex items-center gap-1 mx-2">
                <span className="text-sm font-bold text-blue-400 px-2 min-w-[32px] text-center">
                  {currentPage}
                </span>
                <span className="text-slate-600 text-xs">/</span>
                <span className="text-sm font-medium text-slate-500 px-2">
                  {ordersData.totalPages}
                </span>
              </div>

              <PaginationItem>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-slate-900 border-slate-800 text-slate-400 disabled:opacity-30"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === ordersData.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}

export default Orders
