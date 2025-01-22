import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Check, ChevronDown, Truck, Package, MapPin, AlertCircle } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Loader from '@/Components/Loader'
import { BASE_URL } from '@/Constants/Server'

export default function OrderDetails() {
  const { id } = useParams()
  const [orderData, setOrderData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [arrangePickupLoading, setArrangePickupLoading] = useState(false)

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const sellerToken = localStorage.getItem('sellerToken')
        if (sellerToken) {
          const tokenData = JSON.parse(sellerToken)
          const token = tokenData.data
          const response = await fetch(`${BASE_URL}/order/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          const data = await response.json()
          setOrderData(data)
        }
      } catch (error) {
        console.error('Error fetching order details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [id])

  const arrangePickup = async () => {
    setArrangePickupLoading(true)
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data
      const response = await fetch(`${BASE_URL}/order/${id}/arrange-pickup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sellerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rate_id: orderData?.shipping?.rate_id,
          shipment_id: orderData?.shipping?.shipment_id,
          purchase_insurance: false
        })
      })

      if (!response.ok) throw new Error('Failed to arrange pickup')

      toast.success('Pickup arranged successfully')
      // Fetch order details again
      const fetchOrderDetails = async () => {
        try {
          const tokenData = JSON.parse(localStorage.getItem('sellerToken'))
          const token = tokenData.data
          const response = await fetch(`${BASE_URL}/order/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          const data = await response.json()
          setOrderData(data)
        } catch (error) {
          console.error('Error fetching order details:', error)
          toast.error('Failed to refresh order details')
        }
      }
      await fetchOrderDetails()
    } catch (error) {
      toast.error('Failed to arrange pickup: ' + error.message)
    } finally {
      setArrangePickupLoading(false)
    }
  }

  const printDocument = (url, documentType) => {
    // Open document in new window/tab
    window.open(url, `_blank${documentType}`);
  };

  if (loading || !orderData) return <Loader />

  const { order, buyer, seller, items, shipping, addresses, timeline } = orderData

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
      paid: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Order Header */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">Order #{order?._id?.slice(-8)}</h1>
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    {order?.channel}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(order?.paymentInfo?.status)}>
                    Payment: {order?.paymentInfo?.status}
                  </Badge>
                  <Badge className={getStatusColor(shipping?.tracking?.status)}>
                    Shipping: {shipping?.tracking?.status}
                  </Badge>
                  {order?.dispute?.status !== 'none' && (
                    <Badge variant="destructive">Dispute: {order?.dispute?.status}</Badge>
                  )}
                  {order?.refund?.status !== 'none' && (
                    <Badge variant="warning">Refund: {order?.refund?.status}</Badge>
                  )}
                </div>
                <p className="text-gray-600">
                  Placed on {new Date(order?.createdAt).toLocaleString()}
                </p>
              </div>

              {shipping?.tracking?.status === 'pending' && shipping?.rate_id && (
                <Button
                  onClick={arrangePickup}
                  disabled={arrangePickupLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Truck className="mr-2 h-4 w-4" />
                  {arrangePickupLoading ? 'Arranging...' : 'Arrange Pickup'}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Buyer Details</h3>
                <div className="space-y-1 text-sm">
                  <p>{buyer?.firstName} {buyer?.lastName}</p>
                  <p>{buyer?.email}</p>
                  <p>{buyer?.phoneNumber}</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Seller Details</h3>
                <div className="space-y-1 text-sm">
                  <p>{seller?.businessName}</p>
                  <p>{seller?.email}</p>
                  <p>{seller?.phoneNumber}</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Shipping Details</h3>
                <div className="space-y-1 text-sm">
                  <p>Carrier Name: {shipping?.carrier?.name}</p>
                  <p>Method: {shipping?.method}</p>
                  <p>Shipment ID: {shipping?.shipment_id}</p>
                  <p>Estimated Delivery: {shipping?.estimatedDeliveryDate ? 
                    new Date(shipping.estimatedDeliveryDate).toLocaleDateString() : 'Not available'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Order Items */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {items?.map((item) => (
                <div key={item._id} className="flex flex-col md:flex-row gap-4 py-4 border-b last:border-0">
                  <div className="h-32 w-32 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={item?.product?.images?.[0]?.url || "/placeholder.svg"}
                      alt={item?.product?.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <h3 className="font-semibold text-lg">{item?.product?.name}</h3>
                    <p className="text-sm text-gray-600">{item?.product?.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {item?.product?.variants?.map((variant) => (
                        <Badge key={variant._id} variant="outline">
                          {variant.name}: {variant.value}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(item?.status)}>{item?.status}</Badge>
                      <span className="text-sm text-gray-600">Quantity: {item?.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-semibold text-lg">₦{item?.price?.toLocaleString()}</p>
                    {item?.product?.discount?.isActive && (
                      <p className="text-sm text-green-600">
                        {item.product.discount.value}% OFF
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      Total: ₦{((item?.price || 0) * (item?.quantity || 1)).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline?.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-2 h-2 mt-2 rounded-full bg-green-500" />
                    <div>
                      <p className="font-medium capitalize">{event?.status}</p>
                      <p className="text-sm text-gray-600">
                        {event?.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Price Breakdown */}
          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₦{order?.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping Fee</span>
                  <span>₦{shipping?.fee?.amount?.toLocaleString() || '0'}</span>
                </div>
                {order?.discount && Object.keys(order?.discount || {}).length > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₦{order?.discount?.amount?.toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>₦{((order?.totalAmount || 0) + (shipping?.fee?.amount || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(order?.paymentInfo?.status)}>
                      {order?.paymentInfo?.status}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      via {order?.paymentInfo?.method}
                    </span>
                  </div>
                  {order?.paymentInfo?.paidAt && (
                    <span className="text-sm text-gray-600">
                      Paid on {new Date(order.paymentInfo.paidAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Addresses */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Delivery Address */}
              <div>
                <h3 className="font-semibold mb-2">Delivery Address</h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium">
                    {addresses?.delivery?.first_name} {addresses?.delivery?.last_name}
                  </p>
                  <p>{addresses?.delivery?.phone}</p>
                  <p>{addresses?.delivery?.email}</p>
                  <p>{addresses?.delivery?.line1}</p>
                  {addresses?.delivery?.line2 && <p>{addresses?.delivery?.line2}</p>}
                  <p>
                    {addresses?.delivery?.city}, {addresses?.delivery?.state} {addresses?.delivery?.zip}
                  </p>
                  <p>{addresses?.delivery?.country}</p>
                </div>
              </div>

              {/* Pickup Address */}
              <div>
                <h3 className="font-semibold mb-2">Pickup Address</h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium">
                    {addresses?.pickup?.first_name} {addresses?.pickup?.last_name}
                  </p>
                  <p>{addresses?.pickup?.phone}</p>
                  <p>{addresses?.pickup?.email}</p>
                  <p>{addresses?.pickup?.line1}</p>
                  {addresses?.pickup?.line2 && <p>{addresses?.pickup?.line2}</p>}
                  <p>
                    {addresses?.pickup?.city}, {addresses?.pickup?.state} {addresses?.pickup?.zip}
                  </p>
                  <p>{addresses?.pickup?.country}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Status */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="font-medium">Method: {shipping?.method}</p>
                <p>Carrier: {shipping?.carrier?.name}</p>
                <p>Carrier Reference: {shipping?.carrier?.reference}</p>
                <p>Tracking Number: {shipping?.tracking?.number}</p>
                <p>Shipment ID: {shipping?.shipment_id}</p>
                <p>Rate ID: {shipping?.rate_id}</p>
                <p>Purpose: {shipping?.shipment_purpose}</p>
                <p className="text-gray-600">
                  Estimated Delivery: {shipping?.estimatedDeliveryDate ? 
                    new Date(shipping.estimatedDeliveryDate).toLocaleDateString() : 'Not available'}
                </p>
              </div>

              {/* Shipping Documents */}
              {(shipping?.documents?.shippingLabel || shipping?.documents?.commercialInvoice) && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-medium">Shipping Documents</h4>
                  <div className="flex flex-col gap-2">
                    {shipping.documents.shippingLabel && (
                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => printDocument(shipping.documents.shippingLabel, 'ShippingLabel')}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 6 2 18 2 18 9"></polyline>
                          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                          <rect x="6" y="14" width="12" height="8"></rect>
                        </svg>
                        Print Shipping Label
                      </Button>
                    )}
                    {shipping.documents.commercialInvoice && (
                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => printDocument(shipping.documents.commercialInvoice, 'CommercialInvoice')}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        Print Commercial Invoice
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {shipping?.tracking?.history?.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Tracking History</h4>
                  <div className="space-y-2">
                    {shipping.tracking.history.map((event, index) => (
                      <div key={index} className="text-sm border-l-2 border-green-500 pl-4 py-2">
                        <p className="font-medium capitalize">{event?.status?.replace(/_/g, ' ')}</p>
                        <p className="text-gray-600">
                          {event?.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
                        </p>
                        {event?.note && (
                          <p className="text-gray-500 text-sm mt-1">{event.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
