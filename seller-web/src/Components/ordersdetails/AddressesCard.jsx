import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { MapPin, User, Phone, Mail, Building2, Box, Truck, Check } from "lucide-react";

export default function AddressesCard({ order, addresses, sellerProfile, shipping, isInternationalSeller, seller, items }) {
  if (!order) return null;

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

  // Determine best seller contact source for this order
  const resolvedSeller = seller || sellerProfile || {};
  const storeName = resolvedSeller?.storeName || "Main Warehouse";
  const businessName = resolvedSeller?.businessName || sellerProfile?.businessName || '';
  const sellerPhone = resolvedSeller?.phoneNumber || addresses?.pickup?.phone || '';

  // Determine best seller address to display
  const productSellerWarehouseAddress = items?.[0]?.product?.seller?.warehouseDetails?.address;
  const sellerBusinessAddress = seller?.businessAddress || sellerProfile?.businessAddress;
  const sellerIndividualAddress = seller?.sellerAddress || sellerProfile?.sellerAddress;

  let pickupOrWarehouseAddress = null;
  if (order?.isStorePickup) {
    // For store pickup orders, prefer the pickup address attached to the order
    pickupOrWarehouseAddress = addresses?.pickup || sellerBusinessAddress || sellerIndividualAddress || productSellerWarehouseAddress || null;
  } else {
    // For delivery orders, prefer warehouse/origin address
    pickupOrWarehouseAddress = productSellerWarehouseAddress || sellerBusinessAddress || sellerIndividualAddress || addresses?.pickup || null;
  }

  return (
    <Card className="border w-full border-gray-100 -sm bg-white">
      <CardHeader className="border-b border-gray-100 p-4">
        <CardTitle className="flex items-center gap-2 font-inter text-sm text-gray-700">
          <MapPin className="h-4 w-4 text-blue-500" />
          {order?.isStorePickup ? 'Store Pickup Information' : 'Delivery & Pickup Information'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {!order?.isStorePickup && addresses?.delivery && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h3 className="font-inter font-semibold mb-3 flex items-center gap-2 text-gray-800">
              <MapPin className="h-4 w-4 text-green-600" />
              Delivery Address
            </h3>
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <p className="font-medium text-gray-800">{addresses?.delivery?.first_name} {addresses?.delivery?.last_name}</p>
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

        <div className={`${order?.isStorePickup ? 'bg-purple-50 border-purple-100' : 'bg-gray-50 border-gray-100'} rounded-lg p-4 border`}>
          <h3 className="font-inter font-semibold mb-3 flex items-center gap-2 text-gray-800">
            <Building2 className={`${order?.isStorePickup ? 'text-purple-600' : 'text-blue-600'} h-4 w-4`} />
            {order?.isStorePickup ? 'Store Pickup Location' : 'Warehouse/Pickup Location'}
          </h3>
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4 text-gray-400" />
              <p className="font-medium text-gray-800">{storeName}</p>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <p className="text-gray-700">{maskPhoneNumber(sellerPhone)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <p className="text-gray-700">{storeName || businessName}</p>
            </div>
            <div className="pl-6 text-gray-700 space-y-1 mt-2">
              {pickupOrWarehouseAddress ? (
                <>
                  <p>{pickupOrWarehouseAddress?.addressLine1}</p>
                  {pickupOrWarehouseAddress?.addressLine2 && <p>{pickupOrWarehouseAddress?.addressLine2}</p>}
                  <p>
                    {pickupOrWarehouseAddress?.city}{pickupOrWarehouseAddress?.city ? ', ' : ''}
                    {pickupOrWarehouseAddress?.state}
                    {pickupOrWarehouseAddress?.zipCode ? ` ${pickupOrWarehouseAddress?.zipCode}` : ''}
                  </p>
                  <p>{pickupOrWarehouseAddress?.country === 'NG' ? 'Nigeria' : pickupOrWarehouseAddress?.country}</p>
                </>
              ) : (
                <p className="text-gray-500">No pickup/warehouse address on file.</p>
              )}
            </div>
          </div>
        </div>

        {!order?.isStorePickup && (
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
  );
}


