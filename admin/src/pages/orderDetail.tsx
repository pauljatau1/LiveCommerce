import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from "@/api/axios"
import { Card } from "@/components/ui/card"
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
  AlertCircle, 
  CreditCard, 
  Store, 
  FileText, 
  Banknote, 
  User, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Bell, 
  Calendar,
  ShoppingCart,
  ReceiptText,
  RefreshCw,
  Tag,
  ArrowDownCircle,
  Archive,
  Shield,
  ChevronRight,
  CornerDownRight,
  Mail,
  Phone,
  Fingerprint,
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
  }
  seller: {
    sellerAddress?: {
      country: string
      state: string
      city: string
      addressLine1: string
      addressLine2?: string
      zipCode: string
    }
    businessAddress?: {
      country: string
      state: string
      city: string
      addressLine1: string
      addressLine2?: string
      zipCode: string
    }
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
    seller: {
      _id: string
      email: string
      phoneNumber: string
      businessName: string
      storeName: string
    }
    quantity: number
    price: number
    status: string
    statusHistory: Array<{
      status: string
      timestamp: string
      _id: string
    }>
    specifications: {
      color: string
      size: string
      material: string
    }
  }>
  addresses: {
    delivery: {
      first_name: string
      last_name: string
      email: string
      phone: string
      line1: string
      city: string
      state: string
      country: string
      zip: string
      _id: string
    }
    pickup?: {
      first_name: string
      last_name: string
      email: string
      phone: string
      line1: string
      city: string
      state: string
      country: string
      zip: string
      _id: string
    }
  }
  shipping: {
    carrier: {
      name: string
      reference: string
    }
    fee: {
      amount: number
      currency: string
    }
    tracking: {
      number: string
      carrier: string
      status: string
      history: Array<any>
    }
    shipment_id: string
    documents: Record<string, any>
  }
  discount: Record<string, any>
  notes: Array<any>
  timeline: Array<any>
}

function OrderDetail() {
  const { id } = useParams()
  const [orderData, setOrderData] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [fezDialogOpen, setFezDialogOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [fezOrderNo, setFezOrderNo] = useState("")
  const [isDeletingFezOrder, setIsDeletingFezOrder] = useState(false)
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false)
  const [webhookFezOrderNo, setWebhookFezOrderNo] = useState("")
  const [webhookStatus, setWebhookStatus] = useState("")
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [isCancellingOrder, setIsCancellingOrder] = useState(false)
  const [terminalDialogOpen, setTerminalDialogOpen] = useState(false)
  const [terminalShipmentId, setTerminalShipmentId] = useState("")
  const [terminalEvent, setTerminalEvent] = useState("")
  const [isSimulatingTerminalWebhook, setIsSimulatingTerminalWebhook] = useState(false)

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await api.get(`/api/order/${id}`)
        setOrderData(response.data)
      } catch (error) {
        console.error('Error fetching order details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [id])

  const handleStatusUpdate = async (newStatus: boolean) => {
    try {
      setIsUpdating(true)
      await api.put(`/api/order/${id}/open-status`, {
        isOpen: newStatus,
        reason: reason
      })
      
      // Refresh order data
      const response = await api.get(`/api/order/${id}`)
      setOrderData(response.data)
      setDialogOpen(false)
      setReason("")
    } catch (error) {
      console.error('Error updating order status:', error)
    } finally {
      setIsUpdating(false)
    }
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
      
      // Refresh order data if needed
      const updatedOrder = await api.get(`/api/order/${id}`);
      setOrderData(updatedOrder.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to cancel Fez order");
    } finally {
      setIsDeletingFezOrder(false);
    }
  };

  const handleSimulateWebhook = async () => {
    if (!webhookFezOrderNo.trim()) {
      toast.error("Please enter a valid Fez order number");
      return;
    }
    
    if (!webhookStatus) {
      toast.error("Please select a status");
      return;
    }
    
    try {
      setIsSimulatingWebhook(true);
      const response = await api.post('/api/notifications/simulate-fez-webhook', {
        orderNumber: webhookFezOrderNo.trim(),
        status: webhookStatus
      });
      
      toast.success(response.data.message || "Webhook simulated successfully");
      setWebhookDialogOpen(false);
      setWebhookFezOrderNo("");
      setWebhookStatus("");
      
      // Refresh order data
      const updatedOrder = await api.get(`/api/order/${id}`);
      setOrderData(updatedOrder.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to simulate webhook");
    } finally {
      setIsSimulatingWebhook(false);
    }
  };

  const handleCancelOrder = async () => {
    try {
      setIsCancellingOrder(true);
      const response = await api.post(`/api/admin/orders/${id}/cancel`, {
        reason: cancelReason.trim() || undefined
      });
      
      toast.success(response.data.message || "Order cancelled successfully");
      
      // Show additional info if wallet refund was processed
      if (response.data.walletRefunded && response.data.walletRefundAmount) {
        toast.success(`Wallet refund of ₦${response.data.walletRefundAmount.toLocaleString()} processed`);
      }
      
      setCancelDialogOpen(false);
      setCancelReason("");
      
      // Refresh order data
      const updatedOrder = await api.get(`/api/order/${id}`);
      setOrderData(updatedOrder.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to cancel order");
    } finally {
      setIsCancellingOrder(false);
    }
  };

  const handleSimulateTerminalWebhook = async () => {
    if (!terminalShipmentId.trim()) {
      toast.error("Please enter a valid shipment ID");
      return;
    }
    
    if (!terminalEvent) {
      toast.error("Please select an event type");
      return;
    }
    
    try {
      setIsSimulatingTerminalWebhook(true);
      const response = await api.post('/api/notifications/simulate-terminal-webhook', {
        event: terminalEvent,
        shipment_id: terminalShipmentId.trim(),
        tracking_number: orderData?.shipping?.tracking?.number || undefined,
        carrier: orderData?.shipping?.carrier?.name || undefined
      });
      
      toast.success(response.data.message || "Terminal webhook simulated successfully");
      setTerminalDialogOpen(false);
      setTerminalShipmentId("");
      setTerminalEvent("");
      
      // Refresh order data
      const updatedOrder = await api.get(`/api/order/${id}`);
      setOrderData(updatedOrder.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to simulate Terminal webhook");
    } finally {
      setIsSimulatingTerminalWebhook(false);
    }
  };

  if (loading) return <div>Loading...</div>
  if (!orderData) return <div>Order not found</div>

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <Card className="p-6 bg-gray-900 border-gray-800">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600/20 p-2 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-500" />
              </div>
        <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Order #{orderData.order?.order_id}
                  <Badge className="ml-2 bg-blue-600 text-white">
                    {orderData.order?.channel?.toUpperCase()}
                  </Badge>
          </h1>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Placed on {new Date(orderData.order?.createdAt || '').toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
          </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <ReceiptText className="h-3.5 w-3.5" />
                    <span>₦{orderData.order?.totalAmount?.toLocaleString()}</span>
        </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${
                orderData.order?.orderStatus?.isOpen 
                  ? "bg-green-600/20 text-green-500" 
                  : "bg-yellow-600/20 text-yellow-500"
              }`}>
                {orderData.order?.orderStatus?.isOpen 
                  ? <CheckCircle className="h-4 w-4" /> 
                  : <Clock className="h-4 w-4" />}
                {orderData.order?.orderStatus?.isOpen ? "Open" : "Closed"}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${
                orderData.order?.paid 
                  ? "bg-green-600/20 text-green-500" 
                  : "bg-red-600/20 text-red-500"
              }`}>
                {orderData.order?.paid 
                  ? <CreditCard className="h-4 w-4" /> 
                  : <AlertCircle className="h-4 w-4" />}
                {orderData.order?.paid ? "Paid" : "Unpaid"}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 border-t border-gray-800 pt-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Payment Method</span>
              <span className="text-white capitalize flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5 text-blue-400" />
                {orderData.order?.paymentInfo?.method || 'N/A'}
            </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Order ID</span>
              <span className="text-white">{orderData?.order?._id || 'N/A'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Store Pickup</span>
              <span className="text-white flex items-center gap-1">
                {orderData.order?.isStorePickup === true 
                  ? <Store className="h-3.5 w-3.5 text-purple-400" /> 
                  : <Truck className="h-3.5 w-3.5 text-yellow-400" />}
                {orderData.order?.isStorePickup === true ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Tracking Number</span>
              <span className="text-white">{orderData.shipping?.tracking?.number || 'N/A'}</span>
            </div>
          </div>

          <div className="flex justify-between items-center mt-2 border-t border-gray-800 pt-4">
            <div className="flex items-center gap-2">
          <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                    className="text-white"
                title="Simulate Fez Webhook"
              >
                <Bell className="h-4 w-4 mr-2" />
                Simulate Fez Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white">
              <DialogHeader>
                <DialogTitle>Simulate Fez Webhook</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Simulate a webhook event from Fez Delivery to update order status.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm text-white">Fez Order Number</label>
                  <Input
                    placeholder="Enter Fez Order Number"
                    value={webhookFezOrderNo}
                    onChange={(e) => setWebhookFezOrderNo(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white">Status</label>
                  <Select onValueChange={setWebhookStatus} value={webhookStatus}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem value="Pending Pick-Up">Pending Pick-Up</SelectItem>
                      <SelectItem value="Picked-Up">Picked-Up</SelectItem>
                      <SelectItem value="Dispatched">Dispatched</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setWebhookDialogOpen(false)}
                  className="bg-gray-800 text-white hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSimulateWebhook}
                  disabled={!webhookFezOrderNo.trim() || !webhookStatus || isSimulatingWebhook}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSimulatingWebhook ? "Simulating..." : "Simulate Webhook"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={terminalDialogOpen} onOpenChange={setTerminalDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                className="text-white"
                title="Simulate Terminal Webhook"
              >
                <Bell className="h-4 w-4 mr-2" />
                Simulate Terminal Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white">
              <DialogHeader>
                <DialogTitle>Simulate Terminal Webhook</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Simulate a webhook event from Terminal Africa to update shipment status.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm text-white">Terminal Shipment ID</label>
                  <Input
                    placeholder="Enter Shipment ID"
                    value={terminalShipmentId}
                    onChange={(e) => setTerminalShipmentId(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white">Event</label>
                  <Select onValueChange={setTerminalEvent} value={terminalEvent}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem value="packaging.created">Packaging Created</SelectItem>
                      <SelectItem value="packaging.updated">Packaging Updated</SelectItem>
                      <SelectItem value="shipment.cancelled">Shipment Cancelled</SelectItem>
                      <SelectItem value="shipment.created">Shipment Created</SelectItem>
                      <SelectItem value="shipment.in-transit">Shipment In-Transit</SelectItem>
                      <SelectItem value="shipment.updated">Shipment Updated</SelectItem>
                      <SelectItem value="shipment.delivered">Shipment Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setTerminalDialogOpen(false)}
                  className="bg-gray-800 text-white hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSimulateTerminalWebhook}
                  disabled={!terminalShipmentId.trim() || !terminalEvent || isSimulatingTerminalWebhook}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSimulatingTerminalWebhook ? "Simulating..." : "Simulate Webhook"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

              <Dialog open={fezDialogOpen} onOpenChange={setFezDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                    variant="destructive"
                    className="ml-2"
                    title="Delete Fez Order"
              >
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

              <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="destructive"
                    className="ml-2"
                    title="Cancel Order"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Order
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white">
                  <DialogHeader>
                    <DialogTitle>Cancel Order</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Cancel this order and process any necessary refunds. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm text-white">Cancellation Reason (Optional)</label>
                      <Textarea
                        placeholder="Enter reason for cancellation..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCancelDialogOpen(false)}
                      className="bg-gray-800 text-white hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCancelOrder}
                      disabled={isCancellingOrder}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isCancellingOrder ? "Cancelling..." : "Cancel Order"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                  variant={orderData.order?.orderStatus?.isOpen ? "destructive" : "default"}
              >
                  {orderData.order?.orderStatus?.isOpen 
                    ? <><XCircle className="h-4 w-4 mr-2" /> Close Order</> 
                    : <><RefreshCw className="h-4 w-4 mr-2" /> Reopen Order</>}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white">
              <DialogHeader>
                  <DialogTitle>
                    {orderData.order?.orderStatus?.isOpen ? "Close Order" : "Reopen Order"}
                  </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                    Please provide a reason for {orderData.order?.orderStatus?.isOpen ? "closing" : "reopening"} this order.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <Textarea
                    placeholder="Enter reason here..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                    onClick={() => setDialogOpen(false)}
                  className="bg-gray-800 text-white hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                    onClick={() => handleStatusUpdate(!orderData.order?.orderStatus?.isOpen)}
                    disabled={!reason || isUpdating}
                    className={orderData.order?.orderStatus?.isOpen ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                  >
                    {isUpdating ? "Updating..." : orderData.order?.orderStatus?.isOpen ? "Close Order" : "Reopen Order"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      </Card>

      {/* Order Status Indicators */}
      <Card className="p-6 bg-gray-900 border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-indigo-600/20 p-2 rounded-lg">
            <Clock className="h-5 w-5 text-indigo-500" />
          </div>
          <h2 className="text-lg font-semibold text-white">Order Status & Timeline</h2>
          </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center gap-2">
            <div className={`p-2 rounded-full ${orderData.order?.paid ? "bg-green-600/20" : "bg-gray-700/50"}`}>
              <CreditCard className={`h-5 w-5 ${orderData.order?.paid ? "text-green-500" : "text-gray-500"}`} />
          </div>
            <span className="text-sm font-medium text-white">Payment</span>
            <Badge className={orderData.order?.paid ? "bg-green-600/20 text-green-500 border-green-800" : "bg-gray-700 text-gray-400"}>
              {orderData.order?.paid ? "Paid" : "Pending"}
            </Badge>
            {orderData.order?.paid && orderData.order?.paymentInfo?.paidAt && (
              <span className="text-xs text-muted-foreground mt-1">
                {new Date(orderData.order.paymentInfo.paidAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            )}
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center gap-2">
            <div className={`p-2 rounded-full ${orderData.shipping?.tracking?.status === "delivered" ? "bg-green-600/20" : "bg-blue-600/20"}`}>
              <Truck className={`h-5 w-5 ${orderData.shipping?.tracking?.status === "delivered" ? "text-green-500" : "text-blue-500"}`} />
            </div>
            <span className="text-sm font-medium text-white">Shipping</span>
            <Badge className={
              orderData.shipping?.tracking?.status === "delivered" 
                ? "bg-green-600/20 text-green-500 border-green-800" 
                : "bg-blue-600/20 text-blue-500 border-blue-800"
            }>
              {(orderData.shipping?.tracking?.status || "pending").toUpperCase()}
            </Badge>
            <span className="text-xs text-muted-foreground mt-1">
              {orderData.shipping?.tracking?.number || 'Not shipped'}
            </span>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center gap-2">
            <div className={`p-2 rounded-full ${orderData.order?.orderStatus?.hasReturn ? "bg-yellow-600/20" : "bg-gray-700/50"}`}>
              <RefreshCw className={`h-5 w-5 ${orderData.order?.orderStatus?.hasReturn ? "text-yellow-500" : "text-gray-500"}`} />
            </div>
            <span className="text-sm font-medium text-white">Return</span>
            <Badge className={orderData.order?.orderStatus?.hasReturn ? "bg-yellow-600/20 text-yellow-500 border-yellow-800" : "bg-gray-700 text-gray-400"}>
              {orderData.order?.orderStatus?.hasReturn ? "Requested" : "None"}
            </Badge>
            {orderData.order?.orderStatus?.returnRequestId && (
              <span className="text-xs text-muted-foreground mt-1 truncate w-full text-center" title={orderData.order.orderStatus.returnRequestId}>
                ID: {orderData.order.orderStatus.returnRequestId.substring(0, 8)}...
              </span>
            )}
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center gap-2">
            <div className={`p-2 rounded-full ${orderData.order?.orderStatus?.hasDispute ? "bg-red-600/20" : "bg-gray-700/50"}`}>
              <AlertCircle className={`h-5 w-5 ${orderData.order?.orderStatus?.hasDispute ? "text-red-500" : "text-gray-500"}`} />
            </div>
            <span className="text-sm font-medium text-white">Dispute</span>
            <Badge className={orderData.order?.orderStatus?.hasDispute ? "bg-red-600/20 text-red-500 border-red-800" : "bg-gray-700 text-gray-400"}>
              {orderData.order?.orderStatus?.hasDispute ? "Active" : "None"}
            </Badge>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center gap-2">
            <div className={`p-2 rounded-full ${orderData.order?.orderStatus?.hasRefund ? "bg-purple-600/20" : "bg-gray-700/50"}`}>
              <ArrowDownCircle className={`h-5 w-5 ${orderData.order?.orderStatus?.hasRefund ? "text-purple-500" : "text-gray-500"}`} />
            </div>
            <span className="text-sm font-medium text-white">Refund</span>
            <Badge className={orderData.order?.orderStatus?.hasRefund ? "bg-purple-600/20 text-purple-500 border-purple-800" : "bg-gray-700 text-gray-400"}>
              {orderData.order?.orderStatus?.hasRefund ? "Processed" : "None"}
            </Badge>
          </div>
        </div>
        
        {/* Order Timeline */}
        <div className="mt-6 border-t border-gray-800 pt-4">
                      <h3 className="text-md font-medium text-white mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" /> Order Timeline
            </h3>
          
          {orderData && (
            <div className="space-y-4">
              {/* Default timeline entries if no custom ones */}
              {(!orderData.timeline || orderData.timeline.length === 0) && (
                <>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <div className="h-12 w-0.5 bg-gray-700"></div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-md flex-grow">
                      <p className="text-white font-medium">Order Placed</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(orderData.order?.createdAt || '')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Order #{orderData.order?.order_id} was created
                      </p>
                    </div>
                  </div>
                  
                  {/* <div className="flex items-start gap-3">
                    <div className="mt-1 flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <div className="h-12 w-0.5 bg-gray-700"></div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-md flex-grow">
                      <p className="text-white font-medium">Payment Confirmed</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(orderData.order?.paymentInfo?.paidAt || '')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Payment of ₦{orderData.order?.totalAmount?.toLocaleString()} received via {orderData.order?.paymentInfo?.method}
                      </p>
                    </div>
                  </div> */}
                  
                  {orderData.items?.[0]?.statusHistory?.slice(0).reverse().map((status, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="mt-1 flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                        {index !== (orderData.items?.[0]?.statusHistory?.length || 0) - 1 && (
                          <div className="h-12 w-0.5 bg-gray-700"></div>
                        )}
                      </div>
                      <div className="bg-gray-800 p-3 rounded-md flex-grow">
                        <p className="text-white font-medium capitalize">{status.status}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(status.timestamp)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Item status updated to {status.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}
              
              {/* Display custom timeline if available */}
              {orderData.timeline && orderData.timeline.length > 0 && (
                orderData.timeline.map((event, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1 flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      {index !== orderData.timeline.length - 1 && (
                        <div className="h-12 w-0.5 bg-gray-700"></div>
                      )}
                    </div>
                    <div className="bg-gray-800 p-3 rounded-md flex-grow">
                      <p className="text-white font-medium capitalize">{event.status}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card className="bg-gray-900 border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600/20 p-2 rounded-lg">
            <User className="h-5 w-5 text-blue-500" />
              </div>
            <h2 className="text-lg font-semibold text-white">Customer Information</h2>
          </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-gray-800 h-12 w-12 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {orderData?.buyer?.firstName?.[0]}{orderData?.buyer?.lastName?.[0]}
                </span>
              </div>
              <div>
                <h3 className="text-white font-medium">
                  {orderData?.buyer?.firstName} {orderData?.buyer?.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">Customer since {new Date(orderData?.buyer?.createdAt || new Date()).getFullYear()}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mt-4">
              <div className="bg-gray-800 p-3 rounded-lg flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Email Address</p>
                  <p className="text-sm text-white">{orderData?.buyer?.email}</p>
                </div>
              </div>
              
              <div className="bg-gray-800 p-3 rounded-lg flex items-center gap-3">
                <Phone className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone Number</p>
                  <p className="text-sm text-white">{orderData?.buyer?.phoneNumber}</p>
                </div>
              </div>
              
              <div className="bg-gray-800 p-3 rounded-lg flex items-center gap-3">
                <Fingerprint className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Customer ID</p>
                  <p className="text-sm text-white truncate">{orderData?.buyer?._id}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Seller Information */}
        <Card className="bg-gray-900 border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="bg-purple-600/20 p-2 rounded-lg">
            <Store className="h-5 w-5 text-purple-500" />
              </div>
            <h2 className="text-lg font-semibold text-white">Seller Information</h2>
          </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-gray-800 h-12 w-12 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {orderData?.seller?.firstName?.[0]}{orderData?.seller?.lastName?.[0]}
                </span>
              </div>
              <div>
                <h3 className="text-white font-medium">
                  {orderData?.seller?.firstName} {orderData?.seller?.lastName}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Store className="h-3.5 w-3.5" /> {orderData?.seller?.storeName}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mt-4">
              <div className="bg-gray-800 p-3 rounded-lg flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Email Address</p>
                  <p className="text-sm text-white">{orderData?.seller?.email}</p>
                </div>
              </div>
              
              <div className="bg-gray-800 p-3 rounded-lg flex items-center gap-3">
                <Phone className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone Number</p>
                  <p className="text-sm text-white">{orderData?.seller?.phoneNumber}</p>
                </div>
              </div>
              
              {orderData?.seller?.sellerAddress && (
                <div className="bg-gray-800 p-3 rounded-lg flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-red-400 mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Business Address</p>
                    <p className="text-sm text-white">
                      {orderData.seller.sellerAddress.addressLine1}
                      {orderData.seller.sellerAddress.addressLine2 && `, ${orderData.seller.sellerAddress.addressLine2}`}
                    </p>
                    <p className="text-sm text-white">
                      {orderData.seller.sellerAddress.city && typeof orderData.seller.sellerAddress.city === 'string' ? `${orderData.seller.sellerAddress.city}, ` : ''}
                      {typeof orderData.seller.sellerAddress.state === 'string' ? orderData.seller.sellerAddress.state : ''}
                      {typeof orderData.seller.sellerAddress.country === 'string' ? `, ${orderData.seller.sellerAddress.country}` : ''}
                      {orderData.seller.sellerAddress.zipCode && typeof orderData.seller.sellerAddress.zipCode === 'string' ? ` ${orderData.seller.sellerAddress.zipCode}` : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Delivery Address & Shipping Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Address */}
        <Card className="bg-gray-900 border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="bg-red-600/20 p-2 rounded-lg">
                <MapPin className="h-5 w-5 text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-white">
                {orderData?.order?.isStorePickup ? "Store Pickup Information" : "Delivery & Pickup Information"}
              </h2>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            {!orderData?.order?.isStorePickup && (
              <>
                {/* Delivery Address */}
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-400" /> Recipient Details
                    </h3>
                    <Badge className="bg-blue-600/20 text-blue-400 border-blue-800">
                      Delivery Address
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Name</span>
                      <span className="text-sm text-white">
                        {orderData?.addresses?.delivery?.first_name} {orderData?.addresses?.delivery?.last_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Email</span>
                      <span className="text-sm text-white">{orderData?.addresses?.delivery?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Phone</span>
                      <span className="text-sm text-white">{orderData?.addresses?.delivery?.phone}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-red-400" />
                    <h3 className="text-white font-medium">Delivery Address</h3>
                  </div>
                  
                  <div className="mt-2 text-white border border-gray-700 rounded-md p-3 bg-gray-800/50">
                    <p>{orderData?.addresses?.delivery?.line1}</p>
                    {orderData?.addresses?.delivery?.city && <p>{orderData?.addresses?.delivery?.city}</p>}
                    <p>
                      {typeof orderData?.addresses?.delivery?.state === 'string' ? orderData?.addresses?.delivery?.state : ''}
                      {orderData?.addresses?.delivery?.country && typeof orderData?.addresses?.delivery?.country === 'string' ? `, ${orderData?.addresses?.delivery?.country}` : ''}
                      {orderData?.addresses?.delivery?.zip && typeof orderData?.addresses?.delivery?.zip === 'string' ? ` ${orderData?.addresses?.delivery?.zip}` : ''}
                    </p>
                  </div>
                </div>
                
                {/* Pickup Address */}
                {orderData?.addresses?.pickup && (
                  <>
                    <div className="border-t border-gray-700 my-4"></div>
                    
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-medium flex items-center gap-2">
                          <Store className="h-4 w-4 text-purple-400" /> Seller Details
                        </h3>
                        <Badge className="bg-purple-600/20 text-purple-400 border-purple-800">
                          Pickup Address
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Name</span>
                          <span className="text-sm text-white">
                            {orderData?.addresses?.pickup?.first_name} {orderData?.addresses?.pickup?.last_name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Email</span>
                          <span className="text-sm text-white">{orderData?.addresses?.pickup?.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Phone</span>
                          <span className="text-sm text-white">{orderData?.addresses?.pickup?.phone}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Store className="h-4 w-4 text-purple-400" />
                        <h3 className="text-white font-medium">Pickup Address</h3>
                      </div>
                      
                      <div className="mt-2 text-white border border-gray-700 rounded-md p-3 bg-gray-800/50">
                        <p>{orderData?.addresses?.pickup?.line1}</p>
                        {orderData?.addresses?.pickup?.city && <p>{orderData?.addresses?.pickup?.city}</p>}
                        <p>
                          {typeof orderData?.addresses?.pickup?.state === 'string' ? orderData?.addresses?.pickup?.state : ''}
                          {orderData?.addresses?.pickup?.country && typeof orderData?.addresses?.pickup?.country === 'string' ? `, ${orderData?.addresses?.pickup?.country}` : ''}
                          {orderData?.addresses?.pickup?.zip && typeof orderData?.addresses?.pickup?.zip === 'string' ? ` ${orderData?.addresses?.pickup?.zip}` : ''}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
            
            {orderData?.order?.isStorePickup && (
              <>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-medium flex items-center gap-2">
                      <Store className="h-4 w-4 text-purple-400" /> Store Pickup
                    </h3>
                    <Badge className={`${
                      (typeof orderData?.order?.storePickupStatus === 'object' && orderData?.order?.storePickupStatus?.state === 'ready') || 
                      orderData?.order?.storePickupStatus === 'ready'
                        ? 'bg-green-600/20 text-green-500 border-green-800'
                        : (typeof orderData?.order?.storePickupStatus === 'object' && orderData?.order?.storePickupStatus?.state === 'picked') || 
                          orderData?.order?.storePickupStatus === 'picked'
                        ? 'bg-blue-600/20 text-blue-500 border-blue-800'
                        : 'bg-yellow-600/20 text-yellow-500 border-yellow-800'
                    }`}>
                      {orderData?.order?.storePickupStatus
                        ? (typeof orderData.order.storePickupStatus === 'string' 
                            ? orderData.order.storePickupStatus.toUpperCase() 
                            : typeof orderData.order.storePickupStatus === 'object' && orderData.order.storePickupStatus?.state
                              ? orderData.order.storePickupStatus.state.toUpperCase()
                              : 'PENDING')
                        : 'PENDING'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Store Name</span>
                      <span className="text-sm text-white">{orderData?.seller?.storeName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Business Name</span>
                      <span className="text-sm text-white">{orderData?.seller?.businessName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Contact</span>
                      <span className="text-sm text-white">{orderData?.seller?.phoneNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Store Address */}
                {(orderData?.seller?.businessAddress || orderData?.seller?.sellerAddress) && (
                  <div className="bg-gray-800 p-4 rounded-lg mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-purple-400" />
                      <h3 className="text-white font-medium">Store Address</h3>
                    </div>
                    
                    <div className="mt-2 text-white border border-gray-700 rounded-md p-3 bg-gray-800/50">
                      {/* Use businessAddress if available, otherwise fall back to sellerAddress */}
                      {orderData?.seller?.businessAddress ? (
                        <>
                          <p>{orderData.seller.businessAddress.addressLine1}</p>
                          {orderData.seller.businessAddress.addressLine2 && <p>{orderData.seller.businessAddress.addressLine2}</p>}
                          {orderData.seller.businessAddress.city && <p>{orderData.seller.businessAddress.city}</p>}
                          <p>
                            {typeof orderData.seller.businessAddress.state === 'string' ? orderData.seller.businessAddress.state : ''}
                            {orderData.seller.businessAddress.country && typeof orderData.seller.businessAddress.country === 'string' ? `, ${orderData.seller.businessAddress.country}` : ''}
                            {orderData.seller.businessAddress.zipCode && typeof orderData.seller.businessAddress.zipCode === 'string' ? ` ${orderData.seller.businessAddress.zipCode}` : ''}
                          </p>
                        </>
                      ) : orderData?.seller?.sellerAddress && (
                        <>
                          <p>{orderData.seller.sellerAddress.addressLine1}</p>
                          {orderData.seller.sellerAddress.addressLine2 && <p>{orderData.seller.sellerAddress.addressLine2}</p>}
                          {orderData.seller.sellerAddress.city && <p>{orderData.seller.sellerAddress.city}</p>}
                          <p>
                            {typeof orderData.seller.sellerAddress.state === 'string' ? orderData.seller.sellerAddress.state : ''}
                            {orderData.seller.sellerAddress.country && typeof orderData.seller.sellerAddress.country === 'string' ? `, ${orderData.seller.sellerAddress.country}` : ''}
                            {orderData.seller.sellerAddress.zipCode && typeof orderData.seller.sellerAddress.zipCode === 'string' ? ` ${orderData.seller.sellerAddress.zipCode}` : ''}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Shipping Information */}
        <Card className="bg-gray-900 border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="bg-yellow-600/20 p-2 rounded-lg">
                <Truck className="h-5 w-5 text-yellow-500" />
              </div>
              <h2 className="text-lg font-semibold text-white">Shipping Details</h2>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Truck className="h-4 w-4 text-yellow-400" /> Carrier Information
                </h3>
                <Badge 
                  className={`${
                    orderData?.shipping?.tracking?.status === "delivered"
                      ? "bg-green-600/20 text-green-500 border-green-800"
                      : orderData?.shipping?.tracking?.status === "pending"
                        ? "bg-yellow-600/20 text-yellow-500 border-yellow-800"
                        : "bg-blue-600/20 text-blue-500 border-blue-800"
                  }`}
                >
                  {orderData?.shipping?.tracking?.status?.toUpperCase() || "PENDING"}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-900/50 p-3 rounded-md">
                    <p className="text-xs text-muted-foreground">Carrier</p>
                    <p className="text-sm text-white font-medium">{orderData?.shipping?.carrier?.name || "N/A"}</p>
                  </div>
                  <div className="bg-gray-900/50 p-3 rounded-md">
                    <p className="text-xs text-muted-foreground">Reference</p>
                    <p className="text-sm text-white font-medium">{orderData?.shipping?.carrier?.reference || "N/A"}</p>
                  </div>
                </div>
                
                <div className="bg-gray-900/50 p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Tracking Number</p>
                    <Badge className="bg-blue-600/20 text-blue-400">
                      {orderData?.shipping?.tracking?.carrier || "N/A"}
                    </Badge>
                  </div>
                  <p className="text-sm text-white font-medium mt-1">{orderData?.shipping?.tracking?.number || "N/A"}</p>
                </div>
                
                <div className="bg-gray-900/50 p-3 rounded-md">
                  <p className="text-xs text-muted-foreground">Shipment ID</p>
                  <p className="text-sm text-white font-medium">{orderData?.shipping?.shipment_id || "N/A"}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-blue-400" />
                <h3 className="text-white font-medium">Shipping Fee</h3>
              </div>
              
              <div className="bg-gray-900/50 p-3 rounded-md flex justify-between items-center">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span className="text-white font-medium">
                  ₦{orderData?.shipping?.fee?.amount?.toLocaleString() || "0"}
                </span>
              </div>
            </div>
            
            {orderData?.shipping?.tracking?.history && orderData?.shipping?.tracking?.history.length > 0 && (
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-indigo-400" />
                  <h3 className="text-white font-medium">Tracking History</h3>
                </div>
                
                <div className="space-y-3">
                  {orderData.shipping.tracking.history.map((event, index) => (
                    <div key={index} className="bg-gray-900/50 p-3 rounded-md">
                      <p className="text-sm text-white">{event.status}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(event.timestamp)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Information */}
        <Card className="bg-gray-900 border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="bg-green-600/20 p-2 rounded-lg">
                <CreditCard className="h-5 w-5 text-green-500" />
        </div>
              <h2 className="text-lg font-semibold text-white">Payment Information</h2>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Badge className={`${
                orderData?.order?.paid
                  ? "bg-green-600/20 text-green-500 border-green-800"
                  : "bg-red-600/20 text-red-500 border-red-800"
              }`}>
                {orderData?.order?.paid ? "PAID" : "UNPAID"}
              </Badge>
              <span className="text-2xl font-bold text-white">₦{orderData?.order?.totalAmount?.toLocaleString()}</span>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mt-2">
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-blue-400" />
                  <h3 className="text-sm font-medium text-white">Payment Method</h3>
                </div>
                <p className="text-sm text-muted-foreground capitalize pl-6">
                  {orderData?.order?.paymentInfo?.method || "N/A"}
                </p>
              </div>
              
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-green-400" />
                  <h3 className="text-sm font-medium text-white">Status</h3>
                </div>
                <p className="text-sm text-muted-foreground capitalize pl-6">
                  {orderData?.order?.paymentInfo?.status || "N/A"}
                </p>
              </div>
              
              {orderData?.order?.paymentInfo?.transactionId && (
                <div className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-yellow-400" />
                    <h3 className="text-sm font-medium text-white">Transaction ID</h3>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6 break-all">
                    {orderData.order.paymentInfo.transactionId}
                  </p>
                </div>
              )}
              
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-purple-400" />
                  <h3 className="text-sm font-medium text-white">Payment Time</h3>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  {orderData?.order?.paymentInfo?.paidAt 
                    ? formatDate(orderData.order.paymentInfo.paidAt) 
                    : 'Not paid yet'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Order Summary */}
        <Card className="bg-gray-900 border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="bg-gray-600/20 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Order Summary</h2>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-white font-medium">Price Details</h3>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Total</span>
                  <span className="text-white">₦{orderData?.order?.paymentBreakdown?.orderTotal?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping Fee</span>
                  <span className="text-white">₦{orderData?.shipping?.fee?.amount?.toLocaleString() || 0}</span>
                </div>
                
                {orderData?.order?.paymentBreakdown?.fees?.processingFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Processing Fee ({orderData.order.paymentBreakdown.fees.processingFeePercentage}%)</span>
                    <span className="text-white">₦{orderData.order.paymentBreakdown.fees.processingFee?.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-700 mt-2 pt-2">
                  <div className="flex justify-between font-medium">
                    <span className="text-white">Total</span>
                    <span className="text-white text-lg">
                      ₦{((orderData?.order?.totalAmount || 0) + (orderData?.shipping?.fee?.amount || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment Breakdown Summary */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-white font-medium">Seller Payout</h3>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Fee</span>
                  <span className="text-white">₦{orderData?.order?.paymentBreakdown?.fees?.totalPlatformFee?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Deductions</span>
                  <span className="text-white">₦{orderData?.order?.paymentBreakdown?.fees?.totalDeductions?.toLocaleString() || 0}</span>
                </div>
                <div className="border-t border-gray-700 mt-2 pt-2">
                  <div className="flex justify-between font-medium">
                    <span className="text-white">Seller Receives</span>
                    <span className="text-green-500 text-lg">
                      ₦{orderData?.order?.paymentBreakdown?.sellerPayout?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </Card>
      </div>

      {/* Order Items */}
      <Card className="bg-gray-900 border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600/20 p-2 rounded-lg">
          <Package className="h-5 w-5 text-blue-500" />
            </div>
          <h2 className="text-lg font-semibold text-white">Order Items</h2>
        </div>
        </div>
        
        <div className="overflow-hidden">
        <Table>
            <TableHeader className="bg-gray-800">
            <TableRow>
                <TableHead className="text-white">Product</TableHead>
                <TableHead className="text-white">Details</TableHead>
                <TableHead className="text-white">Specifications</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white text-center">Quantity</TableHead>
                <TableHead className="text-white text-right">Price</TableHead>
                <TableHead className="text-white text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {orderData?.items?.map((item, index) => (
                <TableRow key={index} className="border-b border-gray-800">
                  <TableCell className="py-4">
                  <div className="flex items-center gap-4">
                    {item.product.images?.[0] && (
                      <img 
                        src={item.product.images[0].url} 
                        alt={item.product.name}
                          className="h-16 w-16 rounded-md object-cover border border-gray-700"
                        />
                      )}
                      <div>
                        <p className="text-white font-medium">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.product.brand}
                        </p>
                      </div>
                  </div>
                </TableCell>
                <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Tag className="h-3 w-3" />
                        <span>SKU: {item.product.sku}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Archive className="h-3 w-3" />
                        <span>Category: {item.product.category}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Shield className="h-3 w-3" />
                        <span>Condition: {item.product.condition}</span>
                      </div>
                  </div>
                </TableCell>
                <TableCell>
                    <div className="text-sm">
                      {(item.specifications?.color || item.specifications?.size || item.specifications?.material) ? (
                        <div className="space-y-1">
                          {item.specifications?.color && (
                            <div className="flex items-center gap-2">
                              <div 
                                className="h-3 w-3 rounded-full" 
                                style={{ 
                                  backgroundColor: item.specifications.color.toLowerCase().replace(/\s+/g, '') || 'gray' 
                                }}
                              ></div>
                              <span className="text-muted-foreground">Color: {item.specifications.color}</span>
                            </div>
                          )}
                          {item.specifications?.size && (
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Size: {item.specifications.size}</span>
                            </div>
                          )}
                          {item.specifications?.material && (
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Material: {item.specifications.material}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No specifications</span>
                      )}
                  </div>
                </TableCell>
                <TableCell>
                    <Badge className={`
                      ${item.status === 'pending' ? 'bg-yellow-600/20 text-yellow-500 border-yellow-800' : ''}
                      ${item.status === 'processing' ? 'bg-blue-600/20 text-blue-500 border-blue-800' : ''}
                      ${item.status === 'shipped' ? 'bg-purple-600/20 text-purple-500 border-purple-800' : ''}
                      ${item.status === 'delivered' ? 'bg-green-600/20 text-green-500 border-green-800' : ''}
                      ${item.status === 'cancelled' ? 'bg-red-600/20 text-red-500 border-red-800' : ''}
                    `}>
                      {item.status?.toUpperCase()}
                    </Badge>
                </TableCell>
                  <TableCell className="text-center">
                    <span className="text-white font-medium">{item.quantity}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-white">₦{item.price.toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-white font-medium">₦{(item.price * item.quantity).toLocaleString()}</span>
                  </TableCell>
              </TableRow>
            ))}
              {!orderData?.items?.length && (
              <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No items found in this order.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </Card>

      {/* Item Status History */}
      <Card className="bg-gray-900 border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="bg-amber-600/20 p-2 rounded-lg">
          <Clock className="h-5 w-5 text-amber-500" />
            </div>
          <h2 className="text-lg font-semibold text-white">Item Status History</h2>
        </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-6">
            {orderData?.items?.map((item, itemIndex) => (
              <div key={itemIndex} className="border-b border-gray-800 pb-6 last:border-0 last:pb-0">
                <div className="flex items-start gap-4 mb-4">
                  {item.product.images?.[0] && (
                    <img 
                      src={item.product.images[0].url} 
                      alt={item.product.name}
                      className="h-12 w-12 rounded object-cover border border-gray-700"
                    />
                  )}
                    <div>
                    <h3 className="text-md font-medium text-white">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground">SKU: {item.product.sku}</p>
                  </div>
                </div>
                
                <div className="space-y-0">
                  {item.statusHistory?.map((status, statusIndex) => (
                    <div key={statusIndex} className="flex items-start gap-3 ml-4">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                        {statusIndex !== item.statusHistory.length - 1 && (
                          <div className="h-12 w-0.5 bg-gray-700"></div>
                        )}
                      </div>
                      <div className="bg-gray-800 p-3 rounded-md flex-grow mb-2">
                        <p className="text-white font-medium capitalize">{status.status}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(status.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
            {!orderData?.items?.length && (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>No item status history available.</span>
        </div>
            )}
          </div>
        </div>
      </Card>

      {/* Order Notes */}
      {orderData?.notes && orderData.notes.length > 0 && (
        <Card className="bg-gray-900 border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="bg-purple-600/20 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-purple-500" />
        </div>
              <h2 className="text-lg font-semibold text-white">Order Notes</h2>
          </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-3">
            {orderData.notes?.map((note, index) => (
                <div key={note._id || index} className="bg-gray-800 p-4 rounded-lg border-l-4 border-purple-500">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground capitalize">{note.type || 'Admin'} Note</span>
                    </div>
                    {note.createdAt && (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(note.createdAt)}
                      </span>
                    )}
                  </div>
                <p className="text-white">{note.content || note}</p>
              </div>
            ))}
            </div>
          </div>
        </Card>
      )}

      {/* Order Timeline */}
      {orderData?.timeline && orderData.timeline.length > 0 && (
        <Card className="bg-gray-900 border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600/20 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <h2 className="text-lg font-semibold text-white">Order Timeline</h2>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-0">
            {orderData.timeline?.map((event, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    {index !== orderData.timeline.length - 1 && (
                      <div className="h-14 w-0.5 bg-gray-700"></div>
                    )}
                  </div>
                  <div className="bg-gray-800 p-4 rounded-md flex-grow mb-2">
                    <p className="text-white font-medium capitalize">{event.status}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(event.timestamp)}
                  </p>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-2 border-t border-gray-700 pt-2">
                        {event.description}
                      </p>
                    )}
                </div>
              </div>
            ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default OrderDetail
