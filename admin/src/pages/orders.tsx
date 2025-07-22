import { 
  ShoppingCart,
  Package,
  ArrowUpRight,
  Eye,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Filter,
  X,
  Clock
} from "lucide-react"
import { Card } from "@/components/ui/card"
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
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

// Define TypeScript interfaces
interface Order {
  _id: string
  order_id: string
  buyer: {
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
  }
  items: {
    product: {
      name: string
      images?: { url: string, _id: string }[]
    }
    quantity: number
    price: number
    status?: string
  }[]
  totalAmount: number
  shipping: {
    method?: string
    tracking?: {
      status: string
      number?: string
      carrier?: string
      history?: {
        status: string
        timestamp: string
        description?: string
      }[]
    }
    carrier?: {
      name: string
      reference: string
    }
    fee?: {
      amount: number
      currency: string
    }
    shipment_id?: string
    fez_order_number?: string
  }
  paymentInfo: {
    status: string
    method?: string
    paidAt?: string
    isCashOnDelivery?: boolean
  }
  orderStatus?: {
    hasReturn: boolean
    hasDispute: boolean
    hasRefund: boolean
  }
  refundRequest?: {
    requested: boolean
    status: string
  }
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
}

function Orders() {
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
    isStale: "",
    isOpen: "",
    paid: "",
    shipmentStatus: "",
    startDate: "",
    endDate: "",
    paymentMethod: "",
    isCashOnDelivery: ""
  })
  
  // Filter options from API
  const [filterOptions, setFilterOptions] = useState({
    itemStatuses: [],
    shipmentStatuses: [],
    paymentMethods: []
  })
  
  // Search input state (separate from filter state to avoid immediate API calls)
  const [searchInput, setSearchInput] = useState("")
  
  // Order statistics state
  const [orderStats, setOrderStats] = useState({
    byStatus: {},
    byPaymentMethod: {},
    byDay: {},
    openVsClosed: { open: 0, closed: 0 },
    staleOrders: { stale: 0, active: 0 }
  })
  
  // Calculate total revenue from paid orders using useMemo
  const totalRevenue = useMemo(() => {
    return ordersData?.orders
      ?.filter(order => order.paymentInfo?.status === 'paid')
      ?.reduce((sum, order) => sum + (order.totalAmount || 0), 0) || 0
  }, [ordersData?.orders])

  // Calculate pending orders count using useMemo
  const pendingOrders = useMemo(() => {
    return ordersData?.orders
      ?.filter(order => order.paymentInfo?.status === 'pending')
      ?.length || 0
  }, [ordersData?.orders])
  
  // Fetch order statistics
  const fetchOrderStats = async () => {
    try {
      const { startDate, endDate } = filters;
      let url = '/api/admin/orders/stats';
      
      // Add date filters if present
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await api.get(url);
      setOrderStats(response.data);
    } catch (error) {
      console.error('Error fetching order statistics:', error);
    }
  }
  
  // Fetch stats when date filters change
  useEffect(() => {
    fetchOrderStats();
  }, [filters.startDate, filters.endDate])

  // Fetch filter options on component mount
  useEffect(() => {
    fetchFilterOptions()
  }, [])
  
  // Fetch orders when page, limit, or filters change
  useEffect(() => {
    fetchOrders(currentPage, limit)
  }, [currentPage, limit, filters])
  
  // Fetch available filter options from API
  const fetchFilterOptions = async () => {
    try {
      const response = await api.get('/api/admin/orders/status-options')
      // Normalize API response keys to expected state structure
      setFilterOptions({
        itemStatuses: (response.data.itemStatuses || response.data.status || []).filter(Boolean),
        shipmentStatuses: (response.data.shipmentStatuses || response.data.shipmentStatus || []).filter(Boolean),
        paymentMethods: (response.data.paymentMethods || response.data.paymentMethod || []).filter(Boolean)
      })
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }

  const fetchOrders = async (page: number, pageLimit: number) => {
    try {
      setIsLoadingPage(true)
      
      // Build query string with all filters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageLimit.toString()
      })
      
      // Add all active filters to the query
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
    if (page < 1 || (ordersData && page > ordersData.totalPages)) {
      return
    }
    setCurrentPage(page)
  }

  const handleLimitChange = (value: string) => {
    setLimit(parseInt(value))
    setCurrentPage(1) // Reset to first page when changing limit
  }
  
  const handleFilterChange = (key: string, value: string) => {
    // Convert "all" value to empty string for API filtering
    const filterValue = value === "all" ? "" : value
    setFilters(prev => ({ ...prev, [key]: filterValue }))
    setCurrentPage(1) // Reset to first page when changing filters
  }
  
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
  }
  
  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleFilterChange('search', searchInput)
    }
  }
  
  const handleApplySearch = () => {
    handleFilterChange('search', searchInput)
  }
  
  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      isStale: "",
      isOpen: "",
      paid: "",
      shipmentStatus: "",
      startDate: "",
      endDate: "",
      paymentMethod: "",
      isCashOnDelivery: ""
    })
    setSearchInput("")
  }
  
  // Check if any filter is active
  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== "")
  }

  const handleDeleteFezOrder = async () => {
    if (!fezOrderNo.trim()) {
      toast.error("Please enter a valid Fez order number");
      return;
    }

    try {
      setIsDeletingFezOrder(true);
      const response = await api.delete(`/api/admin/fez-orders/${fezOrderNo.trim()}`);
      
      toast.success(response.data.message || "Fez order cancelled successfully");
      setFezDialogOpen(false);
      setFezOrderNo("");
      
      // Refresh orders data with current pagination
      fetchOrders(currentPage, limit);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to cancel Fez order");
    } finally {
      setIsDeletingFezOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Orders</h2>
          <p className="text-muted-foreground">Manage and track customer orders</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="shrink-0">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          {/* Delete Fez Order Button */}
          <Dialog open={fezDialogOpen} onOpenChange={setFezDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="shrink-0">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Fez Order
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white">
              <DialogHeader>
                <DialogTitle>Delete Fez Order</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Enter the Fez order number to cancel the delivery order.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input
                  placeholder="Enter Fez Order Number"
                  value={fezOrderNo}
                  onChange={(e) => setFezOrderNo(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setFezDialogOpen(false)}
                  className="bg-gray-800 text-white hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteFezOrder}
                  disabled={!fezOrderNo.trim() || isDeletingFezOrder}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeletingFezOrder ? "Deleting..." : "Delete Fez Order"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button className="bg-primary shrink-0">
            <ShoppingCart className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Order Stats */}
      {/* <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total Orders</p>
              <h3 className="text-2xl font-bold">{ordersData?.totalOrders || 0}</h3>
              <div className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500">{orderStats.openVsClosed.open}</span> open / 
                <span className="text-gray-500"> {orderStats.openVsClosed.closed}</span> closed
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Order Status</p>
              <h3 className="text-2xl font-bold">
                {Object.entries(orderStats.byStatus || {}).slice(0, 1).map(([status, count]) => (
                  <span key={status}>{count as number}</span>
                ))}
              </h3>
              <div className="text-xs text-muted-foreground mt-1">
                {Object.entries(orderStats.byStatus || {}).slice(0, 1).map(([status, count]) => (
                  <span key={status} className="capitalize">{status}</span>
                ))}
                {Object.keys(orderStats.byStatus || {}).length > 1 && (
                  <span className="ml-1">
                    +{Object.keys(orderStats.byStatus || {}).length - 1} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <ArrowUpRight className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total Revenue</p>
              <h3 className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</h3>
              <div className="text-xs text-muted-foreground mt-1">
                {Object.entries(orderStats.byPaymentMethod || {}).slice(0, 1).map(([method, data]) => (
                  <span key={method}>{method}: ₦{(data as any)?.amount?.toLocaleString() || 0}</span>
                ))}
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-500/10 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Stale Orders</p>
              <h3 className="text-2xl font-bold">{orderStats.staleOrders?.stale || 0}</h3>
              <div className="text-xs text-muted-foreground mt-1">
                {orderStats.staleOrders?.active || 0} active orders
              </div>
            </div>
          </div>
        </Card>
      </div> */}

      {/* Order Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Input
              placeholder="Search by order ID, customer name or product..."
              value={searchInput}
              onChange={handleSearchInputChange}
              onKeyDown={handleSearchSubmit}
              className="pl-9"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            
            <Button 
              variant="default" 
              size="sm" 
              className="absolute right-0 top-0 h-full rounded-l-none"
              onClick={handleApplySearch}
            >
              Search
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={clearFilters}
            disabled={!hasActiveFilters()}
            title="Clear all filters"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Visible Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Order Status Filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Item Status</label>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {filterOptions.itemStatuses?.filter(Boolean).map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Open/Closed Filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Order State</label>
            <Select
              value={filters.isOpen || "all"}
              onValueChange={(value) => handleFilterChange('isOpen', value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Open/Closed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="true">Open Orders</SelectItem>
                <SelectItem value="false">Closed Orders</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Payment Status Filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Payment Status</label>
            <Select
              value={filters.paid || "all"}
              onValueChange={(value) => handleFilterChange('paid', value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Paid</SelectItem>
                <SelectItem value="false">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Payment Method Filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
            <Select
              value={filters.paymentMethod || "all"}
              onValueChange={(value) => handleFilterChange('paymentMethod', value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {filterOptions.paymentMethods?.filter(Boolean).map((method) => (
                  <SelectItem key={method} value={method}>{method || 'Unknown'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Shipment Status Filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Shipment Status</label>
            <Select
              value={filters.shipmentStatus || "all"}
              onValueChange={(value) => handleFilterChange('shipmentStatus', value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Shipment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shipments</SelectItem>
                {filterOptions.shipmentStatuses?.filter(Boolean).map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Stale Orders Filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Stale Orders</label>
            <Select
              value={filters.isStale || "all"}
              onValueChange={(value) => handleFilterChange('isStale', value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Stale" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="true">Stale Orders</SelectItem>
                <SelectItem value="false">Active Orders</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Date Range Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Start Date</label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">End Date</label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="h-8"
            />
          </div>
        </div>
        
        {/* Active filters display */}
        {hasActiveFilters() && (
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
            <span className="text-muted-foreground">Active filters:</span>
            {filters.search && (
              <Badge variant="secondary" className="px-2 py-0.5 h-6">
                Search: {filters.search.length > 15 ? filters.search.substring(0, 15) + '...' : filters.search}
                <Button
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 -mr-1"
                  onClick={() => handleFilterChange('search', '')}
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </Badge>
            )}
            {filters.status && (
              <Badge variant="secondary" className="px-2 py-0.5 h-6">
                Status: {filters.status}
                <Button
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 -mr-1"
                  onClick={() => handleFilterChange('status', '')}
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </Badge>
            )}
            {filters.isOpen && (
              <Badge variant="secondary" className="px-2 py-0.5 h-6">
                {filters.isOpen === 'true' ? 'Open' : 'Closed'}
                <Button
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 -mr-1"
                  onClick={() => handleFilterChange('isOpen', '')}
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </Badge>
            )}
            {filters.paid && (
              <Badge variant="secondary" className="px-2 py-0.5 h-6">
                {filters.paid === 'true' ? 'Paid' : 'Unpaid'}
                <Button
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 -mr-1"
                  onClick={() => handleFilterChange('paid', '')}
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </Badge>
            )}
            {filters.shipmentStatus && (
              <Badge variant="secondary" className="px-2 py-0.5 h-6">
                Ship: {filters.shipmentStatus}
                <Button
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 -mr-1"
                  onClick={() => handleFilterChange('shipmentStatus', '')}
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </Badge>
            )}
            {filters.isStale && (
              <Badge variant="secondary" className="px-2 py-0.5 h-6">
                {filters.isStale === 'true' ? 'Stale' : 'Not Stale'}
                <Button
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 -mr-1"
                  onClick={() => handleFilterChange('isStale', '')}
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </Badge>
            )}
            {filters.paymentMethod && (
              <Badge variant="secondary" className="px-2 py-0.5 h-6">
                Method: {filters.paymentMethod}
                <Button
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 -mr-1"
                  onClick={() => handleFilterChange('paymentMethod', '')}
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </Badge>
            )}
            {filters.isCashOnDelivery && (
              <Badge variant="secondary" className="px-2 py-0.5 h-6">
                {filters.isCashOnDelivery === 'true' ? 'COD' : 'Non-COD'}
                <Button
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 -mr-1"
                  onClick={() => handleFilterChange('isCashOnDelivery', '')}
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </Badge>
            )}
            {filters.startDate && (
              <Badge variant="secondary" className="px-2 py-0.5 h-6">
                From: {filters.startDate}
                <Button
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 -mr-1"
                  onClick={() => handleFilterChange('startDate', '')}
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </Badge>
            )}
            {filters.endDate && (
              <Badge variant="secondary" className="px-2 py-0.5 h-6">
                To: {filters.endDate}
                <Button
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 -mr-1"
                  onClick={() => handleFilterChange('endDate', '')}
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </Badge>
            )}
          </div>
        )}
      </Card>

      {/* Orders Table */}
      <Card className="p-6 overflow-hidden">
        <div className="w-full overflow-x-auto relative">
          {isLoadingPage && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <Table className="min-w-[1000px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Order ID</TableHead>
                <TableHead className="w-[120px]">Customer</TableHead>
                <TableHead className="w-[120px]">Seller</TableHead>
                <TableHead className="w-[150px]">Items</TableHead>
                <TableHead className="w-[100px]">Payment</TableHead>
                <TableHead className="w-[150px]">Shipping</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[120px]">Total</TableHead>
                <TableHead className="hidden md:table-cell w-[120px]">Date</TableHead>
                <TableHead className="w-[60px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : ordersData?.orders && ordersData.orders.length > 0 ? (
                ordersData.orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium">{order.order_id}</TableCell>
                    <TableCell>
                      {order.buyer ? `${order.buyer.firstName || ''} ${order.buyer.lastName || ''}` : 'Unknown Buyer'}
                      {order.buyer?.phoneNumber && (
                        <div className="text-xs text-muted-foreground mt-1">{order.buyer.phoneNumber}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.seller?.storeName || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {order.items.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium truncate max-w-[150px]" title={order.items[0]?.product?.name || 'Product unavailable'}>
                            {order.items[0]?.product?.name 
                              ? (order.items[0].product.name.length > 50 
                                ? order.items[0].product.name.substring(0, 50) + '...' 
                                : order.items[0].product.name)
                              : 'Product unavailable'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Qty: {order.items[0].quantity}
                            {order.items.length > 1 ? ` (+${order.items.length - 1} more)` : ''}
                          </span>
                        </div>
                      ) : 'No items'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <Badge variant={order.paymentInfo.status === 'paid' ? 'default' : 'secondary'} className="mb-1">
                          {order.paymentInfo.status}
                        </Badge>
                        {order.paymentInfo.method && (
                          <span className="text-xs text-muted-foreground capitalize">{order.paymentInfo.method}</span>
                        )}
                        {order.paymentInfo.isCashOnDelivery && (
                          <span className="text-xs text-yellow-500">COD</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.isStorePickup ? (
                        <Badge variant="outline">Store Pickup</Badge>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">
                            {order.shipping.carrier?.name || order.shipping.method || 'Standard'}
                          </span>
                          {order.shipping.tracking && (
                            <div className="flex items-center gap-1 mt-1">
                              <Badge 
                                variant={
                                  order.shipping.tracking.status === 'delivered' ? 'default' :
                                  order.shipping.tracking.status === 'cancelled' ? 'destructive' :
                                  'secondary'
                                }
                                className="text-xs"
                              >
                                {order.shipping.tracking.status}
                              </Badge>
                            </div>
                          )}
                          {order.shipping.tracking?.number && (
                            <span className="text-xs text-muted-foreground mt-1">
                              #{order.shipping.tracking.number}
                            </span>
                          )}
                          {order.shipping?.fee && order.shipping.fee.amount > 0 && (
                            <span className="text-xs text-muted-foreground mt-1">
                              Fee: ₦{order.shipping.fee.amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                      <div className="inline-flex items-center gap-2">
  {order.isStale ? (
    <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
      Stale
    </Badge>
  ) : (
    <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium
      ${order.isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
      <div className={`h-1.5 w-1.5 rounded-full
        ${order.isOpen ? "bg-green-600" : "bg-gray-600"}`} />
      {order.isOpen ? "Open" : "Closed"}
    </div>
  )}
</div>
                        
                        {order.orderStatus && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {order.orderStatus.hasReturn && (
                              <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">Return</Badge>
                            )}
                            {order.orderStatus.hasDispute && (
                              <Badge variant="outline" className="text-xs bg-red-100 text-red-800 border-red-200">Dispute</Badge>
                            )}
                            {order.orderStatus.hasRefund && (
                              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">Refund</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">
                          ₦{(
                            (order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)) + 
                            (order.shipping?.fee?.amount || 0)
                          ).toLocaleString()}
                        </span>
                        {order.items.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            Items: ₦{order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}
                          </span>
                        )}
                        {order.shipping?.fee && order.shipping.fee.amount > 0 && (
                          <span className="text-xs text-muted-foreground">
                            + Shipping: ₦{order.shipping.fee.amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} {new Date(order.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Link to={`/dashboard/order-detail/${order._id}`}>
                          <Button variant="ghost" size="icon" title="View Order">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">No orders found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Pagination UI */}
          {ordersData && ordersData.totalPages > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className="text-muted-foreground">Show</span>
                <Select
                  value={limit.toString()}
                  onValueChange={handleLimitChange}
                >
                  <SelectTrigger className="h-8 w-16">
                    <SelectValue placeholder={limit.toString()} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">per page</span>
              </div>
              
              <div className="text-xs sm:text-sm text-muted-foreground text-center">
                Showing {ordersData.orders.length ? ((ordersData.currentPage - 1) * limit) + 1 : 0}-
                {Math.min(ordersData.currentPage * limit, ordersData.totalOrders)} of {ordersData.totalOrders} orders
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1 || isLoadingPage}
                  className="h-7 sm:h-8 w-7 sm:w-8 p-0"
                >
                  <span className="sr-only">First Page</span>
                  <span>«</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoadingPage}
                  className="h-7 sm:h-8 w-7 sm:w-8 p-0"
                >
                  <span className="sr-only">Previous Page</span>
                  <span>‹</span>
                </Button>
                
                {/* Generate page links */}
                {Array.from({ length: Math.min(5, ordersData.totalPages) }, (_, i) => {
                  // Calculate which page numbers to show
                  let pageNum = i + 1;
                  if (ordersData.totalPages > 5) {
                    if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= ordersData.totalPages - 2) {
                      pageNum = ordersData.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isLoadingPage}
                      className="h-7 sm:h-8 w-7 sm:w-8 p-0 hidden xs:flex xs:items-center xs:justify-center"
                    >
                      <span className="sr-only">Page {pageNum}</span>
                      <span>{pageNum}</span>
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === ordersData.totalPages || isLoadingPage}
                  className="h-7 sm:h-8 w-7 sm:w-8 p-0"
                >
                  <span className="sr-only">Next Page</span>
                  <span>›</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(ordersData.totalPages)}
                  disabled={currentPage === ordersData.totalPages || isLoadingPage}
                  className="h-7 sm:h-8 w-7 sm:w-8 p-0"
                >
                  <span className="sr-only">Last Page</span>
                  <span>»</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default Orders
