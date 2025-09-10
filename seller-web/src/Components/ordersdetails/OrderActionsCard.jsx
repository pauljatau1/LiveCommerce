import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { AlertCircle, Check, Clock, XCircle } from "lucide-react";

export default function OrderActionsCard({ order, items, shipping, onCancelClick, confirmDeliveryLoading, setProofUploadDialogOpen }) {
  if (!order) return null;
  const isPaid = order?.paymentInfo?.status === 'paid';
  const shippingPending = shipping?.tracking?.status === 'pending' || shipping?.tracking?.status?.toLowerCase()?.includes('pending');
  const allItemsPending = items?.every(item => item.status?.toLowerCase() === 'pending' || !item.status);
  const anyItemCancelled = items?.some(item => item.status?.toLowerCase() === 'cancelled');

  return (
    <Card className="border w-full border-gray-100 shadow-sm bg-white rounded-2xl">
      <CardHeader className="border-b border-gray-100 p-4">
        <CardTitle className="flex items-center gap-2 font-inter text-sm text-gray-700">
          <div className="p-1.5 bg-orange-100 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-600">
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
        {isPaid && shippingPending && allItemsPending && !anyItemCancelled ? (
          <div className="bg-red-50 border border-red-100 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-red-800 mb-2">Cancel Order</h4>
                <p className="text-sm text-red-700 mb-3">Cancel this order and refund the customer. This action cannot be undone.</p>
                <Button onClick={onCancelClick} variant="destructive" className="w-full bg-red-600 hover:bg-red-700 text-white font-medium">
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Order
                </Button>
              </div>
            </div>
          </div>
        ) : isPaid && (!shippingPending || !allItemsPending || anyItemCancelled) ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-1">Order In Progress</h4>
                <p className="text-sm text-gray-600">This order is already being processed and cannot be cancelled. Please contact support if you need assistance.</p>
              </div>
            </div>
          </div>
        ) : !isPaid ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-700 mb-1">Payment Pending</h4>
                <p className="text-sm text-blue-600">Order actions will be available once payment is confirmed.</p>
              </div>
            </div>
          </div>
        ) : null}

        {order?.isStorePickup && (
          <Button
            variant="outline"
            className="w-full sm:w-auto bg-purple-600 text-white flex items-center font-inter justify-center gap-2 border-gray-200 hover:bg-purple-700"
            onClick={() => setProofUploadDialogOpen(true)}
            disabled={confirmDeliveryLoading || order?.storePickupStatus?.state === 'approved' || order?.storePickupStatus?.state === 'confirmed_by_seller'}
          >
            {confirmDeliveryLoading ? (
              <>
                <Clock className="w-4 h-4" />
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
      </CardContent>
    </Card>
  );
}


