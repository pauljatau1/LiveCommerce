import {sellerService} from '@/services/sellerService';
import {sellerUtils} from '@/util/auth';
export default async function reloadSeller(dispatch){
 try{
  const seller=await sellerService.fetchSellerDetails();
  if(!seller || typeof seller!=='object')throw new Error('Missing seller profile');
  sellerUtils.storeSeller(seller);dispatch?.({type:'STORE_SELLER',payload:seller});return seller;
 }catch{
  throw {response:{data:{message:'Pickup details saved, but we couldn’t reload your store. Please try again.'}}};
 }
}
