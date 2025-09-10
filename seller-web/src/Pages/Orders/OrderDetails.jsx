import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Loader from '@/Components/Loader'
import { useOutletContext } from 'react-router-dom'
import {
  fetchOrderDetails as fetchOrderDetailsThunk,
  fetchSellerProfile as fetchSellerProfileThunk,
  estimateDeliveryTime as estimateDeliveryTimeThunk,
  arrangePickup as arrangePickupThunk,
  confirmPickup as confirmPickupThunk,
  fetchManifestUrl as fetchManifestUrlThunk,
  fetchInternationalTracking as fetchInternationalTrackingThunk,
  updateInternationalStatus as updateInternationalStatusThunk,
  cancelOrderBySeller as cancelOrderBySellerThunk,
} from '@/Redux/Slices/OrdersSlice'
import OrderTimeline from '@/Components/ordersdetails/OrderTimeline'
import PriceBreakdownCard from '@/Components/ordersdetails/PriceBreakdownCard'
import OrderActionsCard from '@/Components/ordersdetails/OrderActionsCard'
import InternationalControlsCard from '@/Components/ordersdetails/InternationalControlsCard'
import AddressesCard from '@/Components/ordersdetails/AddressesCard'
import ShippingDocumentsCard from '@/Components/ordersdetails/ShippingDocumentsCard'
import AbandonedOrderInfoCard from '@/Components/ordersdetails/AbandonedOrderInfoCard'
import PdfPreviewDialog from '@/Components/ordersdetails/dialogs/PdfPreviewDialog'
import { generateShippingInvoicePdf } from '@/lib/generateShippingInvoicePdf'
import ConfirmCancelDialog from '@/Components/ordersdetails/dialogs/ConfirmCancelDialog'
import CancelOrderDialog from '@/Components/ordersdetails/dialogs/CancelOrderDialog'
import ProofUploadDialog from '@/Components/ordersdetails/dialogs/ProofUploadDialog'
import IntlTrackingDialog from '@/Components/ordersdetails/dialogs/IntlTrackingDialog'
import IntlStatusDialog from '@/Components/ordersdetails/dialogs/IntlStatusDialog'
import OrderHeaderCard from '@/Components/ordersdetails/OrderHeaderCard'
import OrderItemsCard from '@/Components/ordersdetails/OrderItemsCard'
import OrderNotFound from '@/Components/ordersdetails/OrderNotFound'
import CarrierInformation from '@/Components/ordersdetails/CarrierInformation'
import DeliveryInformation from '@/Components/ordersdetails/DeliveryInformation'

export default function OrderDetails() {
  const dispatch = useDispatch()
  const { detailsById, detailsLoading, sellerId, sellerProfile } = useSelector((state) => state.orders)
  const { setHeaderName, setNavName } = useOutletContext()
  const { id } = useParams()
  const [orderData, setOrderData] = useState(null)
  const [isInternationalSeller, setIsInternationalSeller] = useState(false)
  const [loading, setLoading] = useState(true)
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
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState('')
  const [pdfTitle, setPdfTitle] = useState('')
  
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
    const init = async () => {
      try {
        await Promise.all([
          dispatch(fetchSellerProfileThunk()),
          dispatch(fetchOrderDetailsThunk(id)),
        ])
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [id, dispatch])

  useEffect(() => {
    const details = detailsById[id]
    if (details) {
      setOrderData(details)
      setOrderStatus(details.orderStatus)
    }
  }, [detailsById, id])

  useEffect(() => {
    if (sellerProfile?.isInternational) setIsInternationalSeller(true)
  }, [sellerProfile])

  useEffect(() => {
    const run = async () => {
      try {
        if (orderData?.addresses?.delivery?.state && orderData?.items?.[0]?.product?.seller?.warehouseDetails?.address?.state) {
          const payload = {
              delivery_type: 'import',
              pick_up_state: orderData.items[0].product.seller.warehouseDetails.address.state,
              drop_off_state: orderData.addresses.delivery.state
          };
          const res = await dispatch(estimateDeliveryTimeThunk(payload)).unwrap();
          if (res?.status === 'success') setDeliveryEstimate(res.estimate);
        }
      } catch (e) {
        // silent
      }
    };
    if (orderData) run();
  }, [orderData, dispatch])

  

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
    try {
      setIsConfirming(true);
      setConfirmDeliveryLoading(true);
      const formData = new FormData();
      formData.append('proofOfDelivery', proofImage);
      if (note) formData.append('notes', note);
      await dispatch(confirmPickupThunk({ orderId, formData })).unwrap();
      toast.success('Pickup confirmed successfully');
      setProofUploadDialogOpen(false);
      await dispatch(fetchOrderDetailsThunk(orderId));
    } catch (error) {
      console.error('Error confirming pickup:', error);
      toast.error(error?.message || 'Failed to confirm pickup');
    } finally {
      setIsConfirming(false);
      setConfirmDeliveryLoading(false);
    }
  };
  

  const printDocument = (url, documentType) => {
    // For any remaining default docs, open in new tab
    window.open(url, `_blank${documentType}`);
  };

  const openCustomShippingLabel = async () => {
    try {
      const { order, shipping, buyer, seller, items, addresses } = orderData || {};
      setPdfTitle('Shipping Label')
      setPdfDialogOpen(true)
      const url = await generateShippingInvoicePdf({ order, shipping, buyer, seller, items, addresses })
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return url
      })
    } catch (e) {
      toast.error('Failed to generate document')
    }
  }

  

  // Add function to update tracking information for international sellers
  const updateTrackingInformation = async () => {
    if (!trackingNumber) {
      toast.error('Tracking number is required');
      return;
    }

    setUpdatingTracking(true);
    try {
      await dispatch(updateInternationalTracking({
        orderId: id,
        payload: {
          trackingNumber,
          trackingUrl: trackingUrl || undefined,
          estimatedDeliveryDate: estimatedDeliveryDate || undefined
        }
      })).unwrap()
      toast.success('Tracking information updated successfully');
      setTrackingDialogOpen(false);
      
      await dispatch(fetchOrderDetailsThunk(id))
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
      await dispatch(updateInternationalStatusThunk({ orderId: id, payload: { status: shippingStatus } })).unwrap()

      toast.success('Order status updated successfully');
      setStatusDialogOpen(false);
      
      await dispatch(fetchOrderDetailsThunk(id))
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  

  // Update the handleCancelOrder function
  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

  

    setCancelLoading(true);
    try {
      await dispatch(cancelOrderBySellerThunk({ orderId: id, payload: { reason: cancelReason } })).unwrap()
      toast.success('Order cancelled successfully');
      setCancelDialogOpen(false);
      await dispatch(fetchOrderDetailsThunk(id))
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
        openChatWithCustomer: true 
      }
    });
  };

  if (loading) return <Loader />
  
  if (orderNotFound) {
    return <OrderNotFound onBack={() => navigate('/dashboard/orders')} onRetry={() => window.location.reload()} />
  }

  if (!orderData) return null

  const { order, buyer, seller, items, shipping, addresses, timeline } = orderData


  return (
    <div className="container mx-auto sm:px-6 py-6 sm:py-10 space-y-4 sm:space-y-6 min-h-screen">
      <OrderHeaderCard
        order={order}
        orderData={orderData}
        shipping={shipping}
        onMessage={handleMessageClick}
        onOpenProof={() => setProofUploadDialogOpen(true)}
        confirmDeliveryLoading={confirmDeliveryLoading}
        navigate={navigate}
      />

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-3 w-full">
        <div className="xl:col-span-2 space-y-6">
          <OrderItemsCard items={items} seller={seller} />

          <OrderTimeline order={order} shipping={shipping} />

          {!order?.isStorePickup && !order?.isStale && (
            <div className="border border-gray-100 shadow-sm bg-white p-4 space-y-6 rounded-2xl">
              <CarrierInformation shipping={shipping} />
              <DeliveryInformation shipping={shipping} deliveryEstimate={deliveryEstimate} />
                        </div>
          )}

          <PriceBreakdownCard order={order} shipping={shipping} />
                      </div>

        <div className="space-y-6 w-full">
          {!order?.isStale && (
            <OrderActionsCard
              order={order}
              items={items}
              shipping={shipping}
              onCancelClick={() => setConfirmCancelDialogOpen(true)}
              confirmDeliveryLoading={confirmDeliveryLoading}
              setProofUploadDialogOpen={setProofUploadDialogOpen}
            />
          )}

          {isInternationalSeller && (
            <InternationalControlsCard onOpenTracking={() => setTrackingDialogOpen(true)} onOpenStatus={() => setStatusDialogOpen(true)} />
          )}

          <AddressesCard order={order} addresses={addresses} sellerProfile={sellerProfile} seller={seller} items={items} shipping={shipping} isInternationalSeller={isInternationalSeller} />

          {!order?.isStorePickup && !order?.isStale && (shipping?.documents?.shippingLabel || shipping?.documents?.commercialInvoice) && order?.paymentInfo?.status === 'paid' && (
            <ShippingDocumentsCard shipping={shipping} onPrintLabel={() => printDocument(shipping.documents.shippingLabel, 'ShippingLabel')} onPrintInvoice={openCustomShippingLabel} />
          )}

          {order?.isStale && <AbandonedOrderInfoCard />}
                    </div>
                </div>
                
      <ConfirmCancelDialog
        open={confirmCancelDialogOpen}
        onOpenChange={setConfirmCancelDialogOpen}
        onContinue={() => {
                setConfirmCancelDialogOpen(false);
                setCancelDialogOpen(true);
              }}
      />

      <CancelOrderDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        onSubmit={handleCancelOrder}
        submitting={cancelLoading}
      />

      <ProofUploadDialog
        open={proofUploadDialogOpen}
        onOpenChange={setProofUploadDialogOpen}
        disabledState={false}
        proofImage={proofImage}
        proofNote={proofNote}
        onFileChange={handleProofUpload}
        onNoteChange={(e) => setProofNote(e.target.value)}
        onSubmit={() => confirmDelivery(id, proofImage, proofNote)}
        submitting={confirmDeliveryLoading}
        storePickupState={order?.storePickupStatus?.state}
      />

      <IntlTrackingDialog
        open={trackingDialogOpen}
        onOpenChange={setTrackingDialogOpen}
        trackingNumber={trackingNumber}
        setTrackingNumber={setTrackingNumber}
        trackingUrl={trackingUrl}
        setTrackingUrl={setTrackingUrl}
        estimatedDeliveryDate={estimatedDeliveryDate}
        setEstimatedDeliveryDate={setEstimatedDeliveryDate}
        onSubmit={updateTrackingInformation}
        submitting={updatingTracking}
      />

      <IntlStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        shippingStatus={shippingStatus}
        setShippingStatus={setShippingStatus}
        onSubmit={updateOrderStatus}
        submitting={updatingStatus}
      />
      <PdfPreviewDialog
        open={pdfDialogOpen}
        onOpenChange={(open) => {
          if (!open && pdfUrl) {
            URL.revokeObjectURL(pdfUrl)
            setPdfUrl('')
          }
          setPdfDialogOpen(open)
        }}
        pdfUrl={pdfUrl}
        title={pdfTitle}
      />
    </div>
  )
}