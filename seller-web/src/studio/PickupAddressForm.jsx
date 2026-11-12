import GoogleAddress from './GoogleAddress';
import {PickupAreaField} from './ServiceArea';
export default function PickupAddressForm({config,value,onChange,onNotify}) {
 const set=key=>event=>{onChange({...value,[key]:event.target.value,...(['state','city','addressLine1'].includes(key)?{latitude:null,longitude:null,addressSource:'manual',formattedAddress:''}:{}),...(key==='state'?{city:'',lga:''}:{})});};
 return <>
  <GoogleAddress config={config} value={value} onChange={address=>onChange({...value,...address})} onNotify={onNotify}>
   <div className="fl"><label className="lab" htmlFor="pk-st">State</label><select id="pk-st" className="sel" value={value.state || ''} onChange={set('state')} disabled={config?.states?.length===1}><option value="">Choose your state</option>{config?.states?.map(state=><option key={state} value={state}>{state}</option>)}</select></div>
   <div className="fl"><label className="lab" htmlFor="pk-ct">Area</label><PickupAreaField config={config} state={value.state} value={value.city} lga={value.lga} onChange={area=>onChange({...value,city:area.name,lga:area.lga,latitude:null,longitude:null,addressSource:'manual',formattedAddress:''})} /></div>
   <div className="fl"><label className="lab" htmlFor="pk-l1">Street address</label><input id="pk-l1" className="in" value={value.addressLine1 || ''} onChange={set('addressLine1')} autoComplete="street-address" /></div>
  </GoogleAddress>
  <div className="fl"><label className="lab" htmlFor="pk-lm">Landmark <span className="hint">optional</span></label><input id="pk-lm" className="in" value={value.landmark || ''} onChange={set('landmark')} /></div>
  <div className="fl"><label className="lab" htmlFor="pk-ph">Phone for couriers</label><input id="pk-ph" className="in" type="tel" inputMode="tel" value={value.phone || ''} onChange={set('phone')} autoComplete="tel" placeholder="0803 123 4567" /><span className="hint">10 or 11 digits, e.g. 0803 123 4567</span></div>
 </>;
}
