import { Truck, Tag, Hash, Package } from "lucide-react";

export default function CarrierInformation({ shipping }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
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
  );
}


