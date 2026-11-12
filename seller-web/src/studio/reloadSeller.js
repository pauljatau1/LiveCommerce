import {refreshSellerSnapshot} from './sellerSnapshot';
import {sellerService} from '@/services/sellerService';
import {sellerUtils} from '@/util/auth';
export default async function reloadSeller(dispatch) {
  try {
    return await refreshSellerSnapshot(()=>sellerService.fetchSellerDetails(),sellerUtils.storeSeller,dispatch);
  } catch {
    throw {response:{data:{message:'Your changes were saved, but your store couldn’t reload. Please try again.'}}};
  }
}
