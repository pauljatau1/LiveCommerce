import {useState} from 'react';
export default function PasswordInput(props){
 const [visible,setVisible]=useState(false);
 return <div className="password-input"><input {...props} type={visible?'text':'password'}/><button type="button" className="ib" aria-label={visible?'Hide password':'Show password'} aria-controls={props.id} aria-pressed={visible} onClick={()=>setVisible(v=>!v)}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>{visible&&<path d="M3 3l18 18"/>}</svg></button></div>;
}
