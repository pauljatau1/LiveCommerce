import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '@/Hooks/useAuthContextV2';
import { serviceAreaConfig } from './api';
const normal = s => String(s || '').trim().replace(/\s+/g,' ').replace(/\s+state$/i,'').trim().toLowerCase();
export function usePickupArea() {
  const { seller } = useAuthContext();
  const [config,setConfig]=useState(null),[error,setError]=useState('');
  useEffect(()=>{serviceAreaConfig().then(setConfig).catch(()=>setError('Couldn’t check delivery areas. Please refresh and try again.'));},[]);
  const a=seller?.warehouseDetails?.address?.addressLine1?seller.warehouseDetails.address:seller?.businessAddress?.addressLine1?seller.businessAddress:seller?.sellerAddress;
  return { config, error, allowed:config ? config.states.some(s=>normal(s)===normal(a?.state)) : null };
}
export function PickupAreaBanner({config, primary = false}) {
  return <div className="banner b-warn" role="alert" style={{flexDirection:'column',alignItems:'stretch'}}><span>We deliver within {config.states.join(' and ')} for now. Update your pickup address to go live.</span><Link className={primary ? 'btn' : 'btn2'} to="/studio/start?step=pickup">Update pickup address</Link></div>;
}
