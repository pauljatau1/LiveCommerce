import reloadSeller from './reloadSeller';
const LEGACY_LOCAL_SELLER_PATCH = false;
import useStudioBack from './useStudioBack';
import {phoneProblem} from './phone';
import {allowedPlace} from './googlePlaces';
import {useEffect,useState} from 'react';
import {useLocation,useNavigate} from 'react-router-dom';
import {useAuthContext} from '@/Hooks/useAuthContextV2';
import {sellerUtils} from '@/util/auth';
import {onboarding,serviceAreaConfig,errorText,notifyDeliveryState} from './api';
import {TopBar,Problem} from './ui';
import PickupAddressForm from './PickupAddressForm';
export default function PickupAddress() {
 const location=useLocation(),navigate=useNavigate(),{seller,dispatch}=useAuthContext();
 const [value,setValue]=useState(null),[config,setConfig]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 const destination=location.state?.from;const back=useStudioBack(destination || '/studio/me');
 useEffect(()=>{let active=true;Promise.all([onboarding.get(),serviceAreaConfig()]).then(([data,area])=>{if(active){setConfig(area);setValue({...data.pickup,state:data.pickup.state || area.states[0] || ''});}}).catch(()=>{if(active)setError('Couldn’t load your pickup address. Please try again.');});return()=>{active=false;};},[retry]);
 const save=async event=>{event.preventDefault();setBusy(true);setError('');try{
  if(phoneProblem(value.phone))throw {response:{data:{message:phoneProblem(value.phone)}}};
  const result=await onboarding.pickup(value);const a=result.pickup;
  if(LEGACY_LOCAL_SELLER_PATCH){const updated={...seller,phoneNumber:a.phone,hasFilledAddress:true,hasFilledBusinessAddress:true,warehouseDetails:{...seller?.warehouseDetails,address:{country:'NG',state:a.state,city:a.city,lga:a.lga,addressLine1:a.addressLine1,addressLine2:a.landmark,latitude:a.latitude,longitude:a.longitude,addressSource:a.addressSource,formattedAddress:a.formattedAddress}}};
  sellerUtils.storeSeller(updated);dispatch?.({type:'STORE_SELLER',payload:updated});}else await reloadSeller(dispatch);back();
 }catch(e){setError(errorText(e,'Couldn’t save your pickup address. Please try again.'));}finally{setBusy(false);}};
 return <div className="studio-app"><TopBar title="Pickup address" onBack={back}/><main className="ed-pad" style={{maxWidth:560,margin:'0 auto',paddingBottom:32}}><p className="mut">Where couriers collect your orders.</p>{error&&<Problem text={error} onRetry={!value?()=>{setError('');setRetry(n=>n+1);}:undefined}/>} {!value?(!error&&<p role="status">Loading pickup address…</p>):<form onSubmit={save} style={{display:'flex',flexDirection:'column',gap:16}}><PickupAddressForm config={config} value={value} onChange={setValue} onNotify={notifyDeliveryState}/><button className="btn" disabled={busy || Boolean(config && value.state && !allowedPlace(config,value.state))}>{busy?'Saving…':'Save pickup address'}</button></form>}</main></div>;
}
