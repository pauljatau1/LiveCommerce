import {courierPhoneError,courierAddressError} from '../courierErrors';
import CourierNameFields from './CourierNameFields';
import {hasCourierName,NAME_ERROR} from '../courierName';
import GoogleAddress from './GoogleAddress';
import AreaPicker from './AreaPicker';
import {pickerAreas} from './areaPicker';
const LEGACY_AREA_INPUT = false; // Retained native datalist; the picker is the active UI.
import { useServiceArea, allowsState } from '../serviceArea';
// Delivery address, asked for once before a first bid or purchase.
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API, api, errorMessage } from '../api';
import { useAuth } from '../auth';
import { Sheet } from './ui';

// The address form, shared by this sheet and the "One step, then your bid" sheet.
export {phoneProblem} from '../phone';
import {phoneProblem,PHONE_HINT} from '../phone';
export function useAddressForm(initialAddress = null) {
  const { buyer } = useAuth();
  const { config, error: areaError } = useServiceArea();
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState(() => ({state:'',city:'',lga:'',addressLine1:'',landmark:'',phoneNumber:buyer?.phoneNumber || '',firstName:buyer?.firstName || '',lastName:buyer?.lastName || '',...initialAddress,landmark:initialAddress?.addressLine2 || initialAddress?.landmark || ''}));
  useEffect(()=>{setForm(f=>({...f,firstName:f.firstName || buyer?.firstName || '',lastName:f.lastName || buyer?.lastName || '',phoneNumber:f.phoneNumber || buyer?.phoneNumber || ''}));},[buyer?._id,buyer?.firstName,buyer?.lastName,buyer?.phoneNumber]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value, ...(['state','city','addressLine1'].includes(k)?{latitude:null,longitude:null,addressSource:'manual',formattedAddress:''}:{}), ...(k === 'state' ? { city: '', lga: '' } : {}) }));

  useEffect(() => {
    if (!config) return;
    setStates(config.states.map(name => ({ name, isoCode: name })));
    if (config.states.length === 1) setForm(f => ({ ...f, state:f.state || config.states[0] }));
  }, [config]);
  useEffect(() => {
    if (!LEGACY_AREA_INPUT) {setCities(pickerAreas(config, form.state));return;}
    const groups = config?.areas?.[form.state];
    setCities([]);
    if (groups) setCities(Object.entries(groups).flatMap(([lga,names]) => [...new Set([lga,...names])].map(name => ({ name, lga }))));
    else if (form.state && config) axios.get(`${API}/api/v2/orders/states`).then(r => {
      const st = r.data?.data?.find(s => s.name === form.state);
      if(st) return axios.get(`${API}/api/v2/orders/cities/${st.isoCode}`).then(r => setCities(r.data?.data || []));
    }).catch(()=>{});
  }, [config,form.state]);

  // Plain-language problem with the form, or '' when it's complete
  const problem = (needPhone) => {
    if(!hasCourierName(form) && !hasCourierName(buyer))return NAME_ERROR;
    if (!config) return areaError || 'Loading delivery areas. Please wait.';
    if (!allowsState(config,form.state)) return `Delivery is ${config.states.join(' and ')}-only for now. You can keep watching and chatting.`;
    if (form.addressSource !== 'google' && !cities.some(area=>area.name === form.city && area.lga === form.lga)) return 'Choose your area from the list.';
    if (!form.state || !form.city || !form.addressLine1.trim()) return 'Add your state, area and street address.';
    if (needPhone || form.phoneNumber) {
      const p = phoneProblem(form.phoneNumber);
      if (p) return p;
    }
    return '';
  };

  // `who` fills the name and email for a buyer who just signed up
  const save = async (who = buyer) => {
    const names=hasCourierName(form)?form:who;
    if(!hasCourierName(names))throw {response:{data:{message:NAME_ERROR}}};
    if(!hasCourierName(who))await api.updateProfile({firstName:names.firstName.trim(),lastName:names.lastName.trim()});
    return ((initialAddress?._id || (!initialAddress && who?.shippingAddresses?.[0]?._id)) ? async body => { const id=initialAddress?._id || who.shippingAddresses[0]._id;const result = await api.updateAddress(id, body); if(!initialAddress) await api.activateAddress(id); return result; } : api.addAddress)({
    addressType: initialAddress?.addressType || who?.shippingAddresses?.[0]?.addressType || 'home',
    firstName: names.firstName.trim(),
    lastName: names.lastName.trim(),
    email: who?.email,
    phoneNumber: form.phoneNumber || who?.phoneNumber,
    country: 'NG',
    state: form.state,
    city: form.city,
    lga: form.lga,
    latitude: form.latitude ?? null,longitude: form.longitude ?? null,addressSource:form.addressSource || 'manual',formattedAddress:form.formattedAddress || '',
    addressLine1: form.addressLine1.trim(),
    addressLine2: form.landmark.trim(),
  });};

  const chooseArea = area => setForm(form=>({...form,city:area.name,lga:area.lga,latitude:null,longitude:null,addressSource:'manual',formattedAddress:''}));
  return {outOfArea:Boolean(config && form.state && !allowsState(config,form.state)),form,set,chooseArea,states,cities,problem,save,config,buyer,chooseGoogleAddress:address=>setForm(form=>({...form,...address})),notify:(state,email)=>api.joinWaitlist({state,email})};
}

export function AddressFields({ address, askPhone, idPrefix = 'ad', contactEmail = '', deliveryError = '' }) {
  const { form, set, states, cities } = address;
  const phoneError=courierPhoneError(form.phoneNumber),streetError=courierAddressError(deliveryError,form.city);
  return (
    <>
      {!hasCourierName(address.buyer) && <CourierNameFields value={form} onChange={(key,value)=>set(key)({target:{value}})} id={`${idPrefix}-name`}/>}
      <GoogleAddress config={address.config} value={form} onChange={address.chooseGoogleAddress} onNotify={address.notify} needContact={!address.buyer} initialNotifyEmail={contactEmail}>
      <div className="fl">
        <label className="lab" htmlFor={`${idPrefix}-st`}>State</label>
        <select id={`${idPrefix}-st`} className="sel" value={form.state} onChange={set('state')} disabled={states.length === 1}>
          <option value="">Choose your state</option>
          {states.map((s) => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
        </select>
        <span className="hint">{states.length ? `Delivery is ${states.map(s => s.name).join(' and ')}-only for now. You can keep watching and chatting from anywhere.` : 'Loading delivery areas…'}</span>
      </div>
      <div className="fl">
        <label className="lab" htmlFor={`${idPrefix}-ct`}>Area</label>
        {LEGACY_AREA_INPUT ? <>
        <input id={`${idPrefix}-ct`} className="in" list={`${idPrefix}-areas`} value={form.city} onChange={set('city')} placeholder="Search your area" disabled={!form.state} />
        <datalist id={`${idPrefix}-areas`}>{cities.map((c,i) => <option key={i} value={c.name}>{c.lga ? `${c.name} · ${c.lga}` : c.name}</option>)}</datalist>
        </> : <AreaPicker id={`${idPrefix}-ct`} value={form.city} lga={form.lga} areas={cities} disabled={!form.state} onChange={address.chooseArea} />}
      </div>
      <div className="fl">
        <label className="lab" htmlFor={`${idPrefix}-l1`}>Street address</label>
        <input id={`${idPrefix}-l1`} className="in" aria-invalid={Boolean(streetError)} value={form.addressLine1} onChange={set('addressLine1')} placeholder="e.g. 12 Herbert Macaulay Way" autoComplete="street-address" />
        {streetError&&<span className="err" role="alert">{streetError}</span>}
      </div>
      </GoogleAddress>
      <div className="fl">
        <label className="lab" htmlFor={`${idPrefix}-lm`}>Landmark <span className="hint" style={{ fontWeight: 'var(--w-medium)' }}>optional</span></label>
        <input id={`${idPrefix}-lm`} className="in" value={form.landmark} onChange={set('landmark')} placeholder="e.g. opposite Yaba bus stop" />
      </div>
      {(askPhone || address.config) && (
        <div className="fl">
          <label className="lab" htmlFor={`${idPrefix}-ph`}>Phone for the courier</label>
          <input id={`${idPrefix}-ph`} className="in" aria-invalid={Boolean(phoneError)} type="tel" inputMode="tel" value={form.phoneNumber} onChange={set('phoneNumber')} placeholder="0803 123 4567" autoComplete="tel" />
          <span className={phoneError?'err':'hint'}>{phoneError || PHONE_HINT}</span>
        </div>
      )}
    </>
  );
}

// Change the delivery address later (the first one is asked in the one-step sheet).
export default function AddressSheet({ onClose, onSaved, top = null, initialAddress = null }) {
  const { buyer, refresh } = useAuth();
  const address = useAddressForm(initialAddress);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    const problem = address.problem(!buyer?.phoneNumber);
    setError(problem);
    if (problem) return;
    setBusy(true);
    try {
      await address.save();
      await refresh();
      onSaved?.();
    } catch (err) {
      setError(errorMessage(err, "Couldn't save the address."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title="Where should we deliver?" onClose={onClose} top={top}>
      <p className="mut" style={{ margin: 0, fontSize: 'var(--t-body)' }}>Anything you win or buy ships here.</p>
      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AddressFields address={address} askPhone={!buyer?.phoneNumber} />
        {error && <span className="err" role="alert">{error}</span>}
        <button type="submit" className="btn" disabled={busy || address.outOfArea}>{busy ? 'Saving…' : 'Save address'}</button>
      </form>
    </Sheet>
  );
}
