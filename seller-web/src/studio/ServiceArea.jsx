import {pickupAddress} from './pickup';
import AreaPicker from './AreaPicker';
import {pickerAreas} from './areaPicker';
import { useEffect, useState } from 'react';
import { Link,useLocation } from 'react-router-dom';
import { useAuthContext } from '@/Hooks/useAuthContextV2';
import { serviceAreaConfig } from './api';
const normal = s => String(s || '').trim().replace(/\s+/g,' ').replace(/\s+state$/i,'').trim().toLowerCase();
export function usePickupArea() {
  const { seller } = useAuthContext();
  const [config,setConfig]=useState(null),[error,setError]=useState('');
  useEffect(()=>{serviceAreaConfig().then(setConfig).catch(()=>setError('Couldn’t check delivery areas. Please refresh and try again.'));},[]);
  const a=pickupAddress(seller);
  return { config, error, allowed:config ? config.states.some(s=>normal(s)===normal(a?.state)) : null };
}
export function PickupAreaBanner({config, primary = false}) {
  const location=useLocation();
  return <div className="banner b-warn" role="alert" style={{flexDirection:'column',alignItems:'stretch'}}><span>We deliver within {config.states.join(' and ')} for now. Update your pickup address to go live.</span><Link className={primary ? 'btn' : 'btn2'} to="/studio/pickup" state={{from:location.pathname}}>Update pickup address</Link></div>;
}

export function PickupAreaField({config,state,value,lga,onChange,id='pk-ct'}) {
  return <AreaPicker id={id} value={value} lga={lga} areas={pickerAreas(config,state)} disabled={!state} onChange={onChange} />;
}
