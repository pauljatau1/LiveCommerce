import './Me.css';
import {useEffect,useState} from 'react';
import {Link,Navigate} from 'react-router-dom';
import {api,errorMessage} from '../api';
import {useAuth} from '../auth';
import {PHONE_HINT} from '../phone';
import {Header,Icon} from '../components/ui';
import AddressSheet,{phoneProblem} from '../components/AddressSheet';
function PasswordField({label,id,value,onChange,newPassword=false}){
 const [visible,setVisible]=useState(false);
 return <div className="fl"><label className="lab" htmlFor={id}>{label}</label><div className="profile-password"><input id={id} className="in" type={visible?'text':'password'} autoComplete={newPassword?'new-password':'current-password'} minLength={newPassword?8:undefined} maxLength={newPassword?72:undefined} required value={value} onChange={onChange}/><button type="button" className="ib" aria-label={`${visible?'Hide':'Show'} ${label.toLowerCase()}`} aria-pressed={visible} aria-controls={id} onClick={()=>setVisible(v=>!v)}>{Icon.eye}{visible&&<span className="eye-slash" aria-hidden="true"/>}</button></div></div>;
}
export default function Me(){
 const {buyer,loading,signedIn,refresh,signIn,signOut}=useAuth();
 const [profile,setProfile]=useState({}),[editing,setEditing]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[password,setPassword]=useState({currentPassword:'',newPassword:''});
 useEffect(()=>{if(buyer)setProfile({firstName:buyer.firstName || '',lastName:buyer.lastName || '',username:buyer.username || '',phoneNumber:buyer.phoneNumber || ''});},[buyer]);
 const action=async task=>{setBusy(true);setError('');setNotice('');try{await task();}catch(e){setError(errorMessage(e,'Couldn’t save your changes. Please try again.'));}finally{setBusy(false);}};
 if(loading)return <div className="center">Loading your profile…</div>;
 if(!signedIn)return <Navigate to="/signin?next=/me" replace/>;
 return <div className="app"><Header back="/" title="My profile"/><main className="wrap buyer-profile" style={{padding:'20px 16px 40px',display:'flex',flexDirection:'column',gap:20,maxWidth:560}}>
  {error&&<p className="err" role="alert">{error}</p>}{notice&&<p className="hint" role="status">{notice}</p>}
  <form className="card" style={{padding:16,display:'grid',gap:12}} onSubmit={e=>{e.preventDefault();action(async()=>{if(phoneProblem(profile.phoneNumber))throw {message:phoneProblem(profile.phoneNumber),response:{data:{message:phoneProblem(profile.phoneNumber)}}};await api.updateProfile({firstName:profile.firstName,lastName:profile.lastName,username:profile.username});await api.savePhone(profile.phoneNumber);await refresh();setNotice('Profile saved.');});}}>
   <h1 className="h2">Your details</h1>{[['firstName','First name'],['lastName','Last name'],['username','Username'],['phoneNumber','Phone']].map(([key,label])=><label className="lab" key={key}>{label}<input className="in" value={profile[key] || ''} type={key==='phoneNumber'?'tel':'text'} autoComplete={key==='phoneNumber'?'tel':key==='username'?'username':key==='firstName'?'given-name':'family-name'} onChange={e=>setProfile({...profile,[key]:e.target.value})} required={key!=='phoneNumber'}/>{key==='phoneNumber'&&<span className="hint">{PHONE_HINT}</span>}</label>)}
   <div className="fl"><span className="lab">Email</span><span className="profile-email">{buyer.email}</span></div><button className="btn" disabled={busy}>Save details</button>
  </form>
  <section className="card" style={{padding:16,display:'grid',gap:12}}><h2 className="h2">Delivery addresses</h2>{!buyer.shippingAddresses?.length&&<p className="hint">Add an address before your first bid.</p>}{buyer.shippingAddresses?.map(a=><div key={a._id} style={{borderBottom:'1px solid var(--line)',paddingBottom:12}}><p style={{margin:'0 0 8px'}}>{[a.addressLine1,a.city,a.state].filter(Boolean).join(', ')}{a.isActive&&<span className="pill profile-default">Default</span>}</p><div style={{display:'flex',gap:16,flexWrap:'wrap'}}><button className="btn2 profile-address-action" disabled={busy} onClick={()=>setEditing(a)}>Edit</button>{!a.isActive&&<button className="btn2 profile-address-action" disabled={busy} onClick={()=>action(async()=>{await api.activateAddress(a._id);await refresh();})}>Set default</button>}<button className="btn2 profile-address-action" disabled={busy} onClick={()=>{if(window.confirm('Remove this delivery address?'))action(async()=>{await api.removeAddress(a._id);await refresh();});}}>Remove</button></div></div>)}<button className="btn2" onClick={()=>setEditing({})}>Add address</button></section>
  <form className="card" style={{padding:16,display:'grid',gap:12}} onSubmit={e=>{e.preventDefault();action(async()=>{const result=await api.changePassword(password);await signIn(result.token,{quiet:true});setPassword({currentPassword:'',newPassword:''});setNotice('Password changed. Other devices have been signed out.');});}}><h2 className="h2">Change password</h2><PasswordField label="Current password" id="profile-current-password" value={password.currentPassword} onChange={e=>setPassword({...password,currentPassword:e.target.value})}/><PasswordField label="New password" id="profile-new-password" newPassword value={password.newPassword} onChange={e=>setPassword({...password,newPassword:e.target.value})}/><button className="btn2" disabled={busy}>Change password</button></form>
  <div className="profile-account-actions"><Link className="btn2" to="/wallet">Wallet</Link><button className="btn3" onClick={signOut}>Sign out</button></div>
 </main>{editing!==null&&<AddressSheet initialAddress={editing} onClose={()=>setEditing(null)} onSaved={()=>{setEditing(null);setNotice('Address saved.');}}/>}</div>;
}
