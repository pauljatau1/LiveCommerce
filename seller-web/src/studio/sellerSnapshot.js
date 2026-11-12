// Only the server response can replace a seller snapshot after saving.
export async function refreshSellerSnapshot(fetchSeller,storeSeller,dispatch) {
 const seller=await fetchSeller();
 if(!seller || typeof seller !== 'object' || !seller._id)throw new Error('Missing seller profile');
 storeSeller(seller);
 dispatch?.({type:'STORE_SELLER',payload:seller});
 return seller;
}
export const setupNext = kind => ({store:'pickup',pickup:'bank',bank:'done'})[kind];
export function setupPrefill(saved,server) {
 return {...saved,storeName:saved.storeName || server.store.storeName || '',phone:saved.phone || server.pickup.phone || ''};
}
