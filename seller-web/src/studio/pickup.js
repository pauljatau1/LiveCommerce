export const pickupAddress = seller => seller?.warehouseDetails?.address?.addressLine1 ? seller.warehouseDetails.address : seller?.businessAddress?.addressLine1 ? seller.businessAddress : seller?.sellerAddress || {};
export const courierPhone = seller => seller?.warehouseDetails?.contactNumber || seller?.phoneNumber || '';
