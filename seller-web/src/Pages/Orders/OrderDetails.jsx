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
      <Card className="border border-gray-100 -sm bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-green-50/90 to-green-100/90 p-6 text-gray-800">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="bg-white p-2 rounded-full -sm">
                    <ShoppingBag className="h-5 w-5 text-green-600" />
                  </div>
                  <h1 className="text-xl font-inter font-semibold">Order #{order?.order_id}</h1>
                  <Badge variant="outline" className="bg-blue-600 capitalize px-3 py-1 rounded-lg text-white border-white/10 text-xs">
                    {order?.channel}
                  </Badge>
                  <Badge variant="outline" className={`${orderData?.order?.orderStatus?.isOpen ? 'bg-green-600' : 'bg-gray-600'} capitalize px-3 py-1 rounded-lg text-white border-white/10 text-xs`}>
                    {orderData?.order?.orderStatus?.isOpen ? 'Open' : 'Closed'}
                  </Badge>
                  {orderData?.order?.orderStatus?.hasReturn && (
                    <Badge variant="outline" className="bg-orange-600 capitalize px-3 py-1 rounded-lg text-white border-white/10 text-xs">
                      Return Requested
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-3 text-gray-700">
                  <p className="flex items-center gap-2 text-xs">
                    <Calendar className="h-3.5 w-3.5" />
                    Placed on {new Date(order?.createdAt).toLocaleDateString()} at {new Date(order?.createdAt).toLocaleTimeString()}
                  </p>
                  {order?.paymentInfo?.paidAt && (
                    <p className="flex items-center gap-2 text-xs">
                      <CreditCard className="h-3.5 w-3.5" />
                      Paid on {new Date(order?.paymentInfo?.paidAt).toLocaleDateString()} at {new Date(order?.paymentInfo?.paidAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>
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

                {/* {shipping?.tracking?.status === 'pending' && (
                  <Button
                    onClick={arrangePickup}
                    disabled={arrangePickupLoading}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 capitalize transition-all duration-300 text-white text-sm h-10"
                  >
                    {arrangePickupLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Arranging...
                      </>
                    ) : (
                      <>
                        <Truck className="mr-2 h-3 w-3" />
                        Arrange Pickup
                      </>
                    )}
                  </Button>
                )} */}

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
              <Badge className={`${getStatusColor(order?.paymentInfo?.status)} px-3 py-1.5 rounded-md text-xs`}>
                <CreditCard className="h-3 w-3 mr-1" />
                Payment: {order?.paymentInfo?.status === 'awaiting_cod' ? 'On Delivery' : order?.paymentInfo?.status}
              </Badge>
              <Badge className={`${getStatusColor(shipping?.tracking?.status)} px-3 py-1.5 rounded-md text-xs`}>
                <Truck className="h-3 w-3 mr-1" />
                Shipping: {shipping?.tracking?.status?.replace(/_/g, ' ')}
              </Badge>
              {order?.dispute?.status !== 'none' && (
                <Badge variant="destructive" className="text-xs px-3 py-1.5 rounded-md capitalize transition-all duration-300">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Dispute: {order?.dispute?.status || 'none'}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-y md:divide-y-0 divide-gray-100">
            <div className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-50">
                <User className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Buyer</p>
                <p className="text-sm font-medium">{buyer?.firstName} {buyer?.lastName}</p>
                <p className="text-xs text-gray-500">{maskEmail(buyer?.email)}</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-50">
                <Building2 className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Seller</p>
                <p className="text-sm font-medium">{seller?.businessName}</p>
                <p className="text-xs text-gray-500">{maskEmail(seller?.email)}</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-50">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Amount</p>
                <p className="text-sm font-semibold">₦{order?.totalAmount?.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Payout: ₦{order?.paymentBreakdown?.sellerPayout?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-1 xl:grid-cols-3 w-full">
        <div className="xl:col-span-2 space-y-6">
          {/* Order Items - More subtle design */}
          <Card className="border border-gray-100 -sm bg-white">
            <CardHeader className="border-b border-gray-100 p-4">
              <CardTitle className="flex items-center gap-2 font-inter text-sm text-gray-700">
                <Box className="h-4 w-4 text-blue-500" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {items?.map((item) => (
                  <div key={item._id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="h-32 w-32 bg-white rounded-md overflow-hidden border border-gray-100 flex-shrink-0">
                        <img
                          src={item?.product?.images?.[0]?.url || "/placeholder.svg"}
                          alt={item?.product?.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="space-y-2">
                          <div>
                            <h3 className="text-sm font-medium line-clamp-2">{item?.product?.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs capitalize px-2 py-0.5">
                                <Box className="h-3 w-3 mr-1" />
                                {item?.product?.condition || 'New'}
                              </Badge>
                              {item?.product?.brand && (
                                <Badge variant="outline" className="text-xs capitalize px-2 py-0.5">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {item?.product?.brand}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-gray-600 line-clamp-2">{item?.product?.description}</p>

                          {/* Product Specifications */}
                          {item?.specifications && Object.values(item.specifications).some(value => value) && (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(item.specifications).map(([key, value]) => (
                                value && (
                                  <Badge key={key} variant="secondary" className="text-xs capitalize bg-gray-100 text-gray-700 hover:bg-gray-200">
                                    {key}: {value}
                                  </Badge>
                                )
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-end justify-between mt-2">
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">Seller: {item?.seller?.businessName || seller?.businessName}</p>
                            <p className="text-xs text-gray-500">SKU: {item?.product?.sku || 'N/A'}</p>
                          </div>

                          <div className="text-right space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">
                                ₦{item?.price?.toLocaleString()}
                              </p>
                              {item?.product?.discount?.isActive && (
                                <p className="text-xs line-through text-gray-400">
                                  ₦{(item?.price / (1 - item?.product?.discount?.value / 100))?.toLocaleString()}
                                </p>
                              )}
                            </div>
                            <p className="text-xs text-gray-600">
                              Quantity: {item?.quantity}
                            </p>
                            <Badge className={`mt-1 ${
                              item?.status === 'delivered' 
                                ? 'bg-green-100 text-green-700' 
                                : item?.status === 'cancelled'
                                ? 'bg-red-100 text-red-700'
                                : item?.status === 'processing'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-yellow-100 text-yellow-700'
                            } capitalize`}>
                              {item?.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timeline - More subtle design */}
          <Card className="border border-gray-100 -sm bg-white">
            <CardHeader className="border-b border-gray-100 p-4">
              <CardTitle className="flex items-center font-inter gap-2 text-sm xl:text-base text-gray-700">
                <Clock className="h-4 w-4 text-blue-500" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-6">
                {/* Always show Order Placed */}
                <div className="flex gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center -sm">
                      <ShoppingBag className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute top-8 bottom-0 left-1/2 w-0.5 -ml-[1px] bg-gray-200 h-full"></div>
                  </div>
                  <div className="flex-1 text-sm pb-6">
                    <p className="font-medium text-gray-800">Order Placed</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {order?.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Order #{order?.order_id} was created.</p>
                  </div>
                </div>

                {/* Show Order Paid if payment status is 'paid' */}
                {order?.paymentInfo?.status === 'paid' && (
                  <div className="flex gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center -sm">
                        <CreditCard className="w-4 h-4 text-white" />
                      </div>
                      <div className="absolute top-8 bottom-0 left-1/2 w-0.5 -ml-[1px] bg-gray-200 h-full"></div>
                    </div>
                    <div className="flex-1 text-sm pb-6">
                      <p className="font-medium text-gray-800">Payment Confirmed</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {order?.paymentInfo?.paidAt ? new Date(order.paymentInfo.paidAt).toLocaleString() : ''}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Payment of ₦{order?.totalAmount?.toLocaleString()} was received via {order?.paymentInfo?.method}.
                        {order?.paymentInfo?.transactionId && ` Transaction ID: ${order?.paymentInfo?.transactionId}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Show shipping tracking history if available */}
                {shipping?.tracking?.history?.length > 0 ? (
                  shipping?.tracking?.history?.map((event, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="relative">
                        <div className={`w-8 h-8 rounded-full ${
                          event?.status === 'delivered' 
                            ? 'bg-green-500' 
                            : event?.status === 'in_transit'
                            ? 'bg-blue-500'
                            : 'bg-yellow-500'
                        } flex items-center justify-center -sm`}>
                          {event?.status === 'delivered' ? (
                            <Check className="w-4 h-4 text-white" />
                          ) : event?.status === 'in_transit' ? (
                            <Truck className="w-4 h-4 text-white" />
                          ) : (
                            <Package className="w-4 h-4 text-white" />
                          )}
                        </div>
                        {index !== shipping.tracking.history.length - 1 && (
                          <div className="absolute top-8 bottom-0 left-1/2 w-0.5 -ml-[1px] bg-gray-200 h-full"></div>
                        )}
                      </div>
                      <div className="flex-1 text-sm pb-6">
                        <p className="font-medium text-gray-800 capitalize">{event?.status?.replace(/-/g, ' ')}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {event?.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
                        </p>
                        {event?.note && <p className="text-xs text-gray-500 mt-1">{event.note}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center -sm">
                        <Package className="w-4 h-4 text-white" />
                      </div>
                      {shipping?.estimatedDeliveryDate && (
                        <div className="absolute top-8 bottom-0 left-1/2 w-0.5 -ml-[1px] bg-gray-200 h-full"></div>
                      )}
                    </div>
                    <div className="flex-1 text-sm pb-6">
                      <p className="font-medium text-gray-800">Awaiting Shipment</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {shipping?.tracking?.status === 'pending' 
                          ? 'Order is awaiting pickup arrangement.' 
                          : 'Order is being prepared for shipment.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Expected Delivery if available */}
                {shipping?.estimatedDeliveryDate && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center -sm">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-gray-800">Expected Delivery</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(shipping.estimatedDeliveryDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Estimated delivery date via {shipping?.carrier?.name || "Standard Shipping"}.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Price Breakdown */}
          <Card className="border border-gray-100 -sm bg-white">
            <CardHeader className="border-b border-gray-100 p-4">
              <CardTitle className="flex items-center gap-2 font-inter text-sm text-gray-700">
                <DollarSign className="h-4 w-4 text-blue-500" />
                Payment Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {/* Order Summary */}
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Order Summary</h3>
                  
                  {/* Order Items Breakdown */}
                  <div className="space-y-2">
                    {order?.paymentBreakdown?.items?.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600 truncate pr-4">{item.productName}</span>
                        <span className="font-medium">₦{item.amount.toLocaleString()}</span>
                      </div>
                    ))}

                    {/* Delivery Fee (if exists) */}
                    {shipping?.fee?.amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span className="text-gray-600">₦{shipping.fee.amount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Platform Fees */}
                <div className="p-4 bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Fees & Deductions</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                          <path d="M3 3v18h18"/>
                          <path d="M18 9l-6-6-6 6"/>
                          <path d="M6 10l6-6 6 6"/>
                        </svg>
                        <span>Platform Fee ({order?.paymentBreakdown?.items?.[0]?.platformFeePercentage}%)</span>
                      </div>
                      <span className="text-red-600">-₦{order?.paymentBreakdown?.fees?.totalPlatformFee?.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between text-gray-600">
                      <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                          <line x1="1" y1="10" x2="23" y2="10"></line>
                        </svg>
                        <span>Payment Processing ({order?.paymentBreakdown?.fees?.processingFeePercentage}%)</span>
                      </div>
                      <span className="text-red-600">-₦{order?.paymentBreakdown?.fees?.processingFee?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Total Calculations */}
                <div className="p-4">
                  <div className="space-y-3">
                    {/* Total Deductions */}
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-700">Total Deductions</span>
                      <span className="text-red-600">-₦{order?.paymentBreakdown?.fees?.totalDeductions?.toLocaleString()}</span>
                    </div>

                    {/* Seller Payout */}
                    <div className="flex justify-between text-base font-inter font-semibold bg-green-50 p-3 rounded-md">
                      <span>Your Payout</span>
                      <span className="text-green-700">₦{order?.paymentBreakdown?.sellerPayout?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method Info */}
                <div className="p-4 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-full ${
                      order?.paymentInfo?.status === 'paid' 
                        ? 'bg-green-100' 
                        : order?.paymentInfo?.status === 'failed'
                        ? 'bg-red-100' 
                        : 'bg-yellow-100'
                    }`}>
                      <CreditCard className={`h-4 w-4 ${
                        order?.paymentInfo?.status === 'paid' 
                          ? 'text-green-600' 
                          : order?.paymentInfo?.status === 'failed'
                          ? 'text-red-600' 
                          : 'text-yellow-600'
                      }`} />
                    </div>
                    <div>
                      <Badge className={getStatusColor(order?.paymentInfo?.status)}>
                        {order?.paymentInfo?.status === 'awaiting_cod' ? 'Payment on Delivery' : order?.paymentInfo?.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {order?.paymentInfo?.method ? `via ${order?.paymentInfo?.method}` : ''}
                        {order?.paymentInfo?.transactionId ? ` • Ref: ${order?.paymentInfo?.transactionId}` : ''}
                      </p>
                    </div>
                  </div>
                  
                  {order?.paymentInfo?.paidAt && (
                    <div className="text-xs flex items-center gap-1 text-gray-500">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(order.paymentInfo.paidAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 w-full">
          {/* Addresses */}
          <Card className="border w-full border-gray-100 -sm bg-white">
            <CardHeader className="border-b border-gray-100 p-4">
              <CardTitle className="flex items-center gap-2 font-inter text-sm text-gray-700">
                <MapPin className="h-4 w-4 text-blue-500" />
                Delivery & Pickup Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              {/* Delivery Address */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h3 className="font-inter font-semibold mb-3 flex items-center gap-2 text-gray-800">
                  <MapPin className="h-4 w-4 text-green-600" />
                  Delivery Address
                </h3>
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <p className="font-medium text-gray-800">
                      {addresses?.delivery?.first_name} {addresses?.delivery?.last_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-700">{maskPhoneNumber(addresses?.delivery?.phone)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-700">{maskEmail(addresses?.delivery?.email)}</p>
                  </div>
                  <div className="pl-6 text-gray-700 space-y-1 mt-2">
                    <p>{addresses?.delivery?.line1}</p>
                    {addresses?.delivery?.line2 && <p>{addresses?.delivery?.line2}</p>}
                    <p>
                      {addresses?.delivery?.city && `${addresses?.delivery?.city}, `}
                      {addresses?.delivery?.state} {addresses?.delivery?.zip}
                    </p>
                    <p>{addresses?.delivery?.country === 'NG' ? 'Nigeria' : addresses?.delivery?.country}</p>
                  </div>
                </div>
              </div>

              {/* Pickup Address */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h3 className="font-inter font-semibold mb-3 flex items-center gap-2 text-gray-800">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  Warehouse/Pickup Location
                </h3>
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <Box className="h-4 w-4 text-gray-400" />
                    <p className="font-medium text-gray-800">
                      {items[0]?.product?.seller?.warehouseDetails?.name || "Main Warehouse"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-700">{maskPhoneNumber(items[0]?.product?.seller?.warehouseDetails?.contactNumber)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-700">{items[0]?.product?.seller?.businessName}</p>
                  </div>
                  <div className="pl-6 text-gray-700 space-y-1 mt-2">
                    <p>{items[0]?.product?.seller?.warehouseDetails?.address?.addressLine1}</p>
                    {items[0]?.product?.seller?.warehouseDetails?.address?.addressLine2 && (
                      <p>{items[0]?.product?.seller?.warehouseDetails?.address?.addressLine2}</p>
                    )}
                    <p>
                      {items[0]?.product?.seller?.warehouseDetails?.address?.city}, 
                      {items[0]?.product?.seller?.warehouseDetails?.address?.state} 
                      {items[0]?.product?.seller?.warehouseDetails?.address?.zipCode && 
                        ` ${items[0]?.product?.seller?.warehouseDetails?.address?.zipCode}`}
                    </p>
                    <p>{items[0]?.product?.seller?.warehouseDetails?.address?.country}</p>
                  </div>
                </div>
              </div>

              {/* Shipping Method Summary */}
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Truck className="h-4 w-4 text-blue-500" />
                  <p>Shipping via {shipping?.carrier?.name || "Standard Shipping"}</p>
                </div>
                {order?.paymentInfo?.status === 'paid' && (
                  <div className="flex items-center gap-2 text-sm mt-2 text-gray-700">
                    <Check className="h-4 w-4 text-green-500" />
                    <p>Payment confirmed on {new Date(order?.paymentInfo?.paidAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Status */}
          <Card className="border border-gray-100 -sm bg-white">
            <CardHeader className="border-b border-gray-100 p-4">
              <CardTitle className="flex items-center font-inter gap-2 text-sm text-gray-700">
                <Truck className="h-4 w-4 text-blue-500" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              {/* Shipping Status Banner */}
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                shipping?.tracking?.status === 'delivered' 
                  ? 'bg-green-50 border border-green-100' 
                  : shipping?.tracking?.status === 'in_transit'
                  ? 'bg-blue-50 border border-blue-100'
                  : 'bg-yellow-50 border border-yellow-100'
              }`}>
                <div className={`p-2 rounded-full ${
                  shipping?.tracking?.status === 'delivered' 
                    ? 'bg-green-100' 
                    : shipping?.tracking?.status === 'in_transit'
                    ? 'bg-blue-100'
                    : 'bg-yellow-100'
                }`}>
                  {shipping?.tracking?.status === 'delivered' ? (
                    <Check className={`h-5 w-5 text-green-600`} />
                  ) : shipping?.tracking?.status === 'in_transit' ? (
                    <Truck className={`h-5 w-5 text-blue-600`} />
                  ) : (
                    <Clock className={`h-5 w-5 text-yellow-600`} />
                  )}
                </div>
                <div>
                  <p className={`font-medium capitalize ${
                    shipping?.tracking?.status === 'delivered' 
                      ? 'text-green-700' 
                      : shipping?.tracking?.status === 'in_transit'
                      ? 'text-blue-700'
                      : 'text-yellow-700'
                  }`}>
                    {shipping?.tracking?.status?.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm text-gray-600">
                    Last updated: {shipping?.tracking?.history?.length > 0 
                      ? new Date(shipping.tracking.history[shipping.tracking.history.length - 1].timestamp).toLocaleString() 
                      : new Date().toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Add discount information if available */}
              {items[0]?.product?.discount?.isActive && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
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

              {/* Shipping Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Carrier Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Truck className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Carrier</p>
                        <p className="text-sm font-medium">{shipping?.carrier?.name || "Standard Shipping"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Tag className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Carrier Reference</p>
                        <p className="text-sm font-medium">{shipping?.carrier?.reference || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Box className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Shipment ID</p>
                        <p className="text-sm font-medium">{shipping?.shipment_id || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Tracking Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Package className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Tracking Number</p>
                        <p className="text-sm font-medium">{shipping?.tracking?.number || "Not available yet"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Estimated Delivery</p>
                        <p className="text-sm font-medium">
                          {shipping?.estimatedDeliveryDate ? 
                            new Date(shipping.estimatedDeliveryDate).toLocaleDateString() : 'Not available yet'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Shipping Fee</p>
                        <p className="text-sm font-medium">
                          ₦{shipping?.fee?.amount?.toLocaleString() || "0"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Documents */}
              {(shipping?.documents?.shippingLabel || shipping?.documents?.commercialInvoice) && (
                <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
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
                  <div className="flex flex-col md:flex-row gap-2">
                    {shipping.documents.shippingLabel && (
                      <Button
                        className="flex-1 flex items-center font-inter bg-gray-800 hover:bg-gray-900 transition-all duration-300 justify-center gap-2"
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
                        className="flex-1 flex items-center font-inter justify-center gap-2 border-gray-200 hover:bg-gray-50"
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
