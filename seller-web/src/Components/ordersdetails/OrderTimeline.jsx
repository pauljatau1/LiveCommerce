import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { AlertCircle, Calendar, Check, Clock, Package, ShoppingBag, CreditCard, Wallet } from "lucide-react";

export default function OrderTimeline({ order, shipping }) {
  const getTimelineAppearance = (status) => {
    switch (status) {
      case 'delivered':
        return { colorClass: 'bg-green-500', Icon: Check };
      case 'in_transit':
        return { colorClass: 'bg-blue-500', Icon: Clock };
      case 'processing_payment':
        return { colorClass: 'bg-amber-500', Icon: Clock };
      case 'payment_sent':
        return { colorClass: 'bg-teal-500', Icon: Wallet };
      default:
        return { colorClass: 'bg-yellow-500', Icon: Package };
    }
  };
  return (
    <Card className="border border-gray-100 rounded-2xl -sm bg-white">
      <CardHeader className="border-b border-gray-100 p-4">
        <CardTitle className="flex items-center font-inter gap-2 text-sm xl:text-base text-gray-700">
          <Clock className="h-4 w-4 text-blue-500" />
          Order Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-6">
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

          {order?.isStale && (
            <div className="flex gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center -sm">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex-1 text-sm pb-6">
                <p className="font-medium text-gray-800">Order Abandoned</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  {order?.createdAt ? new Date(new Date(order.createdAt).getTime() + 24 * 60 * 60 * 1000).toLocaleString() : ''}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Buyer abandoned the order without completing payment. No further action is required.
                </p>
              </div>
            </div>
          )}

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

          {shipping?.tracking?.history?.length > 0 ? (
            shipping?.tracking?.history?.map((event, index) => {
              const { colorClass, Icon } = getTimelineAppearance(event?.status);
              return (
              <div key={index} className="flex gap-3">
                <div className="relative">
                  <div className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center -sm`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  {index !== shipping.tracking.history.length - 1 && (
                    <div className="absolute top-8 bottom-0 left-1/2 w-0.5 -ml-[1px] bg-gray-200 h-full"></div>
                  )}
                </div>
                <div className="flex-1 text-sm pb-6">
                  <p className="font-medium text-gray-800 capitalize">{event?.status?.replace(/[_-]/g, ' ')}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {event?.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
                  </p>
                  {event?.description ? (
                    <p className="text-xs text-gray-500 mt-1">{event.description}</p>
                  ) : event?.note ? (
                    <p className="text-xs text-gray-500 mt-1">{event.note}</p>
                  ) : null}
                </div>
              </div>
              );
            })
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

          {/* {shipping?.estimatedDeliveryDate && !order?.isStorePickup && (
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
          )} */}
        </div>
      </CardContent>
    </Card>
  );
}


