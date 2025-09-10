import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Calendar } from "lucide-react";
import { Truck, Tag, Hash, Package, DollarSign } from "lucide-react";

export default function ShippingDetailsCard({ shipping, deliveryEstimate }) {
  if (!shipping) return null;
  return (
    <Card className="border border-gray-100 shadow-sm bg-white">
      <CardHeader className="border-b border-gray-100 p-4">
        <CardTitle className="flex items-center font-inter gap-2 text-sm xl:text-base text-gray-700">
          <Truck className="h-4 w-4 text-blue-500" />
          Shipping Details
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
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
              <span className="text-sm font-mono bg-gray-100 px-3 py-1 rounded-full text-gray-800">{shipping?.shipment_id || "N/A"}</span>
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
              <span className="text-sm font-mono bg-gray-100 px-3 py-1 rounded-full text-gray-800">{shipping?.tracking?.number || "Generating..."}</span>
            </div>
          </div>
        </div>

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
              <span className="text-sm font-semibold text-gray-800">{shipping?.estimatedPickupDate || 'Processing...'}</span>
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
              <span className="text-sm font-semibold text-gray-800">{deliveryEstimate ? `${deliveryEstimate}` : shipping?.estimatedDeliveryDate || 'Calculating...'}</span>
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
              <span className="text-sm font-semibold text-green-600">₦{shipping?.fee?.amount?.toLocaleString() || "0"}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


