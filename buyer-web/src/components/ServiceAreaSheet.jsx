import { useState } from 'react';
import axios from 'axios';
import { API, getToken, errorMessage } from '../api';
import { Sheet } from './ui';
export default function ServiceAreaSheet({ config, state, streamId, onAddress, onClose }) {
  const [message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  const names=config?.states?.join(' and ') || 'our service area';
  const notify=async()=>{setBusy(true);try{await axios.post(`${API}/api/v2/watch/waitlist`,{state,streamId},{headers:{Authorization:`Bearer ${getToken()}`}});setMessage('We’ll tell you when delivery opens in your state.');}catch(e){setMessage(errorMessage(e,'Couldn’t save your request. Please try again.'));}finally{setBusy(false)}};
  return <Sheet title={`Delivery is ${names}-only for now`} onClose={onClose}><p>You can keep watching and chatting. Add a {names} address to bid, or we’ll tell you when we deliver to {state || 'your state'}.</p><button className="btn" onClick={onAddress}>Use a {names} address</button><button className="btn2" disabled={busy || !state} onClick={notify}>{busy?'Saving…':'Notify me'}</button>{message&&<p role="status" className="hint">{message}</p>}</Sheet>;
}
