import {PHONE_HINT} from './phone';
import GoogleAddress from './GoogleAddress';
import {PickupAreaField} from './ServiceArea';
export default function PickupAddressForm({config,value,onChange,onNotify}) {
 const set=key=>event=>{onChange({...value,[key]:event.target.value,...(['state','city','addressLine1'].includes(key)?{latitude:null,longitude:null,addressSource:'manual',formattedAddress:''}:{}),...(key==='state'?{city:'',lga:''}:{})});};
 return <>
  <GoogleAddress config={config} value={value} onChange={address=>onChange({...value,...address})} onNotify={onNotify}>
   <div className="fl"><label className="lab" htmlFor="pk-st">State</label><span className="pickup-state"><svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><select id="pk-st" className="sel" value={value.state || ''} onChange={set('state')} disabled={config?.states?.length===1 && config.states.includes(value.state)}><option value="">Choose your state</option>{value.state&&!config?.states?.includes(value.state)&&<option value={value.state}>{value.state}</option>}{config?.states?.map(state=><option key={state} value={state}>{state}</option>)}</select></span>{config?.states?.length===1&&<span className="hint">We deliver within {config.states[0]} for now.</span>}</div>
   <div className="fl"><label className="lab" htmlFor="pk-ct">Area</label><PickupAreaField config={config} state={value.state} value={value.city} lga={value.lga} onChange={area=>onChange({...value,city:area.name,lga:area.lga,latitude:null,longitude:null,addressSource:'manual',formattedAddress:''})} /></div>
   <div className="fl"><label className="lab" htmlFor="pk-l1">Street address</label><input id="pk-l1" className="in" value={value.addressLine1 || ''} onChange={set('addressLine1')} autoComplete="street-address" /></div>
  </GoogleAddress>
  <div className="fl"><label className="lab" htmlFor="pk-lm">Landmark <span className="hint">optional</span></label><input id="pk-lm" className="in" value={value.landmark || ''} onChange={set('landmark')} placeholder="e.g. beside Computer Village gate" /></div>
  <div className="fl"><label className="lab" htmlFor="pk-ph">Phone for couriers</label><input id="pk-ph" className="in" type="tel" inputMode="tel" value={value.phone || ''} onChange={set('phone')} autoComplete="tel" placeholder="0803 123 4567" /><span className="hint">{PHONE_HINT}</span></div>
 </>;
}
