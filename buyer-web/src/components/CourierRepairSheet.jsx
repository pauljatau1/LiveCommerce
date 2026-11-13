import {useState} from 'react';
import {useAuth} from '../auth';
import {api,errorMessage} from '../api';
import {hasCourierName,NAME_ERROR} from '../courierName';
import {PHONE_HINT,phoneProblem,phoneDigits,deliveryAddressFor,deliveryPhoneFor} from '../phone';
import CourierNameFields from './CourierNameFields';
import {Sheet} from './ui';
export default function CourierRepairSheet({kind,onClose,onSaved}){
 const {buyer,refresh}=useAuth(),[names,setNames]=useState({firstName:buyer?.firstName || '',lastName:buyer?.lastName || ''}),[phone,setPhone]=useState(deliveryPhoneFor(buyer)),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const save=async event=>{event.preventDefault();setError('');if(kind==='name'&&!hasCourierName(names)){setError(NAME_ERROR);return;}if(kind==='phone'&&phoneProblem(phone)){setError(phoneProblem(phone));return;}setBusy(true);try{if(kind==='name')await api.updateProfile(names);else await api.saveCourierPhone(deliveryAddressFor(buyer)?._id,phoneDigits(phone));await refresh();await onSaved();}catch(e){setError(errorMessage(e,'Couldn’t save your details. Please try again.'));}finally{setBusy(false);}};
 return <Sheet title={kind==='name'?'Add your full name for the courier':'Fix your phone for the courier'} onClose={busy?()=>{}:onClose}><form onSubmit={save} className="courier-repair-form">{kind==='name'?<CourierNameFields showTitle={false} hint="Letters only." value={names} onChange={(key,value)=>setNames(n=>({...n,[key]:value}))}/>:<div className="fl"><label className="lab" htmlFor="repair-phone">Phone for the courier</label><input id="repair-phone" className="in" type="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)}/><span className="hint">{PHONE_HINT}</span></div>}{error&&<p role="alert" className="err">{error}</p>}<button className="btn" disabled={busy}>{busy?'Checking delivery…':`Save ${kind} and retry delivery`}</button><p className="hint">We'll ask the courier to check your delivery again.</p></form></Sheet>;
}
