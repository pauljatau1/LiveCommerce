import { 
  ShoppingCart,
  Package,
  ArrowUpRight,
  Eye,
  Download,
  Trash2
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

// Define TypeScript interfaces
interface Order {
  _id: string
  order_id: string
  buyer: {
    firstName: string
    lastName: string
  }
  items: {
    product: {
      name: string
    }
    quantity: number
    price: number
  }[]
  totalAmount: number
  shipping: {
    method: string
    tracking: {
      status: string
    }
  }
  createdAt: string
  paymentInfo: {
    status: string
  }
  isOpen: boolean
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

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/api/admin/orders?page=1&limit=100')
        setOrdersData(response.data)
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

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
      
      // Refresh orders data
      const refreshedOrders = await api.get('/api/admin/orders?page=1&limit=100');
      setOrdersData(refreshedOrders.data);
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
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total Orders</p>
              <h3 className="text-2xl font-bold">{ordersData?.totalOrders || 0}</h3>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Pending Orders</p>
              <h3 className="text-2xl font-bold">{pendingOrders}</h3>
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
            </div>
          </div>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="p-6 overflow-auto">
        <div className="w-full min-w-max md:min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : ordersData?.orders && ordersData.orders.length > 0 ? (
                ordersData.orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium">{order.order_id}</TableCell>
                    <TableCell>
                      {order.buyer ? `${order.buyer.firstName || ''} ${order.buyer.lastName || ''}` : 'Unknown Buyer'}
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium
                        ${order.isOpen 
                          ? "bg-green-100 text-green-700" 
                          : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <div className={`h-1.5 w-1.5 rounded-full
                          ${order.isOpen ? "bg-green-600" : "bg-gray-600"}`} 
                        />
                        {order.isOpen ? "Open" : "Closed"}
                      </div>
                    </TableCell>
                    <TableCell>₦{(order.totalAmount || 0).toLocaleString()}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(order.createdAt).toLocaleDateString()}
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
                  <TableCell colSpan={8} className="text-center">No orders found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}

export default Orders
