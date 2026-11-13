import {NAME_ERROR,namePart} from '../courierName';
export default function CourierNameFields({value,onChange,id='courier',error}){
 const problem=error || (['firstName','lastName'].some(key=>value[key]&&!namePart(value[key]))?NAME_ERROR:'');
 return <div role="group" aria-labelledby={`${id}-title`} style={{minWidth:0}}>
  <p id={`${id}-title`} className="lab" style={{margin:'0 0 8px'}}>Your name for the courier</p>
  <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>
   {[['firstName','First name'],['lastName','Last name']].map(([key,label])=><div className="fl" key={key}><label className="lab" htmlFor={`${id}-${key}`}>{label}</label><input className="in" aria-invalid={Boolean(problem && (!value[key] || !namePart(value[key])))} id={`${id}-${key}`} value={value[key] || ''} onChange={event=>onChange(key,event.target.value)} autoComplete={key==='firstName'?'given-name':'family-name'} /></div>)}
  </div>
  <span style={{display:'block',marginTop:10}} className={problem?'err':'hint'}>{problem || 'As on your ID, so the courier can find you. Letters only.'}</span>
 </div>;
}
