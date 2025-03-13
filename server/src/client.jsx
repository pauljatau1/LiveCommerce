import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Check, ChevronDown, Truck, Package, MapPin, AlertCircle, Clock, CreditCard, DollarSign, ShoppingBag, User, Building2, Phone, Mail, Calendar, Box, Tag, ArrowUpRight, XCircle } from 'lucide-react'
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
import { useOutletContext } from 'react-router-dom'

export default function OrderDetails() {
  const { setHeaderName, setNavName } = useOutletContext()
  const { id } = useParams()
  const [orderData, setOrderData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [arrangePickupLoading, setArrangePickupLoading] = useState(false)
  const [orderStatus, setOrderStatus] = useState(null)
  const navigate = useNavigate()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)

  useEffect(() => {
    setHeaderName('Order')
    setNavName('Orders Details')
  }, [])

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
          setOrderStatus(data.orderStatus)
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
          setOrderStatus(data.orderStatus)
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

  // Add this helper function to check if order is cancellable
  const isOrderCancellable = (order) => {
    // Check if order exists and has items
    if (!order || !order.items) return false;
    
    // Check if shipping status is pending
    const isShippingPending = order.shipping?.tracking?.status === 'pending';
    
    // Check if all items are in pending status and none are cancelled
    const areItemsPending = order.items.every(item => item.status === 'pending');
    const isAnyCancelled = order.items.some(item => item.status === 'cancelled');
    
    // Order can be cancelled if shipping is pending, all items are pending, and none are cancelled
    return isShippingPending && areItemsPending && !isAnyCancelled;
  };

  // Update the handleCancelOrder function
  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    if (!isOrderCancellable(orderData)) {
      toast.error('This order cannot be cancelled');
      setCancelDialogOpen(false);
      return;
    }

    setCancelLoading(true);
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const response = await fetch(`${BASE_URL}/order/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sellerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: cancelReason
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel order');
      }

      toast.success('Order cancelled successfully');
      setCancelDialogOpen(false);
      
      // Refresh order details
      const updatedOrder = await fetch(`${BASE_URL}/order/${id}`, {
        headers: {
          'Authorization': `Bearer ${sellerToken}`
        }
      });
      const refreshedData = await updatedOrder.json();
      setOrderData(refreshedData);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading || !orderData) return <Loader />

  const { order, buyer, seller, items, shipping, addresses, timeline } = orderData
  console.log('orderData', orderData)

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 hover:bg-yellow-200 capitalize transition-all duration-300 text-yellow-700',
      completed: 'bg-green-100 hover:bg-green-200 capitalize transition-all duration-300 text-green-700',
      paid: 'bg-green-100 hover:bg-green-200 capitalize transition-all duration-300 text-green-700',
      failed: 'bg-red-100 hover:bg-red-200 capitalize transition-all duration-300 text-red-700'
    }
    return colors[status] || 'bg-gray-100 hover:bg-gray-200 capitalize transition-all duration-300 text-gray-700'
  }

  const maskPhoneNumber = (phone) => {
    if (!phone) return '';
    const last3Digits = phone.slice(-3);
    const maskedPart = 'xxx';
    return `${phone.slice(0, 3)}${maskedPart}${last3Digits}`;
  };

  const maskEmail = (email) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    const maskedUsername = `${username.slice(0, 2)}***${username.slice(-2)}`;
    return `${maskedUsername}@${domain}`;
  };

  return (
    <div className="container mx-auto p-4 py-10 space-y-6 min-h-screen">
      {/* Order Header - More subtle design */}
      <Card className="border border-gray-100 shadow-sm bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-green-50/90 to-green-100/90 p-4 text-gray-800">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  <h1 className="text-xl font-inter font-semibold">Order #{order?.order_id}</h1>
                  <Badge variant="outline" className="bg-blue-600 mb-1 md:mb-0 capitalize px-3 py-1 rounded-lg text-white border-white/10 text-xs">
                    {order?.channel}
                  </Badge>
                  <Badge variant="outline" className={`${orderData?.order?.orderStatus?.isOpen ? 'bg-green-600' : 'bg-gray-600'} mb-1 md:mb-0 capitalize px-3 py-1 rounded-lg text-white border-white/10 text-xs`}>
                    {orderData?.order?.orderStatus?.isOpen ? 'Open' : 'Closed'}
                  </Badge>
                  {orderData?.order?.orderStatus?.hasReturn && (
                    <Badge variant="outline" className="bg-orange-600 mb-1 md:mb-0 capitalize px-3 py-1 rounded-lg text-white border-white/10 text-xs">
                      Return Requested
                    </Badge>
                  )}
                </div>
                <p className="flex items-center gap-2 text-gray-900 text-xs">
                  <Clock className="h-3 w-3" />
                  Placed on {new Date(order?.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2">
                {orderData?.order?.orderStatus?.hasReturn && (
                  <Button
                    onClick={() => navigate(`/dashboard/return/${orderData.order.orderStatus.returnRequestId}`)}
                    size="lg"
                    className="bg-orange-600 hover:bg-orange-700 capitalize transition-all duration-300 text-white text-sm h-10"
                  >
                    <ArrowUpRight className="mr-2 h-3 w-3" />
                    View Return Request
                  </Button>
                )}

                {shipping?.tracking?.status === 'pending' && isOrderCancellable(orderData) && (
                  <Button
                    onClick={() => setCancelDialogOpen(true)}
                    variant="destructive"
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 capitalize transition-all duration-300 text-white text-sm h-10"
                  >
                    <XCircle className="mr-2 h-3 w-3" />
                    Cancel Order
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-1">
              <Badge className={`${getStatusColor(order?.paymentInfo?.status)} px-3 py-1 rounded-md text-xs`}>
                <CreditCard className="h-3 w-3 mr-1" />
                Payment: {order?.paymentInfo?.status}
              </Badge>
              <Badge className={`${getStatusColor(shipping?.tracking?.status)} px-3 py-1 rounded-md text-xs`}>
                <Truck className="h-3 w-3 mr-1" />
                Shipping: {shipping?.tracking?.status}
              </Badge>
              {order?.dispute?.status !== 'none' && (
                <Badge variant="destructive" className="text-xs px-3 py-1 rounded-md capitalize transition-all duration-300">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Dispute: {order?.dispute?.status || 'none'}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          <div className=" grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-medium text-gray-700">Buyer Details</h3>
              </div>
              <div className="space-y-1 text-xs">
                <p className="text-gray-700 font-medium">
                  {buyer?.firstName} {buyer?.lastName}
                </p>
                <p className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-3 w-3" />
                  {maskEmail(buyer?.email)}
                </p>
                <p className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-3 w-3" />
                  {maskPhoneNumber(buyer?.phoneNumber)}
                </p>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-medium text-gray-700">Seller Details</h3>
              </div>
              <div className="space-y-1 text-xs">
                <p className="text-gray-700 font-medium">
                  {seller?.businessName}
                </p>
                <p className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-3 w-3" />
                  {maskEmail(seller?.email)}
                </p>
                <p className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-3 w-3" />
                  {maskPhoneNumber(seller?.phoneNumber)}
                </p>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-medium text-gray-700">Shipping Details</h3>
              </div>
              <div className="space-y-1 text-xs">
                <p className="text-gray-700 font-medium">
                  {shipping?.carrier?.name}
                </p>
                <p className="text-gray-700 font-medium">
                  {shipping?.method}
                </p>
                <p className="text-gray-700 font-medium">
                  {shipping?.shipment_id}
                </p>
                <p className="text-gray-700 font-medium">
                  {shipping?.estimatedDeliveryDate ? 
                    new Date(shipping.estimatedDeliveryDate).toLocaleDateString() : 'Not available'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-1 xl:grid-cols-3 w-full">
        <div className="xl:col-span-2 space-y-6">
          {/* Order Items - More subtle design */}
          <Card className="border border-gray-100 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-100 p-4">
              <CardTitle className="flex items-center gap-2 font-inter text-sm text-gray-700">
                <Box className="h-4 w-4 text-blue-500" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {items?.map((item) => (
                <div key={item._id} className="flex flex-col md:flex-row gap-4 py-4 border-b last:border-0">
                  <div className="h-32 w-32 bg-white rounded-md overflow-hidden border border-gray-100">
                    <img
                      src={item?.product?.images?.[0]?.url || "/placeholder.svg"}
                      alt={item?.product?.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    <div>
                      <h3 className="text-sm font-medium">{item?.product?.name}</h3>
                      <p className="text-xs text-gray-600">{item?.product?.description}</p>
                    </div>

                    {/* Product Specifications */}
                    {item?.specifications && Object.keys(item.specifications).length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-700">Specifications:</p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(item.specifications).map(([key, value]) => (
                            value && (
                              <Badge key={key} variant="secondary" className="text-xs capitalize">
                                <Tag className="h-3 w-3 mr-1" />
                                {key}: {value}
                              </Badge>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Product Variants (if any) */}
                    {item?.product?.variants?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item?.product?.variants?.map((variant) => (
                          <Badge key={variant._id} variant="outline" className="text-xs">
                            {variant.name}: {variant.value}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-left md:text-right space-y-1 text-sm">
                    <p className="font-medium">₦{item?.price?.toLocaleString()}</p>
                    <p className="text-xs text-gray-600">
                      Qty: {item?.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Timeline - More subtle design */}
          <Card className="border border-gray-100 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-100 p-4">
              <CardTitle className="flex items-center font-inter gap-2 text-sm xl:text-base text-gray-700">
                <Clock className="h-4 w-4 text-blue-500" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Always show Order Placed */}
                <div className="flex gap-3 relative">
                  <div className="absolute left-[5px] top-6 bottom-0 w-[1px] bg-gray-200" />
                  <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5 z-10" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-gray-700">Order Placed Successfully</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {order?.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                    </p>
                  </div>
                </div>

                {/* Show Order Paid if payment status is 'paid' */}
                {order?.paymentInfo?.status === 'paid' && (
                  <div className="flex gap-3 relative">
                    <div className="absolute left-[5px] top-6 bottom-0 w-[1px] bg-gray-200" />
                    <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5 z-10" />
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-gray-700">Order Paid</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {order?.paymentInfo?.paidAt ? new Date(order.paymentInfo.paidAt).toLocaleString() : ''}
                      </p>
                    </div>
                  </div>
                )}

                {/* Show shipping tracking history if available */}
                {shipping?.tracking?.history?.map((event, index) => (
                  <div key={index} className="flex gap-3 relative">
                    <div className="absolute left-[5px] top-6 bottom-0 w-[1px] bg-gray-200" />
                    <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5 z-10" />
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-gray-700 capitalize">{event?.status?.replace(/-/g, ' ')}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {event?.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Price Breakdown */}
          <Card className="border border-gray-100 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-100 p-4">
              <CardTitle className="flex items-center gap-2 font-inter text-sm text-gray-700">
                <DollarSign className="h-4 w-4 text-blue-500" />
                Payment Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
          
                <div className="space-y-4">
                  {/* Order Items Breakdown */}
                  {order?.paymentBreakdown?.items?.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.productName}</span>
                      <span>₦{item.amount.toLocaleString()}</span>
                    </div>
                  ))}

                  {/* Delivery Fee (if exists) */}
                  {shipping?.fee?.amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery Fee (Paid by buyer)</span>
                      <span className="text-gray-600">₦{shipping.fee.amount.toLocaleString()}</span>
                    </div>
                  )}

                  <Separator />

                  {/* Platform Fees */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Platform Fee ({order?.paymentBreakdown?.items?.[0]?.platformFeePercentage}%)</span>
                      <span className="text-red-600">-₦{order?.paymentBreakdown?.fees?.totalPlatformFee?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Payment Processing Fee ({order?.paymentBreakdown?.fees?.processingFeePercentage}%)</span>
                      <span className="text-red-600">-₦{order?.paymentBreakdown?.fees?.processingFee?.toLocaleString()}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Total Deductions */}
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">Total Deductions</span>
                    <span className="text-red-600">-₦{order?.paymentBreakdown?.fees?.totalDeductions?.toLocaleString()}</span>
                  </div>

                  {/* Seller Payout */}
                  <div className="flex justify-between text-lg font-inter font-semibold bg-green-50 p-3 rounded-md">
                    <span>Payout</span>
                    <span className="text-green-700">₦{order?.paymentBreakdown?.sellerPayout?.toLocaleString()}</span>
                  </div>

                  {/* Payment Status */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(order?.paymentInfo?.status)}>
                        {order?.paymentInfo?.status === 'awaiting_cod' ? 'Payment on Delivery' : order?.paymentInfo?.status}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {order?.paymentInfo?.status === 'awaiting_cod' ? '' : `via ${order?.paymentInfo?.method}`}
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
        <div className="space-y-6 w-full">
          {/* Addresses */}
          <Card className="border w-full border-gray-100 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-100 p-4">
              <CardTitle className="flex items-center gap-2 font-inter text-sm text-gray-700">
                <MapPin className="h-4 w-4 text-blue-500" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Delivery Address */}
              <div>
                <h3 className="font-inter font-semibold mb-2">Delivery Address</h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium">
                    {addresses?.delivery?.first_name} {addresses?.delivery?.last_name}
                  </p>
                  <p>{maskPhoneNumber(addresses?.delivery?.phone)}</p>
                  <p>{maskEmail(addresses?.delivery?.email)}</p>
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
                <h3 className="font-inter font-semibold mb-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  Warehouse/Pickup Location
                </h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium text-gray-800">
                    {items[0]?.product?.seller?.warehouseDetails?.name}
                  </p>
                  <p className="text-gray-600">{maskPhoneNumber(items[0]?.product?.seller?.warehouseDetails?.contactNumber)}</p>
                  <p className="text-gray-600">{items[0]?.product?.seller?.warehouseDetails?.address?.addressLine1}</p>
                  {items[0]?.product?.seller?.warehouseDetails?.address?.addressLine2 && (
                    <p className="text-gray-600">{items[0]?.product?.seller?.warehouseDetails?.address?.addressLine2}</p>
                  )}
                  <p className="text-gray-600">
                    {items[0]?.product?.seller?.warehouseDetails?.address?.city}, {items[0]?.product?.seller?.warehouseDetails?.address?.state} {items[0]?.product?.seller?.warehouseDetails?.address?.zipCode}
                  </p>
                  <p className="text-gray-600">{items[0]?.product?.seller?.warehouseDetails?.address?.country}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Status */}
          <Card className="border border-gray-100 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-100 p-4">
              <CardTitle className="flex items-center font-inter gap-2 text-sm text-gray-700">
                <Truck className="h-4 w-4 text-blue-500" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add discount information if available */}
              {items[0]?.product?.discount?.isActive && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-4">
                  <h4 className="font-medium text-green-800 flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4" />
                    Applied Discount
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-green-700">
                      {items[0].product.discount.couponName && (
                        <span className="font-medium">Coupon: {items[0].product.discount.couponName}</span>
                      )}
                    </p>
                    <p className="text-green-700">
                      Discount: {items[0].product.discount.value}% off
                    </p>
                    {/* <p className="text-green-700">
                      Original Price: ₦{items[0].product.originalPrice.toLocaleString()}
                    </p> */}
                    <p className="text-green-700 font-medium">
                      Discounted Price: ₦{items[0].price.toLocaleString()}
                    </p>
                    {items[0].product.discount.startDate && (
                      <p className="text-green-700">
                        Valid from: {new Date(items[0].product.discount.startDate).toLocaleDateString()}
                      </p>
                    )}
                    {items[0].product.discount.endDate && (
                      <p className="text-green-700">
                        Valid until: {new Date(items[0].product.discount.endDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-700">
                  <Truck className="h-4 w-4 text-blue-500" />
                  <p>Carrier: {shipping?.carrier?.name}</p>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Tag className="h-4 w-4 text-blue-500" />
                  <p>Carrier Reference: {shipping?.carrier?.reference}</p>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Package className="h-4 w-4 text-blue-500" />
                  <p>Tracking Number: {shipping?.tracking?.number}</p>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Box className="h-4 w-4 text-blue-500" />
                  <p>Fez Order ID: {shipping?.shipment_id}</p>
                </div>
                
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <p>
                    Estimated Delivery: {shipping?.estimatedDeliveryDate ? 
                      new Date(shipping.estimatedDeliveryDate).toLocaleDateString() : 'Not available'}
                  </p>
                </div>

                {/* Shipping Status Badge */}
                <div className="mt-4">
                  <Badge 
                    className={`${
                      shipping?.tracking?.status === 'delivered' 
                        ? 'bg-green-100 text-green-800' 
                        : shipping?.tracking?.status === 'in_transit'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    } px-3 py-2 text-sm capitalize flex items-center gap-2 w-fit`}
                  >
                    {shipping?.tracking?.status === 'delivered' ? (
                      <Check className="h-4 w-4" />
                    ) : shipping?.tracking?.status === 'in_transit' ? (
                      <Truck className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                    {shipping?.tracking?.status?.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>

              {/* Shipping Documents */}
              {(shipping?.documents?.shippingLabel || shipping?.documents?.commercialInvoice) && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-medium flex items-center gap-2 text-gray-800">
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
                      className="text-blue-500"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    Shipping Documents
                  </h4>
                  <div className="flex flex-col gap-2">
                    {shipping.documents.shippingLabel && (
                      <Button
                        className="w-full flex items-center font-inter bg-gray-800 hover:bg-gray-900 transition-all duration-300 justify-center gap-2"
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
                        Track Shipment
                      </Button>
                    )}
                    {shipping.documents.commercialInvoice && (
                      <Button
                        variant="outline"
                        className="w-full flex items-center font-inter justify-center gap-2 border-gray-200 hover:bg-gray-50"
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
                          className="text-gray-600"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        Print Shipping Label
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {/* {shipping?.tracking?.history?.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-inter font-medium mb-2">Tracking History</h4>
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
              )} */}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Cancel Order Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this order. This will be communicated to the buyer.
              {!isOrderCancellable(orderData) && (
                <div className="mt-2 text-red-500">
                  This order cannot be cancelled because it has already been processed or cancelled.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm font-medium text-gray-700">
                Cancellation Reason
              </label>
              <textarea
                id="reason"
                className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Please explain why you're cancelling this order..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                disabled={!isOrderCancellable(orderData)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              className="border-gray-200"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={cancelLoading || !isOrderCancellable(orderData)}
              onClick={handleCancelOrder}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
