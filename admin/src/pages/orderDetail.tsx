import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from "@/api/axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Package,
  Truck,
  MapPin,
  Clock,
  Store,
  XCircle,
  Trash2,
  Bell,
  ShoppingCart,
  RefreshCw,
  Shield,
  ChevronRight,
  Phone,
  Printer,
  History,
  Copy,
  ExternalLink,
  FileText,
  Mail,
  Calendar,
  CreditCard,
  Banknote,
  Receipt,
  Zap,
  CheckCircle2,
  AlertTriangle,
  User,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// Standardized status colors
const getStatusColor = (status: string) => {
  const s = status?.toLowerCase();
  if (['delivered', 'paid', 'success', 'open', 'ready', 'confirmed'].includes(s))
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (['processing', 'shipped', 'picked-up', 'dispatched', 'in-transit', 'picked', 'in_transit'].includes(s))
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  if (['pending', 'awaiting'].includes(s))
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  if (['cancelled', 'failed', 'closed', 'unpaid', 'rejected'].includes(s))
    return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
};

interface OrderDetail {
  order: {
    _id: string
    order_id: string
    channel: string
    createdAt: string
    totalAmount: number
    paid: boolean
    isStale: boolean
    isStorePickup: boolean
    storePickupStatus: string | { state: string } | null
    paymentInfo: {
      method: string
      status: string
      transactionId?: string
      paidAt: string
    }
    orderStatus: {
      isOpen: boolean
      hasReturn: boolean
      hasDispute: boolean
      hasRefund: boolean
      returnRequestId: string | null
      closedAt?: string | null
      closedBy?: string | null
      closedReason?: string | null
    }
    returnDetails: any | null
    paymentBreakdown: {
      orderTotal: number
      items: Array<{
        productName: string
        amount: number
        platformFeePercentage: number
        platformFeeAmount: number
      }>
      fees: {
        totalPlatformFee: number
        processingFee: number
        processingFeePercentage: number
        totalDeductions: number
      }
      sellerPayout: number
    }
  }
  buyer: {
    _id: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    createdAt?: string
    profileImage?: { url: string }[]
  }
  seller: {
    sellerAddress?: any
    businessAddress?: any
    _id: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    businessName?: string
    storeName: string
  }
  items: Array<{
    product: {
      _id: string
      name: string
      category: string
      description: string
      images: Array<{ url: string }>
      brand: string
      stock: number
      sku: string
      status: string
      condition: string
    }
    productName: string
    seller: any
    quantity: number
    price: number
    status: string
    statusHistory: Array<{
      status: string
      timestamp: string
      _id: string
      description?: string
    }>
    specifications: {
      color: string
      size: string
      material: string
    }
  }>
  addresses: {
    delivery: any
    pickup?: any
  }
  shipping: {
    carrier: { name: string, reference: string }
    fee: { amount: number, currency: string }
    tracking: {
      number: string
      carrier: string
      status: string
      history: Array<any>
    }
    shipment_id: string
    documents: Record<string, any>
    estimatedDeliveryDate?: string
    estimatedPickupDate?: string
    rate_id?: string
  }
  discount: Record<string, any>
  notes: Array<any>
  timeline: Array<{
    status: string
    timestamp: string
    description?: string
  }>
}

function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [orderData, setOrderData] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [fezDialogOpen, setFezDialogOpen] = useState(false)
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [terminalDialogOpen, setTerminalDialogOpen] = useState(false)

  // Action states
  const [reason, setReason] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [fezOrderNo, setFezOrderNo] = useState("")
  const [isDeletingFezOrder, setIsDeletingFezOrder] = useState(false)
  const [webhookFezOrderNo, setWebhookFezOrderNo] = useState("")
  const [webhookStatus, setWebhookStatus] = useState("")
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [isCancellingOrder, setIsCancellingOrder] = useState(false)
  const [terminalShipmentId, setTerminalShipmentId] = useState("")
  const [terminalEvent, setTerminalEvent] = useState("")
  const [isSimulatingTerminalWebhook, setIsSimulatingTerminalWebhook] = useState(false)

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/api/order/${id}`)
      setOrderData(response.data)
    } catch (error) {
      console.error('Error fetching order details:', error)
      toast.error("Failed to load order details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrderDetails()
  }, [id])

  const handleStatusUpdate = async (newStatus: boolean) => {
    try {
      setIsUpdating(true)
      await api.put(`/api/order/${id}/open-status`, {
        isOpen: newStatus,
        reason: reason
      })
      toast.success(`Order ${newStatus ? 'reopened' : 'closed'} successfully`)
      fetchOrderDetails()
      setDialogOpen(false)
      setReason("")
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error("Failed to update status")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteFezOrder = async () => {
    if (!fezOrderNo.trim()) return toast.error("Enter Fez order number")
    try {
      setIsDeletingFezOrder(true)
      await api.delete(`/api/admin/fez-orders/${fezOrderNo.trim()}`)
      toast.success("Fez order deleted")
      fetchOrderDetails()
      setFezDialogOpen(false)
      setFezOrderNo("")
    } catch (error) {
      toast.error("Failed to delete Fez order")
    } finally {
      setIsDeletingFezOrder(false)
    }
  }

  const handleSimulateWebhook = async () => {
    if (!webhookFezOrderNo.trim() || !webhookStatus) return toast.error("Missing fields")
    try {
      setIsSimulatingWebhook(true)
      await api.post('/api/notifications/simulate-fez-webhook', {
        orderNumber: webhookFezOrderNo.trim(),
        status: webhookStatus
      })
      toast.success("Webhook simulated")
      fetchOrderDetails()
      setWebhookDialogOpen(false)
    } catch (error) {
      toast.error("Simulation failed")
    } finally {
      setIsSimulatingWebhook(false)
    }
  }

  const handleCancelOrder = async () => {
    try {
      setIsCancellingOrder(true)
      await api.post(`/api/admin/orders/${id}/cancel`, {
        reason: cancelReason.trim() || undefined
      })
      toast.success("Order cancelled")
      fetchOrderDetails()
      setCancelDialogOpen(false)
    } catch (error) {
      toast.error("Cancellation failed")
    } finally {
      setIsCancellingOrder(false)
    }
  }

  const handleSimulateTerminalWebhook = async () => {
    if (!terminalShipmentId.trim() || !terminalEvent) return toast.error("Missing fields")
    try {
      setIsSimulatingTerminalWebhook(true)
      await api.post('/api/notifications/simulate-terminal-webhook', {
        event: terminalEvent,
        data: {
          shipment_id: terminalShipmentId.trim(),
          id: terminalShipmentId.trim(),
          status: terminalEvent.split('.')[1]
        }
      }, {
        headers: { 'x-terminal-signature': 'simulated' }
      })
      toast.success("Terminal webhook simulated")
      fetchOrderDetails()
      setTerminalDialogOpen(false)
    } catch (error) {
      toast.error("Simulation failed")
    } finally {
      setIsSimulatingTerminalWebhook(false)
    }
  }

  // Combined and sorted timeline
  const combinedTimeline = useMemo(() => {
    if (!orderData) return [];
    const { order, items, timeline } = orderData;
    const events: any[] = [];

    // 1. Initial creation
    events.push({
      status: 'Order Placed',
      timestamp: order.createdAt,
      description: `Order #${order.order_id} was successfully placed via ${order.channel}.`
    });

    // 2. Main order timeline
    if (timeline) {
      timeline.forEach(e => events.push(e));
    }

    // 3. Status history from items (if not already in timeline)
    items?.forEach(item => {
      item.statusHistory?.forEach(h => {
        const isDuplicate = events.some(e =>
          e.status.toLowerCase() === h.status.toLowerCase() &&
          Math.abs(new Date(e.timestamp).getTime() - new Date(h.timestamp).getTime()) < 5000
        );
        if (!isDuplicate) {
          events.push({
            status: h.status,
            timestamp: h.timestamp,
            description: h.description || `Item "${item.productName || item.product?.name}" updated to ${h.status}`
          });
        }
      });
    });

    // 4. Shipping tracking history
    if (orderData.shipping?.tracking?.history) {
      orderData.shipping.tracking.history.forEach(h => {
        events.push({
          status: h.status,
          timestamp: h.timestamp,
          description: h.description || `Logistics update: ${h.status}`
        });
      });
    }

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [orderData]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      <p className="text-slate-400 animate-pulse">Loading order details...</p>
    </div>
  )

  if (!orderData) return (
    <div className="p-12 text-center max-w-md mx-auto">
      <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
        <ShoppingCart className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold text-white">Order not found</h2>
      <p className="text-slate-400 mt-2">The order record might have been deleted or is inaccessible.</p>
      <Button onClick={() => navigate('/dashboard/orders')} variant="default" className="mt-6">
        Return to Orders
      </Button>
    </div>
  )

  const { order, buyer, seller, items, addresses, shipping } = orderData

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto pb-20">
      {/* Breadcrumbs & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/dashboard/orders" className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back to Orders
          </Link>
          <span className="text-slate-700">|</span>
          <span className="text-blue-400 font-mono tracking-tighter">#{order.order_id}</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-8 border-slate-800 bg-slate-900 text-white hover:bg-slate-800" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Invoice
          </Button>
        </div>
      </div>

      {/* Top Hero Section */}
      <Card className="bg-slate-900/50 border-slate-800 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
        <CardContent className="p-0">
          <div className="p-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div className="flex gap-5 items-center">
              <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
                <ShoppingCart className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white tracking-tight">Order #{order.order_id}</h1>
                  <Badge className={cn("border-0 uppercase font-bold text-[10px]", getStatusColor(order.orderStatus.isOpen ? 'open' : 'closed'))}>
                    {order.orderStatus.isOpen ? 'Active' : 'Archived'}
                  </Badge>
                  {order.isStale && <Badge className="bg-slate-800 text-slate-500 border-0 text-[10px] uppercase font-bold">Stale</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-sm">
                  <span className="text-slate-400">Placed on <span className="text-slate-200">{format(new Date(order.createdAt), "PPP 'at' p")}</span></span>
                  <span className="text-slate-700">•</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Via</span>
                    <Badge variant="secondary" className="bg-slate-800 text-blue-400 border-0 uppercase text-[9px] font-bold py-0 h-5">
                      {order.channel}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-rose-500/20 text-rose-400 hover:bg-rose-500/10" disabled={!order.orderStatus.isOpen}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Order
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                  <DialogHeader className="space-y-3 font-bold">
                    <DialogTitle className="text-xl">Process Cancellation</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Cancelling this order is permanent. This will trigger the refund process if the customer has already paid.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Textarea
                      placeholder="Enter reason for cancellation (sent to customer)..."
                      className="bg-slate-950 border-slate-800 text-white min-h-[120px]"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setCancelDialogOpen(false)}>Dismiss</Button>
                    <Button variant="destructive" onClick={handleCancelOrder} disabled={!cancelReason || isCancellingOrder}>
                      {isCancellingOrder ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                      Process Cancellation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-slate-800 bg-slate-900 text-white hover:bg-slate-800">
                    <History className="h-4 w-4 mr-2" />
                    {order.orderStatus.isOpen ? "Close Record" : "Restore Order"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                  <DialogHeader>
                    <DialogTitle>{order.orderStatus.isOpen ? "Archives Order" : "Restore Active Status"}</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Archive orders to move them out of the active list once fulfilled or settled.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Textarea
                      placeholder="Add a note for this change..."
                      className="bg-slate-950 border-slate-800 text-white"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleStatusUpdate(!order.orderStatus.isOpen)} disabled={!reason || isUpdating}>
                      {isUpdating ? "Processing..." : "Confirm Status Change"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 border-t border-slate-800/50 divide-x divide-slate-800/50">
            <div className="p-5">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1.5 flex items-center gap-1.5">
                <Banknote className="h-3 w-3" /> Total Value
              </p>
              <div className="text-xl font-bold text-white tracking-tight">₦{order.totalAmount.toLocaleString()}</div>
            </div>
            <div className="p-5">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1.5 flex items-center gap-1.5">
                <CreditCard className="h-3 w-3" /> Payment
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("border-0 font-bold uppercase text-[9px] h-5", getStatusColor(order.paid ? 'paid' : 'unpaid'))}>
                  {order.paid ? 'Paid' : 'Unpaid'}
                </Badge>
                <span className="text-xs text-slate-400 capitalize">{order.paymentInfo.method}</span>
              </div>
            </div>
            <div className="p-5">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1.5 flex items-center gap-1.5">
                <Package className="h-3 w-3" /> Quantity
              </p>
              <div className="text-xl font-bold text-white tracking-tight">{items.reduce((sum, i) => sum + i.quantity, 0)} Items <span className="text-slate-500 font-normal text-sm">/ {items.length} SKU</span></div>
            </div>
            <div className="p-5">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1.5 flex items-center gap-1.5">
                <Truck className="h-3 w-3" /> Logistics
              </p>
              <Badge variant="outline" className={cn("border-0 font-bold uppercase text-[10px] h-5", getStatusColor(shipping?.tracking?.status || 'pending'))}>
                {shipping?.tracking?.status || 'awaiting fulfillment'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - 8/12 */}
        <div className="lg:col-span-8 space-y-6">
          {/* Order Items Table */}
          <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-800 bg-slate-800/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-400" />
                  <CardTitle className="text-lg font-bold text-white">Line Items</CardTitle>
                </div>
                <div className="text-xs text-slate-500 font-mono tracking-tighter uppercase">{items.length} Items Listed</div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-950/30">
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-wider py-4 pl-5">Product Details</TableHead>
                    <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">SKU & Spec</TableHead>
                    <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">Status</TableHead>
                    <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-wider text-right">Price</TableHead>
                    <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-wider text-right pr-5">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={idx} className="border-slate-800 group hover:bg-slate-800/20 transition-colors">
                      <TableCell className="py-4 pl-5">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 rounded-xl border border-slate-800 shadow-sm bg-slate-950">
                            <AvatarImage src={item.product?.images?.[0]?.url} alt={item.product?.name} className="object-cover" />
                            <AvatarFallback className="bg-slate-800 text-slate-500"><Package className="h-5 w-5" /></AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{item.product?.name || item.productName}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500 uppercase tracking-widest">{item.product?.category}</span>
                              <Badge className="bg-slate-800 text-slate-400 border-0 text-[8px] h-3 px-1">{item.product?.condition?.toUpperCase()}</Badge>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <code className="text-[10px] text-slate-500 bg-slate-950 px-1 py-0.5 rounded w-fit">{item.product?.sku || 'NO-SKU'}</code>
                          <div className="flex gap-1.5">
                            {item.specifications?.color && <div className="h-3 w-3 rounded-full border border-slate-700 shadow-inner" style={{ background: item.specifications.color.toLowerCase() }} title={item.specifications.color} />}
                            {item.specifications?.size && <span className="text-[10px] text-slate-400 font-bold px-1.5 bg-slate-800 rounded">{item.specifications.size}</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("border-0 text-[9px] uppercase font-bold", getStatusColor(item.status))}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm font-medium text-white">₦{item.price.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-600">Qty: {item.quantity}</div>
                      </TableCell>
                      <TableCell className="text-right pr-5">
                        <div className="text-sm font-bold text-white">₦{(item.price * item.quantity).toLocaleString()}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Detailed Financial Summary */}
          <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-400" />
                <CardTitle className="text-lg font-bold text-white">Financial Breakdown</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="space-y-2.5">
                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-3 tracking-widest">Revenue & Deductions</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Order Subtotal</span>
                      <span className="text-white font-medium">₦{order.paymentBreakdown?.orderTotal?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Shipping Fee (Collected)</span>
                      <span className="text-white font-medium">₦{shipping?.fee?.amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Platform Fees</span>
                        <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                      </div>
                      <span className="text-rose-400 font-medium">- ₦{order.paymentBreakdown?.fees?.totalPlatformFee?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Processing Fee ({order.paymentBreakdown?.fees?.processingFeePercentage}%)</span>
                      <span className="text-rose-400 font-medium">- ₦{order.paymentBreakdown?.fees?.processingFee?.toLocaleString()}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-sm font-bold text-white">Total Customer Paid</span>
                      <span className="text-xl font-bold text-blue-400">₦{order.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <p className="text-[10px] uppercase font-bold text-emerald-500 tracking-widest flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3" /> Net Seller Payout
                    </p>
                    <div>
                      <div className="text-3xl font-bold text-emerald-400 mb-1 tracking-tight">₦{order.paymentBreakdown?.sellerPayout?.toLocaleString()}</div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        This amount will be credited to the seller's wallet once the order is successfully settled and no disputes are pending.
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 mt-4 border-t border-emerald-500/10 flex items-center justify-between text-xs">
                    <span className="text-emerald-500/70">Payment Method</span>
                    <Badge className="bg-emerald-500/20 text-emerald-500 border-0 uppercase text-[9px] font-bold h-5">
                      {order.paymentInfo.method}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline & Analysis */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="p-5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-lg font-bold text-white">Full Event Logs</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {combinedTimeline.length > 0 ? (
                <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-slate-800">
                  {combinedTimeline.map((event: any, idx: number) => (
                    <div key={idx} className="relative flex items-start group">
                      <div className="absolute left-4 mt-1.5 h-2.5 w-2.5 rounded-full bg-slate-900 border-2 border-slate-600 ring-2 ring-slate-900 group-first:bg-blue-500 group-first:border-blue-400 group-first:ring-blue-500/20 shadow-lg transition-all" />
                      <div className="ml-10 space-y-1 bg-slate-800/20 p-3 rounded-lg border border-slate-800/50 w-full hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold uppercase text-white tracking-widest">{event.status}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{format(new Date(event.timestamp || new Date()), "HH:mm")} • {format(new Date(event.timestamp || new Date()), "MMM dd")}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed italic border-l-2 border-slate-800 pl-3">
                          {event.description || `State changed to ${event.status}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Clock className="mx-auto h-10 w-10 mb-3 text-slate-700 opacity-30" />
                  <p className="text-sm text-slate-500">No activity history available for this order.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 4/12 */}
        <div className="lg:col-span-4 space-y-6">
          {/* Admin Tools - Quick Actions */}
          <Card className="bg-blue-600/5 border border-blue-500/10 shadow-lg">
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-md font-bold text-white tracking-tight uppercase">Control Center</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between bg-slate-900 border-slate-800 text-white hover:bg-slate-800 group h-10">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500 group-hover:animate-pulse" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Fez Webhook Simulation</span>
                    </div>
                    <ChevronRight className="h-3 w-3 opacity-30" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                  <DialogHeader><DialogTitle>Simulation Suite: Fez Logistics</DialogTitle></DialogHeader>
                  <div className="space-y-5 py-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Tracking Reference</label>
                      <Input placeholder="FEZ-..." value={webhookFezOrderNo} onChange={(e) => setWebhookFezOrderNo(e.target.value)} className="bg-slate-950 border-slate-800" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Injection Status</label>
                      <Select value={webhookStatus} onValueChange={setWebhookStatus}>
                        <SelectTrigger className="bg-slate-950 border-slate-800"><SelectValue placeholder="Select Status" /></SelectTrigger>
                        <SelectContent className="bg-slate-950 border-slate-800 text-white">
                          {["Pending Pick-Up", "Picked-Up", "Dispatched", "Delivered", "Cancelled"].map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setWebhookDialogOpen(false)}>Discard</Button>
                    <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleSimulateWebhook} disabled={isSimulatingWebhook}>Inject Event</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={terminalDialogOpen} onOpenChange={setTerminalDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between bg-slate-900 border-slate-800 text-white hover:bg-slate-800 group h-10">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-blue-400" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Terminal Logistics Sim</span>
                    </div>
                    <ChevronRight className="h-3 w-3 opacity-30" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                  <DialogHeader><DialogTitle>Terminal Webhook Interface</DialogTitle></DialogHeader>
                  <div className="space-y-5 py-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Shipment Identity</label>
                      <Input placeholder="SH-..." value={terminalShipmentId} onChange={(e) => setTerminalShipmentId(e.target.value)} className="bg-slate-950 border-slate-800" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Webhook Event Model</label>
                      <Select value={terminalEvent} onValueChange={setTerminalEvent}>
                        <SelectTrigger className="bg-slate-950 border-slate-800"><SelectValue placeholder="Select Event" /></SelectTrigger>
                        <SelectContent className="bg-slate-950 border-slate-800 text-white">
                          {["shipment.confirmed", "shipment.in-transit", "shipment.delivered", "shipment.cancelled"].map(e => (
                            <SelectItem key={e} value={e}>{e}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setTerminalDialogOpen(false)}>Cancel</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSimulateTerminalWebhook} disabled={isSimulatingTerminalWebhook}>Trigger Webhook</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {order?.channel === 'fez' && (
                <Dialog open={fezDialogOpen} onOpenChange={setFezDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-between bg-slate-900 border-rose-500/20 text-rose-400 hover:bg-rose-500/10 h-10">
                      <div className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Clear Logistics Entry</span>
                      </div>
                      <AlertTriangle className="h-3.5 w-3.5 opacity-50" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-800 text-white">
                    <DialogHeader><DialogTitle>Remove Logistics Link</DialogTitle></DialogHeader>
                    <div className="py-5 space-y-3">
                      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Reference Number</label>
                      <Input value={fezOrderNo} onChange={(e) => setFezOrderNo(e.target.value)} className="bg-slate-950 border-slate-800" />
                      <p className="text-[10px] text-rose-400 italic">Caution: This will remove the link to the external delivery provider for this record.</p>
                    </div>
                    <DialogFooter>
                      <Button variant="destructive" className="w-full" onClick={handleDeleteFezOrder} disabled={isDeletingFezOrder}>Hard Delete Fez Link</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>

          {/* Customer Card */}
          <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-800/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[11px] font-bold uppercase text-slate-500 tracking-[0.2em]">Customer Profile</CardTitle>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 rounded-2xl border-2 border-slate-800 shadow-xl">
                  <AvatarImage src={buyer?.profileImage?.[0]?.url} className="object-cover" />
                  <AvatarFallback className="bg-slate-800 font-bold text-lg">{buyer?.firstName?.[0]}{buyer?.lastName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <Link to={`/dashboard/buyer-detail/${buyer?._id}`} className="font-bold text-white hover:text-blue-400 transition-colors flex items-center gap-1.5 leading-none mb-1">
                    {buyer?.firstName} {buyer?.lastName}
                    <ExternalLink className="h-3 w-3 opacity-30" />
                  </Link>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Mail className="h-3 w-3" />
                    <span className="text-[11px] truncate max-w-[150px]">{buyer?.email}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800/50">
                <div className="flex items-center gap-4 text-xs">
                  <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shadow-inner">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Primary Contact</div>
                    <span className="text-white font-medium">{buyer?.phoneNumber || 'UNAVAILABLE'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4 text-xs">
                  <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 mt-1 shadow-inner">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Delivery Destination</div>
                    <div className="text-slate-200 leading-relaxed font-medium">
                      {addresses?.delivery?.line1}<br />
                      {addresses?.delivery?.line2 && <>{addresses.delivery.line2}<br /></>}
                      <span className="text-white">{addresses?.delivery?.city}, {addresses?.delivery?.state}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seller Card */}
          <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-800/30">
              <CardTitle className="text-[11px] font-bold uppercase text-slate-500 tracking-[0.2em]">Merchant Account</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shadow-inner">
                  <Store className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <Link to={`/dashboard/seller/${seller?._id}`} className="font-bold text-white hover:text-orange-400 transition-colors flex items-center gap-1.5 leading-none mb-1">
                    {seller?.businessName || seller?.storeName}
                    <ExternalLink className="h-3 w-3 opacity-30" />
                  </Link>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <User className="h-3 w-3" />
                    <span className="text-[11px]">{seller?.firstName} {seller?.lastName}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800/50">
                <div className="flex items-center gap-4 text-xs">
                  <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shadow-inner">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Merchant Email</div>
                    <span className="text-white font-medium truncate block">{seller?.email}</span>
                  </div>
                </div>

                {addresses?.pickup && (
                  <div className="flex items-start gap-4 text-xs">
                    <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 mt-1 shadow-inner">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Dispatch Point</div>
                      <div className="text-slate-200 leading-relaxed italic">
                        {addresses.pickup.line1}, {addresses.pickup.city}, {addresses.pickup.state}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shipping & Fulfillment */}
          <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-800/30 bg-blue-500/5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[11px] font-bold uppercase text-blue-400 tracking-[0.2em]">Logistics Intelligence</CardTitle>
                <Truck className="h-4 w-4 text-blue-500 opacity-50" />
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="space-y-4">
                {shipping?.shipment_id && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Shipment Descriptor</span>
                    <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 group">
                      <span className="font-mono text-xs text-blue-400 font-bold select-all">{shipping.shipment_id}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-800" onClick={() => {
                        navigator.clipboard.writeText(shipping.shipment_id);
                        toast.success("Shipment ID copied");
                      }}>
                        <Copy className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Carrier Network</span>
                    <span className="text-white font-bold text-xs">{shipping?.carrier?.name || 'Manual'}</span>
                  </div>
                  <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Tracking Code</span>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className="text-white font-mono font-bold text-[10px] truncate">{shipping?.tracking?.number || 'PENDING'}</span>
                      {shipping?.tracking?.number && (
                        <button className="text-blue-400 hover:text-blue-300" onClick={() => {
                          navigator.clipboard.writeText(shipping.tracking.number);
                          toast.success("Tracking copied");
                        }}>
                          <Copy className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {shipping?.estimatedDeliveryDate && (
                    <div className="flex items-center gap-3 text-xs bg-slate-800/20 p-2.5 rounded-lg">
                      <Calendar className="h-4 w-4 text-blue-400" />
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase font-bold block">Estimated Arrival</span>
                        <span className="text-slate-200 font-medium">{shipping.estimatedDeliveryDate}</span>
                      </div>
                    </div>
                  )}
                  {shipping?.estimatedPickupDate && (
                    <div className="flex items-center gap-3 text-xs bg-slate-800/20 p-2.5 rounded-lg">
                      <Clock className="h-4 w-4 text-amber-400" />
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase font-bold block">Estimated Pickup</span>
                        <span className="text-slate-200 font-medium">{shipping.estimatedPickupDate}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-[0.2em] block mb-2">Authenticated Documents</span>
                  <div className="grid gap-2">
                    {shipping?.documents?.shippingLabel ? (
                      <Button variant="outline" size="sm" className="h-9 w-full justify-between bg-white/[0.03] border-slate-800 hover:bg-blue-500/10 hover:border-blue-500/20 text-[11px]" asChild>
                        <a href={shipping.documents.shippingLabel} target="_blank" rel="noreferrer">
                          <div className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-blue-400" />
                            <span className="font-bold">Shipping Label (PDF)</span>
                          </div>
                          <ExternalLink className="h-3 w-3 opacity-30" />
                        </a>
                      </Button>
                    ) : (
                      <div className="text-[10px] italic text-slate-600 text-center py-2 bg-slate-950/50 rounded-lg border border-dashed border-slate-800">
                        No shipment labels generated yet.
                      </div>
                    )}
                    {shipping?.documents?.commercialInvoice && (
                      <Button variant="outline" size="sm" className="h-9 w-full justify-between bg-white/[0.03] border-slate-800 hover:bg-purple-500/10 hover:border-purple-500/20 text-[11px]" asChild>
                        <a href={shipping.documents.commercialInvoice} target="_blank" rel="noreferrer">
                          <div className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-purple-400" />
                            <span className="font-bold">Commercial Invoice (PDF)</span>
                          </div>
                          <ExternalLink className="h-3 w-3 opacity-30" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default OrderDetail
