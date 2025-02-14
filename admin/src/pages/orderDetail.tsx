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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Package, Truck, MapPin, Clock, AlertCircle } from 'lucide-react'

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
    }
    orderStatus: {
      isOpen: boolean
      closedAt: string | null
      closedBy: string | null
      closedReason: string | null
    }
  }
  buyer: {
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
  }
  seller: {
    email: string
    phoneNumber: string
    storeName: string
  }
  items: Array<{
    product: {
      name: string
      price: number
      images: Array<{ url: string }>
    }
    quantity: number
    price: number
    status: string
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
      line1: string
      line2: string
      city: string
      state: string
      country: string
      zip: string
    }
    pickup: {
      first_name: string
      last_name: string
      line1: string
      line2: string
      city: string
      state: string
    }
  }
  shipping: {
    method: string
    carrier: {
      name: string
    }
    fee: {
      amount: number
      currency: string
    }
    tracking: {
      status: string
      history: Array<any>
    }
  }
  timeline: Array<{
    status: string
    timestamp: string
  }>
}

function OrderDetail() {
  const { id } = useParams()
  const [orderData, setOrderData] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

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

  if (loading) return <div>Loading...</div>
  if (!orderData) return <div>Order not found</div>

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Order #{orderData.order.order_id}
          </h1>
          <p className="text-muted-foreground">
            Placed on {new Date(orderData.order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant={orderData.order.orderStatus.isOpen ? "destructive" : "default"}
              className="ml-4"
            >
              {orderData.order.orderStatus.isOpen ? "Close Order" : "Reopen Order"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white">
            <DialogHeader>
              <DialogTitle>
                {orderData.order.orderStatus.isOpen ? "Close Order" : "Reopen Order"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Please provide a reason for {orderData.order.orderStatus.isOpen ? "closing" : "reopening"} this order.
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
                onClick={() => handleStatusUpdate(!orderData.order.orderStatus.isOpen)}
                disabled={!reason || isUpdating}
                className={orderData.order.orderStatus.isOpen ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
              >
                {isUpdating ? "Updating..." : orderData.order.orderStatus.isOpen ? "Close Order" : "Reopen Order"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card className="p-6 bg-gray-900 border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Customer Information</h2>
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Name: {orderData.buyer.firstName} {orderData.buyer.lastName}
            </p>
            <p className="text-muted-foreground">Email: {orderData.buyer.email}</p>
            <p className="text-muted-foreground">Phone: {orderData.buyer.phoneNumber}</p>
          </div>
        </Card>

        {/* Shipping Information */}
        <Card className="p-6 bg-gray-900 border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Shipping Information</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">
                {orderData.shipping.carrier.name} - {orderData.shipping.tracking.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">
                {orderData.addresses.delivery.line1}, {orderData.addresses.delivery.city}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Order Items */}
      <Card className="p-6 bg-gray-900 border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-4">Order Items</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Specifications</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderData.items.map((item, index) => (
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
                    {item.specifications.color && <div>Color: {item.specifications.color}</div>}
                    {item.specifications.size && <div>Size: {item.specifications.size}</div>}
                    {item.specifications.material && <div>Material: {item.specifications.material}</div>}
                  </div>
                </TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>₦{item.price.toLocaleString()}</TableCell>
                <TableCell>₦{(item.price * item.quantity).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Order Timeline */}
      <Card className="p-6 bg-gray-900 border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-4">Order Timeline</h2>
        <div className="space-y-4">
          {orderData.timeline.map((event, index) => (
            <div key={index} className="flex items-center gap-4">
              <Clock className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-white capitalize">{event.status}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(event.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Order Summary */}
      <Card className="p-6 bg-gray-900 border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-4">Order Summary</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-white">₦{orderData.order.totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping Fee</span>
            <span className="text-white">₦{orderData.shipping.fee.amount.toLocaleString()}</span>
          </div>
          <div className="border-t border-gray-800 mt-2 pt-2">
            <div className="flex justify-between">
              <span className="font-semibold text-white">Total</span>
              <span className="font-semibold text-white">
                ₦{(orderData.order.totalAmount + orderData.shipping.fee.amount).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default OrderDetail
