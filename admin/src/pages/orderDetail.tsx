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
import { Package, Truck, MapPin, Clock, AlertCircle, CreditCard, Store, FileText, Banknote, User, CheckCircle, XCircle, Trash2, Bell } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface OrderDetail {
  order: {
    _id: string
    order_id: string
    channel: string
    createdAt: string
    totalAmount: number
    paid: boolean
    paymentInfo: {
      method: string
      status: string
      transactionId: string
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
  }
  seller: {
    _id: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    businessName: string
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

  if (loading) return <div>Loading...</div>
  if (!orderData) return <div>Order not found</div>

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Order #{orderData.order?.order_id}
          </h1>
          <p className="text-muted-foreground">
            Placed on {new Date(orderData.order?.createdAt || '').toLocaleDateString()}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">Channel: </span>
            <span className="text-sm font-medium text-white capitalize">{orderData.order?.channel || 'N/A'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded">
            <span className="text-sm text-muted-foreground">Status: </span>
            <span className={`text-sm font-medium ${orderData.order?.orderStatus?.isOpen ? "text-green-500" : "text-yellow-500"}`}>
              {orderData.order?.orderStatus?.isOpen ? "Open" : "Closed"}
            </span>
          </div>

          {/* Webhook Simulator Button */}
          <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                className="ml-2 text-white"
                title="Simulate Fez Webhook"
              >
                <Bell className="h-4 w-4 mr-2" />
                Simulate Webhook
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

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant={orderData.order?.orderStatus?.isOpen ? "destructive" : "default"}
                className="ml-4"
              >
                {orderData.order?.orderStatus?.isOpen ? "Close Order" : "Reopen Order"}
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
          
          {/* Fez Order Deletion Dialog */}
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
        </div>
      </div>

      {/* Order Status Indicators */}
      <Card className="p-6 bg-gray-900 border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-4">Order Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className={`h-5 w-5 ${orderData.order?.paid ? "text-green-500" : "text-gray-500"}`} />
            <span className="text-white">Payment: {orderData.order?.paid ? "Paid" : "Pending"}</span>
          </div>
          <div className="flex items-center gap-2">
            {orderData.order?.orderStatus?.hasReturn ? 
              <CheckCircle className="h-5 w-5 text-yellow-500" /> : 
              <XCircle className="h-5 w-5 text-gray-500" />
            }
            <span className="text-white">Return: {orderData.order?.orderStatus?.hasReturn ? "Yes" : "No"}</span>
          </div>
          <div className="flex items-center gap-2">
            {orderData.order?.orderStatus?.hasDispute ? 
              <CheckCircle className="h-5 w-5 text-red-500" /> : 
              <XCircle className="h-5 w-5 text-gray-500" />
            }
            <span className="text-white">Dispute: {orderData.order?.orderStatus?.hasDispute ? "Yes" : "No"}</span>
          </div>
          <div className="flex items-center gap-2">
            {orderData.order?.orderStatus?.hasRefund ? 
              <CheckCircle className="h-5 w-5 text-blue-500" /> : 
              <XCircle className="h-5 w-5 text-gray-500" />
            }
            <span className="text-white">Refund: {orderData.order?.orderStatus?.hasRefund ? "Yes" : "No"}</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card className="p-6 bg-gray-900 border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-white">Customer Information</h2>
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Name: {orderData.buyer?.firstName} {orderData.buyer?.lastName}
            </p>
            <p className="text-muted-foreground">Email: {orderData.buyer?.email}</p>
            <p className="text-muted-foreground">Phone: {orderData.buyer?.phoneNumber}</p>
            <p className="text-muted-foreground">Customer ID: {orderData.buyer?._id}</p>
          </div>
        </Card>

        {/* Seller Information */}
        <Card className="p-6 bg-gray-900 border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Store className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-white">Seller Information</h2>
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Name: {orderData.seller?.firstName} {orderData.seller?.lastName}
            </p>
            <p className="text-muted-foreground">Business: {orderData.seller?.businessName}</p>
            <p className="text-muted-foreground">Store: {orderData.seller?.storeName}</p>
            <p className="text-muted-foreground">Email: {orderData.seller?.email}</p>
            <p className="text-muted-foreground">Phone: {orderData.seller?.phoneNumber}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Information */}
        <Card className="p-6 bg-gray-900 border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-semibold text-white">Payment Information</h2>
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground">Method: {orderData.order?.paymentInfo?.method}</p>
            <p className="text-muted-foreground">Status: {orderData.order?.paymentInfo?.status}</p>
            <p className="text-muted-foreground">Transaction ID: {orderData.order?.paymentInfo?.transactionId}</p>
            <p className="text-muted-foreground">Paid At: {orderData.order?.paymentInfo?.paidAt ? formatDate(orderData.order.paymentInfo.paidAt) : 'N/A'}</p>
          </div>
        </Card>

        {/* Shipping Information */}
        <Card className="p-6 bg-gray-900 border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-white">Shipping Information</h2>
          </div>
          <div className="space-y-2">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Carrier</span>
              <span className="text-white">{orderData.shipping?.carrier?.name || 'N/A'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Reference</span>
              <span className="text-white">{orderData.shipping?.carrier?.reference || 'N/A'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Tracking Number</span>
              <span className="text-white">{orderData.shipping?.tracking?.number || 'N/A'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Tracking Status</span>
              <span className="text-white capitalize">{orderData.shipping?.tracking?.status || 'N/A'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Shipment ID</span>
              <span className="text-white">{orderData.shipping?.shipment_id || 'N/A'}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Delivery Address */}
      <Card className="p-6 bg-gray-900 border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-red-500" />
          <h2 className="text-lg font-semibold text-white">Delivery Address</h2>
        </div>
        <div className="space-y-2">
          <p className="text-muted-foreground">
            Name: {orderData.addresses?.delivery?.first_name} {orderData.addresses?.delivery?.last_name}
          </p>
          <p className="text-muted-foreground">
            Email: {orderData.addresses?.delivery?.email}
          </p>
          <p className="text-muted-foreground">
            Phone: {orderData.addresses?.delivery?.phone}
          </p>
          <p className="text-muted-foreground">
            Address: {orderData.addresses?.delivery?.line1}
          </p>
          {orderData.addresses?.delivery?.city && (
            <p className="text-muted-foreground">City: {orderData.addresses?.delivery?.city}</p>
          )}
          <p className="text-muted-foreground">
            State: {orderData.addresses?.delivery?.state}
          </p>
          <p className="text-muted-foreground">
            Country: {orderData.addresses?.delivery?.country}
          </p>
          {orderData.addresses?.delivery?.zip && (
            <p className="text-muted-foreground">Zip: {orderData.addresses?.delivery?.zip}</p>
          )}
        </div>
      </Card>

      {/* Order Items */}
      <Card className="p-6 bg-gray-900 border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-white">Order Items</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Specifications</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderData.items?.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-4">
                    {item.product.images?.[0] && (
                      <img 
                        src={item.product.images[0].url} 
                        alt={item.product.name}
                        className="h-12 w-12 rounded object-cover"
                      />
                    )}
                    <span className="text-white">{item.product.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    <div>SKU: {item.product.sku}</div>
                    <div>Brand: {item.product.brand}</div>
                    <div>Category: {item.product.category}</div>
                    <div>Condition: {item.product.condition}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {item.specifications?.color && <div>Color: {item.specifications.color}</div>}
                    {item.specifications?.size && <div>Size: {item.specifications.size}</div>}
                    {item.specifications?.material && <div>Material: {item.specifications.material}</div>}
                    {!item.specifications?.color && !item.specifications?.size && !item.specifications?.material && 
                      <div>No specifications</div>
                    }
                  </div>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 text-xs font-medium rounded capitalize bg-yellow-900/20 text-yellow-500">
                    {item.status}
                  </span>
                </TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>₦{item.price.toLocaleString()}</TableCell>
                <TableCell>₦{(item.price * item.quantity).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {!orderData.items?.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No items found in this order.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Item Status History */}
      <Card className="p-6 bg-gray-900 border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-white">Item Status History</h2>
        </div>
        <div className="space-y-4">
          {orderData.items?.map((item, itemIndex) => (
            <div key={itemIndex} className="border-b border-gray-800 pb-4 last:border-0 last:pb-0">
              <h3 className="text-md font-medium text-white mb-2">{item.product.name}</h3>
              <div className="space-y-2">
                {item.statusHistory?.map((status, statusIndex) => (
                  <div key={statusIndex} className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="text-white capitalize">{status.status}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(status.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!orderData.items?.length && (
            <p className="text-muted-foreground">No item status history available.</p>
          )}
        </div>
      </Card>

      {/* Payment Breakdown */}
      <Card className="p-6 bg-gray-900 border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <Banknote className="h-5 w-5 text-green-500" />
          <h2 className="text-lg font-semibold text-white">Payment Breakdown</h2>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-md font-medium text-white mb-2">Order Items</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Platform Fee (%)</TableHead>
                  <TableHead>Platform Fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderData.order?.paymentBreakdown?.items?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <span className="text-white">{item.productName}</span>
                    </TableCell>
                    <TableCell>₦{item.amount.toLocaleString()}</TableCell>
                    <TableCell>{item.platformFeePercentage}%</TableCell>
                    <TableCell>₦{item.platformFeeAmount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {!orderData.order?.paymentBreakdown?.items?.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No payment breakdown items available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-white mb-2">Fee Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Platform Fee</span>
                <span className="text-white">₦{orderData.order?.paymentBreakdown?.fees?.totalPlatformFee?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Processing Fee ({orderData.order?.paymentBreakdown?.fees?.processingFeePercentage || 0}%)</span>
                <span className="text-white">₦{orderData.order?.paymentBreakdown?.fees?.processingFee?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Deductions</span>
                <span className="text-white">₦{orderData.order?.paymentBreakdown?.fees?.totalDeductions?.toLocaleString() || 0}</span>
              </div>
              <div className="border-t border-gray-800 mt-2 pt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-white">Seller Payout</span>
                  <span className="font-semibold text-white">
                    ₦{orderData.order?.paymentBreakdown?.sellerPayout?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Order Summary */}
      <Card className="p-6 bg-gray-900 border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-white">Order Summary</h2>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order Total</span>
            <span className="text-white">₦{orderData.order?.totalAmount?.toLocaleString() || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping Fee</span>
            <span className="text-white">₦{orderData.shipping?.fee?.amount?.toLocaleString() || 0}</span>
          </div>
          <div className="border-t border-gray-800 mt-2 pt-2">
            <div className="flex justify-between">
              <span className="font-semibold text-white">Total</span>
              <span className="font-semibold text-white">
                ₦{((orderData.order?.totalAmount || 0) + (orderData.shipping?.fee?.amount || 0)).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Order Notes */}
      {orderData.notes && orderData.notes.length > 0 && (
        <Card className="p-6 bg-gray-900 border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Order Notes</h2>
          <div className="space-y-2">
            {orderData.notes?.map((note, index) => (
              <div key={index} className="p-3 bg-gray-800 rounded">
                <p className="text-white">{note}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Order Timeline */}
      {orderData.timeline && orderData.timeline.length > 0 && (
        <Card className="p-6 bg-gray-900 border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Order Timeline</h2>
          <div className="space-y-4">
            {orderData.timeline?.map((event, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <div>
                  <p className="text-white capitalize">{event.status}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(event.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {orderData.timeline?.length === 0 && (
              <p className="text-muted-foreground">No timeline events recorded yet.</p>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

export default OrderDetail
