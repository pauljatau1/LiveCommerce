import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Check, ChevronDown, Truck, Package, MapPin, AlertCircle, Clock, CreditCard, DollarSign, ShoppingBag, User, Building2, Phone, Mail, Calendar, Box, Tag, ArrowUpRight, XCircle, Loader2, MessageSquare } from 'lucide-react'
import { Badge } from "@/Components/ui/badge"
import { Hash } from 'lucide-react'
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Separator } from "@/Components/ui/separator"
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/Components/ui/dialog"
import Loader from '@/Components/Loader'
import { BASE_URL, BASE_URL_V2 } from '@/Constants/Server'
import { useOutletContext } from 'react-router-dom'

export default function OrderDetails() {
  const { setHeaderName, setNavName } = useOutletContext()
  const { id } = useParams()
  const [orderData, setOrderData] = useState(null)
  const [sellerProfile, setSellerProfile] = useState(null)
  const [isInternationalSeller, setIsInternationalSeller] = useState(false)
  const [loading, setLoading] = useState(true)
  const [arrangePickupLoading, setArrangePickupLoading] = useState(false)
  const [orderStatus, setOrderStatus] = useState(null)
  const [deliveryEstimate, setDeliveryEstimate] = useState(null)
  const [orderNotFound, setOrderNotFound] = useState(false)
  const [confirmDeliveryLoading, setConfirmDeliveryLoading] = useState(false)
  const [proofUploadDialogOpen, setProofUploadDialogOpen] = useState(false)
  const [proofImage, setProofImage] = useState(null)
  const [proofNote, setProofNote] = useState('')
  const navigate = useNavigate()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)
  const [confirmCancelDialogOpen, setConfirmCancelDialogOpen] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  
  // International seller tracking form states
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('')
  const [updatingTracking, setUpdatingTracking] = useState(false)
  
  // International seller status update form states
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [shippingStatus, setShippingStatus] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    setHeaderName('Order')
    setNavName('Orders Details')
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sellerToken = localStorage.getItem('sellerToken')
        if (sellerToken) {
          const tokenData = JSON.parse(sellerToken)
          const token = tokenData.data
          
          // Fetch order details
          const orderResponse = await fetch(`${BASE_URL}/order/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (!orderResponse.ok) {
            setOrderNotFound(true)
            return
          }
          
          const orderResult = await orderResponse.json()
          if (!orderResult || orderResult.error || !orderResult.order) {
            setOrderNotFound(true)
            return
          }
          
          setOrderData(orderResult)
          setOrderStatus(orderResult.orderStatus)
          
          // Fetch seller profile
          const profileResponse = await fetch(`${BASE_URL_V2}/sellers/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          const profileResult = await profileResponse.json()
          setSellerProfile(profileResult.data)

          // Check if seller is international
          if (profileResult && profileResult.data.isInternational) {
            setIsInternationalSeller(true)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setOrderNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  useEffect(() => {
    const fetchDeliveryEstimate = async () => {
      try {
        if (orderData?.addresses?.delivery?.state && orderData?.items?.[0]?.product?.seller?.warehouseDetails?.address?.state) {
          const response = await fetch(`${BASE_URL}/order/delivery-time-estimate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              delivery_type: 'import',
              pick_up_state: orderData.items[0].product.seller.warehouseDetails.address.state,
              drop_off_state: orderData.addresses.delivery.state
            })
          });
          
          const data = await response.json();
          if (data.status === 'success') {
            setDeliveryEstimate(data.estimate);
          }
        }
      } catch (error) {
        console.error('Error fetching delivery estimate:', error);
      }
    };

    if (orderData) {
      fetchDeliveryEstimate();
    }
  }, [orderData]);

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

  const handleProofUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB')
        return
      }
      setProofImage(file)
    }
  }

  const confirmDelivery = async (orderId, proofImage, note) => {
    const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
  
    try {
      setIsConfirming(true);
      setConfirmDeliveryLoading(true);
  
      const formData = new FormData();
      formData.append('proofOfDelivery', proofImage);
      if (note) formData.append('notes', note);
  
      const response = await fetch(`${BASE_URL}/pickup/${orderId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sellerToken}`
        },
        body: formData,
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to confirm pickup');
      }
  
      toast.success('Pickup confirmed successfully');
      
      // Close the dialog
      setProofUploadDialogOpen(false);
      
      // Fetch updated order details to refresh the status
      const updatedOrderResponse = await fetch(`${BASE_URL}/order/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${sellerToken}`
        }
      });
      
      if (updatedOrderResponse.ok) {
        const updatedOrder = await updatedOrderResponse.json();
        setOrderData(updatedOrder);
      } else {
        // If we can't fetch the updated order, just reload the page
        window.location.reload();
      }
    } catch (error) {
      console.error('Error confirming pickup:', error);
      toast.error(error.message || 'Failed to confirm pickup');
    } finally {
      setIsConfirming(false);
      setConfirmDeliveryLoading(false);
    }
  };
  

  const printDocument = (url, documentType) => {
    // Open document in new window/tab
    window.open(url, `_blank${documentType}`);
  };

  // Add function to get manifest URL
  const getManifestUrl = async () => {
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const response = await fetch(`${BASE_URL}/order/${shipping?.tracking?.number}/manifest-url`, {
        headers: {
          'Authorization': `Bearer ${sellerToken}`
        }
      });
      
      const data = await response.json();
      if (data.status === 'Success' && data.data?.url) {
        window.open(data.data.url, '_blank');
      } else {
        toast.error('Failed to get manifest URL');
      }
    } catch (error) {
      console.error('Error getting manifest URL:', error);
      toast.error('Failed to get manifest URL');
    }
  };

  // Add function to update tracking information for international sellers
  const updateTrackingInformation = async () => {
    if (!trackingNumber) {
      toast.error('Tracking number is required');
      return;
    }

    setUpdatingTracking(true);
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const response = await fetch(`${BASE_URL}/seller/international/orders/${id}/tracking`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sellerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trackingNumber,
          trackingUrl: trackingUrl || undefined,
          estimatedDeliveryDate: estimatedDeliveryDate || undefined
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update tracking information');
      }

      toast.success('Tracking information updated successfully');
      setTrackingDialogOpen(false);
      
      // Refresh order details
      const updatedOrderResponse = await fetch(`${BASE_URL}/order/${id}`, {
        headers: {
          'Authorization': `Bearer ${sellerToken}`
        }
      });
      
      if (updatedOrderResponse.ok) {
        const updatedOrder = await updatedOrderResponse.json();
        setOrderData(updatedOrder);
      }
    } catch (error) {
      console.error('Error updating tracking information:', error);
      toast.error(error.message || 'Failed to update tracking information');
    } finally {
      setUpdatingTracking(false);
    }
  };

  // Add function to update order status for international sellers
  const updateOrderStatus = async () => {
    if (!shippingStatus) {
      toast.error('Please select a status');
      return;
    }

    setUpdatingStatus(true);
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const response = await fetch(`${BASE_URL}/seller/international/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sellerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: shippingStatus
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update order status');
      }

      toast.success('Order status updated successfully');
      setStatusDialogOpen(false);
      
      // Refresh order details
      const updatedOrderResponse = await fetch(`${BASE_URL}/order/${id}`, {
        headers: {
          'Authorization': `Bearer ${sellerToken}`
        }
      });
      
      if (updatedOrderResponse.ok) {
        const updatedOrder = await updatedOrderResponse.json();
        setOrderData(updatedOrder);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Add this helper function to check if order is cancellable
  const isOrderCancellable = (order) => {
    // Check if order exists and has items
    if (!order || !order.items) return false;
    
    // Check if payment status is paid
    const isPaymentPaid = order?.paymentInfo?.status === 'paid';
    
    // Check if shipping status is pending (handle different formats of "pending")
    const shippingStatus = order.shipping?.tracking?.status?.toLowerCase() || '';
    const isShippingPending = shippingStatus === 'pending' || shippingStatus.includes('pending');
    
    // Check if all items are in pending status and none are cancelled
    const areItemsPending = order.items.every(item => item.status?.toLowerCase() === 'pending');
    const isAnyCancelled = order.items.some(item => item.status?.toLowerCase() === 'cancelled');
    
    // Debug logs
    console.log('Order cancellable check:', {
      isPaymentPaid,
      isShippingPending,
      areItemsPending,
      isAnyCancelled,
      paymentStatus: order?.paymentInfo?.status,
      shippingStatus: order.shipping?.tracking?.status,
      formattedShippingStatus: shippingStatus,
      itemStatuses: order.items.map(item => item.status)
    });
    
    // Order can be cancelled if payment is paid, shipping is pending, all items are pending, and none are cancelled
    return isPaymentPaid && isShippingPending && areItemsPending && !isAnyCancelled;
  };

  // Update the handleCancelOrder function
  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    // if (!isOrderCancellable(orderData)) {
    //   toast.error('This order cannot be cancelled');
    //   setCancelDialogOpen(false);
    //   return;
    // }

    setCancelLoading(true);
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const response = await fetch(`${BASE_URL}/v2/order/${id}/cancel-by-seller`, {
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

  // Handle message customer click
  const handleMessageClick = () => {
    if (!orderData?.buyer) return;
    
    navigate('/dashboard/messages', {
      state: {
        customerId: orderData.buyer._id,
        customerName: `${orderData.buyer.firstName} ${orderData.buyer.lastName}`,
        customerEmail: orderData.buyer.email,
        openChatWithCustomer: true // Flag to indicate we want to open a chat with this customer
      }
    });
  };

  if (loading) return <Loader />
  
  if (orderNotFound) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="bg-amber-50 rounded-full p-5 mb-6">
          <AlertCircle className="h-12 w-12 text-amber-500" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Order Not Found</h1>
        <p className="text-gray-600 text-center max-w-md mb-8">
          We couldn't find the order you're looking for. It may have been deleted or the order ID might be incorrect.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            variant="outline"
            onClick={() => navigate('/dashboard/orders')}
            className="flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12 19-7-7 7-7"/>
              <path d="M19 12H5"/>
            </svg>
            Back to Orders
          </Button>
          <Button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M8 16H3v5"/>
            </svg>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!orderData) return null

  const { order, buyer, seller, items, shipping, addresses, timeline } = orderData
  console.log('orderData', orderData)
  console.log('sellerProfile', sellerProfile)

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 hover:bg-yellow-200 capitalize transition-all duration-300 text-yellow-700',
      completed: 'bg-green-100 hover:bg-green-200 capitalize transition-all duration-300 text-green-700',
      paid: 'bg-green-100 hover:bg-green-200 capitalize transition-all duration-300 text-green-700',
      failed: 'bg-red-100 hover:bg-red-200 capitalize transition-all duration-300 text-red-700',
      abandoned: 'bg-orange-100 hover:bg-orange-200 capitalize transition-all duration-300 text-orange-800'
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
    <div className="container mx-auto sm:px-6 py-6 sm:py-10 space-y-4 sm:space-y-6 min-h-screen">
      {/* Order Header - More subtle design */}
      <Card className="border border-gray-100 -sm bg-white overflow-hidden">
        <div className={`${order?.isStale ? 'bg-gradient-to-r from-orange-50/90 to-orange-100/90' : order?.isStorePickup ? 'bg-gradient-to-r from-purple-50/90 to-purple-100/90' : 'bg-gradient-to-r from-green-50/90 to-green-100/90'} p-4 sm:p-6 text-gray-800`}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className={`bg-white p-2 rounded-full -sm ${order?.isStale ? 'text-orange-600' : order?.isStorePickup ? 'text-purple-600' : 'text-green-600'}`}>
                    {order?.isStale ? (
                      <XCircle className="h-5 w-5" />
                    ) : (
                      <ShoppingBag className="h-5 w-5" />
                    )}
                  </div>
                  <h1 className="text-lg sm:text-xl font-inter font-semibold">Order #{order?.order_id}</h1>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-blue-600 capitalize px-3 py-1 rounded-lg text-white border-white/10 text-xs">
                      {order?.channel}
                    </Badge>
                    {order?.isStale ? (
                      <Badge variant="outline" className="bg-orange-600 capitalize px-3 py-1 rounded-lg text-white border-white/10 text-xs">
                        Abandoned
                      </Badge>
                    ) : (
                      <Badge variant="outline" className={`${orderData?.order?.orderStatus?.isOpen ? 'bg-green-600' : 'bg-gray-600'} capitalize px-3 py-1 rounded-lg text-white border-white/10 text-xs`}>
                        {orderData?.order?.orderStatus?.isOpen ? 'Open' : 'Closed'}
                      </Badge>
                    )}
                    {order?.isStorePickup && (
                      <Badge variant="outline" className="bg-purple-600 capitalize px-3 py-1 rounded-lg text-white border-white/10 text-xs">
                        Store Pickup
                      </Badge>
                    )}
                    {orderData?.order?.orderStatus?.hasReturn && (
                      <Badge variant="outline" className="bg-orange-600 capitalize px-3 py-1 rounded-lg text-white border-white/10 text-xs">
                        Return Requested
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-gray-700">
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

              {/* Abandoned order warning message */}
              {order?.isStale && (
                <div className="bg-orange-100 border border-orange-200 rounded-md p-3 text-orange-800 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Order Abandoned</p>
                      <p>This order was abandoned by the buyer who did not complete payment. No action is required from you.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                {/* Message Customer Button - Always show if order is not stale */}
                {!order?.isStale && (
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto bg-green-600 text-white flex items-center font-inter justify-center gap-2 border-gray-200 hover:bg-green-700"
                    onClick={handleMessageClick}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Message Customer
                  </Button>
                )}
                
                {/* {!order?.isStale && !order?.isStorePickup && order?.paymentInfo?.status === 'paid' && (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto bg-blue-600 text-white flex items-center font-inter justify-center gap-2 border-gray-200 hover:bg-blue-700"
                    onClick={getManifestUrl}
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
                      className="text-white"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Print Shipping Label
                  </Button>
                )} */}
                {!order?.isStale && order?.isStorePickup && (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto bg-purple-600 text-white flex items-center font-inter justify-center gap-2 border-gray-200 hover:bg-purple-700"
                    onClick={() => setProofUploadDialogOpen(true)}
                    disabled={confirmDeliveryLoading || 
                             order?.storePickupStatus?.state === 'approved' || 
                             order?.storePickupStatus?.state === 'confirmed_by_seller'}
                  >
                    {confirmDeliveryLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Confirming...
                      </>
                    ) : order?.storePickupStatus?.state === 'approved' ? (
                      <>
                        <Check className="w-4 h-4" />
                        Pickup Approved
                      </>
                    ) : order?.storePickupStatus?.state === 'confirmed_by_seller' ? (
                      <>
                        <Clock className="w-4 h-4" />
                        Awaiting Approval
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Confirm Pickup
                      </>
                    )}
                  </Button>
                )}
                {!order?.isStale && orderData?.order?.orderStatus?.hasReturn && (
                  <Button
                    onClick={() => navigate(`/dashboard/return/${orderData.order.orderStatus.returnRequestId}`)}
                    size="lg"
                    className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 capitalize transition-all duration-300 text-white text-sm h-10"
                  >
                    <ArrowUpRight className="mr-2 h-3 w-3" />
                    View Return Request
                  </Button>
                )}


              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-1">
              <Badge className={`${order?.isStale ? getStatusColor('abandoned') : getStatusColor(order?.paymentInfo?.status)} px-3 py-1.5 rounded-md text-xs`}>
                <CreditCard className="h-3 w-3 mr-1" />
                Payment: {order?.isStale ? 'abandoned' : order?.paymentInfo?.status === 'awaiting_cod' ? 'On Delivery' : order?.paymentInfo?.status}
              </Badge>
              <Badge className={`${order?.isStale ? getStatusColor('abandoned') : getStatusColor(shipping?.tracking?.status)} px-3 py-1.5 rounded-md text-xs`}>
                <Truck className="h-3 w-3 mr-1" />
                Shipping: {order?.isStale ? 'abandoned' : shipping?.tracking?.status?.replace(/_/g, ' ')}
              </Badge>
              {order?.isStorePickup && (
                <Badge className={`${
                  order?.storePickupStatus?.state === 'approved' 
                    ? 'bg-green-100 text-green-700' 
                    : order?.storePickupStatus?.state === 'confirmed_by_seller'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-yellow-100 text-yellow-700'
                } px-3 py-1.5 rounded-md text-xs`}>
                  <MapPin className="h-3 w-3 mr-1" />
                  Pickup Status: {order?.storePickupStatus?.state === 'confirmed_by_seller' 
                    ? 'Waiting Approval' 
                    : order?.storePickupStatus?.state?.replace(/_/g, ' ')}
                </Badge>
              )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
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

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-3 w-full">
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
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="h-32 w-32 mx-auto sm:mx-0 bg-white rounded-md overflow-hidden border border-gray-100 flex-shrink-0">
                        <img
                          src={item?.product?.images?.[0]?.url || "/placeholder.svg"}
                          alt={item?.product?.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="space-y-2">
                          <div className="text-center sm:text-left">
                            <h3 className="text-sm font-medium line-clamp-2">{item?.product?.name}</h3>
                            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mt-1">
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

                          <div className="text-xs text-gray-600 line-clamp-2 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: item?.product?.description || '' }}>
                          </div>

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

                {/* Show Order Abandoned if order is stale */}
                {order?.isStale && (
                  <div className="flex gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center -sm">
                        <XCircle className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 text-sm pb-6">
                      <p className="font-medium text-gray-800">Order Abandoned</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {/* Use a calculated date for abandoned (e.g. a few hours after creation) */}
                        {order?.createdAt ? new Date(new Date(order.createdAt).getTime() + 24 * 60 * 60 * 1000).toLocaleString() : ''}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Buyer abandoned the order without completing payment. No further action is required.
                      </p>
                    </div>
                  </div>
                )}

                {/* Show Order Paid if payment status is 'paid' */}
                {!order?.isStale && order?.paymentInfo?.status === 'paid' && (
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

                {/* Show store pickup confirmation if applicable */}
                {order?.isStorePickup && order?.storePickupStatus?.state === 'confirmed_by_seller' && (
                  <div className="flex gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center -sm">
                        <Package className="w-4 h-4 text-white" />
                      </div>
                      <div className="absolute top-8 bottom-0 left-1/2 w-0.5 -ml-[1px] bg-gray-200 h-full"></div>
                    </div>
                    <div className="flex-1 text-sm pb-6">
                      <p className="font-medium text-gray-800">Pickup Confirmed by Seller</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {order?.storePickupStatus?.confirmedAt ? new Date(order.storePickupStatus.confirmedAt).toLocaleString() : ''}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Seller has confirmed the pickup and is awaiting admin approval.
                      </p>
                    </div>
                  </div>
                )}

                {/* Show store pickup approval if applicable */}
                {order?.isStorePickup && order?.storePickupStatus?.state === 'approved' && (
                  <div className="flex gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center -sm">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div className="absolute top-8 bottom-0 left-1/2 w-0.5 -ml-[1px] bg-gray-200 h-full"></div>
                    </div>
                    <div className="flex-1 text-sm pb-6">
                      <p className="font-medium text-gray-800">Pickup Approved</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {order?.storePickupStatus?.approvedAt ? new Date(order.storePickupStatus.approvedAt).toLocaleString() : ''}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Admin has approved the pickup confirmation. Order is complete.
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
                  !order?.isStorePickup && (
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
                  )
                )}

                {/* Expected Delivery if available */}
                {shipping?.estimatedDeliveryDate && !order?.isStorePickup && (
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

          {/* Enhanced Shipping Details - Moved here for better layout */}
          {!order?.isStorePickup && !order?.isStale && (
            <Card className="border border-gray-100 shadow-sm bg-white">
              <CardHeader className="border-b border-gray-100 p-4">
                <CardTitle className="flex items-center font-inter gap-2 text-sm xl:text-base text-gray-700">
                  <Truck className="h-4 w-4 text-blue-500" />
                  Shipping Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-6">
                {/* Carrier Information */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <Truck className="h-4 w-4 text-blue-600" />
                    </div>
                    Carrier Information
                  </h4>
                  <div className="space-y-4">
                  
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Truck className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Carrier</p>
                          <p className="text-xs text-gray-500">Shipping provider</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{shipping?.carrier?.name || "Standard Shipping"}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                          <Tag className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Reference</p>
                          <p className="text-xs text-gray-500">Carrier reference number</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{shipping?.carrier?.reference || "N/A"}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 rounded-lg">
                          <Hash className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Shipment ID</p>
                          <p className="text-xs text-gray-500">Unique shipment identifier</p>
                        </div>
                      </div>
                      <span className="text-sm font-mono bg-gray-100 px-3 py-1 rounded-full text-gray-800">
                        {shipping?.shipment_id || "N/A"}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg">
                          <Package className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Tracking Number</p>
                          <p className="text-xs text-gray-500">Track your shipment</p>
                        </div>
                      </div>
                      <span className="text-sm font-mono bg-gray-100 px-3 py-1 rounded-full text-gray-800">
                        {shipping?.tracking?.number || "Generating..."}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    Delivery Information
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Estimated Pickup</p>
                          <p className="text-xs text-gray-500">When carrier picks up</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">
                        {shipping?.estimatedPickupDate || 'Processing...'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                          <Calendar className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Estimated Delivery</p>
                          <p className="text-xs text-gray-500">When buyer receives</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">
                        {deliveryEstimate ? 
                          `${deliveryEstimate}` : 
                          shipping?.estimatedDeliveryDate || 
                          'Calculating...'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                          <DollarSign className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Shipping Fee</p>
                          <p className="text-xs text-gray-500">Delivery cost</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        ₦{shipping?.fee?.amount?.toLocaleString() || "0"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Discount Information */}
                {items[0]?.product?.discount?.isActive && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-l-4 border-green-500">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Tag className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-800">Applied Discount</h4>
                        <p className="text-sm text-green-700">Special savings applied to this order</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {items[0].product.discount.couponName && (
                        <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg">
                          <span className="text-sm font-medium text-green-700">Coupon Code</span>
                          <span className="text-sm font-semibold text-green-800 bg-green-200 px-3 py-1 rounded-full">
                            {items[0].product.discount.couponName}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg">
                        <span className="text-sm font-medium text-green-700">Discount Rate</span>
                        <span className="text-sm font-semibold text-green-800">
                          {items[0].product.discount.value}% off
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg">
                        <span className="text-sm font-medium text-green-700">You Saved</span>
                        <span className="text-sm font-semibold text-green-800">
                          ₦{(items[0].price / (1 - items[0].product.discount.value / 100) - items[0].price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span className="flex items-center gap-2">
                          <span className="text-gray-600 line-through">₦{shipping.fee.amount.toLocaleString()}</span>
                          <Badge className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">Free</Badge>
                        </span>
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
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                        </svg>
                        <span>VAT (7.5% of commission)</span>
                      </div>
                      <span className="text-red-600">
                        -₦{(order?.paymentBreakdown?.fees?.totalPlatformFee * 0.075)?.toLocaleString()}
                      </span>
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
          {/* Order Actions */}
          {!order?.isStale && (
            <Card className="border w-full border-gray-100 shadow-sm bg-white">
              <CardHeader className="border-b border-gray-100 p-4">
                <CardTitle className="flex items-center gap-2 font-inter text-sm text-gray-700">
                  <div className="p-1.5 bg-orange-100 rounded-lg">
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
                      className="text-orange-600"
                    >
                      <polyline points="3,6 5,6 21,6"></polyline>
                      <path d="M19,6V20a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6M8,6V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2V6"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </div>
                  Order Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Cancel Order Section */}
                {order?.paymentInfo?.status === 'paid' && 
                 (shipping?.tracking?.status === 'pending' || 
                  shipping?.tracking?.status?.toLowerCase()?.includes('pending')) && 
                 items?.every(item => item.status?.toLowerCase() === 'pending' || !item.status) && 
                 !items?.some(item => item.status?.toLowerCase() === 'cancelled') ? (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                        <XCircle className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-800 mb-2">Cancel Order</h4>
                        <p className="text-sm text-red-700 mb-3">
                          Cancel this order and refund the customer. This action cannot be undone.
                        </p>
                        <Button
                          onClick={() => setConfirmCancelDialogOpen(true)}
                          variant="destructive"
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel Order
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : order?.paymentInfo?.status === 'paid' && 
                   ((shipping?.tracking?.status !== 'pending' && 
                     !shipping?.tracking?.status?.toLowerCase()?.includes('pending')) ||
                    !items?.every(item => item.status?.toLowerCase() === 'pending' || !item.status) ||
                    items?.some(item => item.status?.toLowerCase() === 'cancelled')) ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-1">Order In Progress</h4>
                        <p className="text-sm text-gray-600">
                          This order is already being processed and cannot be cancelled. Please contact support if you need assistance.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : order?.paymentInfo?.status !== 'paid' ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-700 mb-1">Payment Pending</h4>
                        <p className="text-sm text-blue-600">
                          Order actions will be available once payment is confirmed.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
          
          {/* International Seller Controls */}
          {isInternationalSeller && (
            <Card className="border w-full border-blue-200 shadow-sm bg-white">
              <CardHeader className="border-b border-blue-100 p-4">
                <CardTitle className="flex items-center gap-2 font-inter text-sm text-blue-700">
                  <Truck className="h-4 w-4 text-blue-500" />
                  International Order Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setTrackingDialogOpen(true)}
                >
                  Update Tracking Information
                </Button>
                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() => setStatusDialogOpen(true)}
                >
                  Update Order Status
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Addresses */}
          <Card className="border w-full border-gray-100 -sm bg-white">
            <CardHeader className="border-b border-gray-100 p-4">
              <CardTitle className="flex items-center gap-2 font-inter text-sm text-gray-700">
                <MapPin className="h-4 w-4 text-blue-500" />
                {order?.isStorePickup ? 'Store Pickup Information' : 'Delivery & Pickup Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              {/* Only show Delivery Address if not store pickup */}
              {!order?.isStorePickup && addresses?.delivery && (
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
              )}

              {/* Store/Pickup Location - Enhanced for store pickup */}
              <div className={`${order?.isStorePickup ? 'bg-purple-50 border-purple-100' : 'bg-gray-50 border-gray-100'} rounded-lg p-4 border`}>
                <h3 className="font-inter font-semibold mb-3 flex items-center gap-2 text-gray-800">
                  <Building2 className={`h-4 w-4 ${order?.isStorePickup ? 'text-purple-600' : 'text-blue-600'}`} />
                  {order?.isStorePickup ? 'Store Pickup Location' : 'Warehouse/Pickup Location'}
                </h3>
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <Box className="h-4 w-4 text-gray-400" />
                    <p className="font-medium text-gray-800">
                      {sellerProfile?.storeName || "Main Warehouse"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-700">{maskPhoneNumber(sellerProfile?.phoneNumber)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-700">{sellerProfile?.storeName || seller?.businessName}</p>
                  </div>
                  <div className="pl-6 text-gray-700 space-y-1 mt-2">
                    <p>{sellerProfile?.sellerAddress?.addressLine1}</p>
                    {sellerProfile?.sellerAddress?.addressLine2 && (
                      <p>{sellerProfile?.sellerAddress?.addressLine2}</p>
                    )}
                    <p>
                      {sellerProfile?.sellerAddress?.city}, 
                      {sellerProfile?.sellerAddress?.state} 
                      {sellerProfile?.sellerAddress?.zipCode && 
                        ` ${sellerProfile?.sellerAddress?.zipCode}`}
                    </p>
                    <p>{sellerProfile?.sellerAddress?.country}</p>
                  </div>
                </div>
              </div>

              {/* Only show shipping method summary if not store pickup */}
              {!order?.isStorePickup && !isInternationalSeller && (
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
              )}
            </CardContent>
          </Card>

         
          {/* Shipping Documents and Actions - Only show if documents exist */}
          {!order?.isStorePickup && !order?.isStale && (shipping?.documents?.shippingLabel || shipping?.documents?.commercialInvoice) && order?.paymentInfo?.status === 'paid' && (
            <Card className="border border-gray-100 shadow-sm bg-white">
              <CardHeader className="border-b border-gray-100 p-0">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4">
                  <CardTitle className="flex items-center font-inter gap-2 text-base text-gray-800">
                    <div className="p-2 bg-purple-500 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                      </svg>
                    </div>
                    Shipping Documents
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Download and print your shipping documents</p>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
                  {shipping.documents.shippingLabel && (
                    <div className="group">
                      <Button
                        className="w-full h-auto p-4 bg-green-600 border-2 border-green-600 hover:bg-green-700 hover:border-green-700 hover:text-white transition-all ease-in-out duration-300 flex flex-row items-center justify-center gap-3 text-white font-semibold text-base"
                        variant="outline"
                        onClick={() => printDocument(shipping.documents.shippingLabel, 'ShippingLabel')}
                      >
                        {/* Truck icon to better depict tracking */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-white"
                        >
                          <rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect>
                          <path d="M16 8h3.5a2 2 0 0 1 2 2l1.5 5v3a2 2 0 0 1-2 2h-1.5"></path>
                          <circle cx="5.5" cy="18.5" r="2"></circle>
                          <circle cx="18.5" cy="18.5" r="2"></circle>
                        </svg>
                        Track Shipment
                      </Button>
                    </div>
                  )}
                  
                  {shipping.documents.commercialInvoice && (
                    <div className="group">
                      <Button
                        className="w-full h-auto p-4 bg-blue-600 border-2 border-blue-600 hover:bg-blue-700 hover:border-blue-700 hover:text-white transition-all ease-in-out duration-300 flex flex-row items-center justify-center gap-3 text-white font-semibold text-base"
                        variant="outline"
                        onClick={() => printDocument(shipping.documents.commercialInvoice, 'CommercialInvoice')}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-white"
                        >
                          <rect x="3" y="4" width="18" height="14" rx="2" ry="2"></rect>
                          <path d="M7 20h10v-4H7v4z"></path>
                          <path d="M17 8V4H7v4"></path>
                          <line x1="9" y1="12" x2="15" y2="12"></line>
                        </svg>
                         Shipping Label
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Quick Action Section */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
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
                        className="text-blue-600"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 6v6l4 2"></path>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">Next Steps</p>
                      <p className="text-sm text-blue-700 mt-1">
                        {shipping?.tracking?.status === 'confirmed' 
                          ? 'Your shipment is ready for pickup. The carrier will collect the package according to the schedule.'
                          : 'Package your items securely and attach the shipping label. The carrier will pickup according to schedule.'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* If order is stale, show abandoned notification instead of shipping card */}
          {order?.isStale && (
            <Card className="border border-gray-100 -sm bg-white">
              <CardHeader className="border-b border-gray-100 p-4">
                <CardTitle className="flex items-center font-inter gap-2 text-sm text-gray-700">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  Abandoned Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="p-4 rounded-lg flex items-start gap-3 bg-orange-50 border border-orange-100">
                  <div className="p-2 rounded-full bg-orange-100 flex-shrink-0">
                    <XCircle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-orange-800">Payment Not Completed</p>
                    <p className="text-sm text-orange-700 mt-1">
                      This order was abandoned by the buyer who did not complete the payment process. No shipping or fulfillment is required.
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-orange-700">
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-orange-200 p-1 mt-0.5">
                          <Clock className="h-3 w-3 text-orange-700" />
                        </div>
                        <span>Order timeout: Payment window expired</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-orange-200 p-1 mt-0.5">
                          <ShoppingBag className="h-3 w-3 text-orange-700" />
                        </div>
                        <span>Products have been returned to inventory automatically</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-orange-200 p-1 mt-0.5">
                          <CreditCard className="h-3 w-3 text-orange-700" />
                        </div>
                        <span>No payment was processed or received</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Confirm Cancel Dialog */}
      <Dialog open={confirmCancelDialogOpen} onOpenChange={setConfirmCancelDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Order Cancellation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? 
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-3 text-sm">
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-md text-amber-800">
              <p className="font-medium mb-1">Cancelling this order will:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Stop the order from being processed further</li>
                <li>Return funds to the customer if already paid</li>
                <li>Make inventory available for other customers</li>
                <li>Potentially affect your seller metrics and ratings</li>
              </ul>
            </div>
            <p>This action cannot be undone once you provide a reason and confirm.</p>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmCancelDialogOpen(false)}
              className="border-gray-200"
            >
              Go Back
            </Button>
            <Button
              type="button"
              onClick={() => {
                setConfirmCancelDialogOpen(false);
                setCancelDialogOpen(true);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Continue to Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Cancel Order Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this order. This will be communicated to the buyer.
              {/* {!isOrderCancellable(orderData) && (
                <div className="mt-2 text-red-500">
                  This order cannot be cancelled because it has already been processed or cancelled.
                </div>
              )} */}
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
              disabled={cancelLoading}
              onClick={handleCancelOrder}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Proof Upload Dialog */}
      <Dialog open={proofUploadDialogOpen} onOpenChange={setProofUploadDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload Pickup Proof</DialogTitle>
            <DialogDescription>
              {order?.storePickupStatus?.state === 'approved' ? (
                <div className="text-green-600 mt-2">
                  The pickup for this order has already been approved. No further action is needed.
                </div>
              ) : order?.storePickupStatus?.state === 'confirmed_by_seller' ? (
                <div className="text-amber-600 mt-2">
                  A pickup confirmation for this order is already submitted and waiting for approval.
                  You cannot submit another confirmation.
                </div>
              ) : (
                "Please upload a photo as proof of pickup. This could be a signed receipt or the customer with the items."
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Upload Proof
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="proof-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="proof-upload"
                        name="proof-upload"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleProofUpload}
                        disabled={order?.storePickupStatus?.state === 'approved' || order?.storePickupStatus?.state === 'confirmed_by_seller'}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                </div>
              </div>
              {proofImage && (
                <p className="text-sm text-green-600">
                  Selected file: {proofImage.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="note" className="text-sm font-medium text-gray-700">
                Additional Notes (Optional)
              </label>
              <textarea
                id="note"
                className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Add any additional notes about the pickup..."
                value={proofNote}
                onChange={(e) => setProofNote(e.target.value)}
                disabled={order?.storePickupStatus?.state === 'approved' || order?.storePickupStatus?.state === 'confirmed_by_seller'}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setProofUploadDialogOpen(false)
                setProofImage(null)
                setProofNote('')
              }}
              className="border-gray-200"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={confirmDeliveryLoading || !proofImage || 
                      order?.storePickupStatus?.state === 'approved' || 
                      order?.storePickupStatus?.state === 'confirmed_by_seller'}
              onClick={() => confirmDelivery(id, proofImage, proofNote)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {confirmDeliveryLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Confirming...
                </>
              ) : order?.storePickupStatus?.state === 'approved' ? (
                'Already Approved'
              ) : order?.storePickupStatus?.state === 'confirmed_by_seller' ? (
                'Awaiting Approval'
              ) : (
                'Confirm Pickup'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Tracking Information Dialog for International Sellers */}
      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Tracking Information</DialogTitle>
            <DialogDescription>
              Enter the tracking details for this international order.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="trackingNumber" className="text-sm font-medium text-gray-700">
                Tracking Number <span className="text-red-500">*</span>
              </label>
              <input
                id="trackingNumber"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter tracking number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="trackingUrl" className="text-sm font-medium text-gray-700">
                Tracking URL (Optional)
              </label>
              <input
                id="trackingUrl"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter tracking URL"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="estimatedDeliveryDate" className="text-sm font-medium text-gray-700">
                Estimated Delivery Date (Optional)
              </label>
              <input
                id="estimatedDeliveryDate"
                type="date"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={estimatedDeliveryDate}
                onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setTrackingDialogOpen(false)}
              className="border-gray-200"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={updatingTracking || !trackingNumber}
              onClick={updateTrackingInformation}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updatingTracking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Tracking'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Status Update Dialog for International Sellers */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Select the current status of this international order.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="shippingStatus" className="text-sm font-medium text-gray-700">
                Shipping Status <span className="text-red-500">*</span>
              </label>
              <select
                id="shippingStatus"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={shippingStatus}
                onChange={(e) => setShippingStatus(e.target.value)}
              >
                <option value="">Select a status</option>
                <option value="Picked-Up">Picked-Up</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
              className="border-gray-200"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={updatingStatus || !shippingStatus}
              onClick={updateOrderStatus}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updatingStatus ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
