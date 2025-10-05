import { Calendar, Clock, DollarSign } from "lucide-react";

export default function DeliveryInformation({ shipping, deliveryEstimate }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
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
  );
}


