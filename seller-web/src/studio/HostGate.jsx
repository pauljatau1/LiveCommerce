import {useEffect,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {studio,errorText} from './api';
import {hostSession,rememberHost} from './hostSession';
import useStudioBack from './useStudioBack';
import {Skeleton} from './ui';
import HostDeviceState from './HostDeviceState';
const LEGACY_MULTI_HOST=import.meta.env.VITE_LEGACY_MULTI_HOST==='true';
export default function HostGate({id,children,preview=false}){
 const navigate=useNavigate(),goBack=useStudioBack();
 const [state,setState]=useState('checking'),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [snapshot,setSnapshot]=useState(null),[host,setHost]=useState(null),[frame,setFrame]=useState(null),[revision,setRevision]=useState(undefined);
 useEffect(()=>{
  let alive=true;
  const moved=e=>{if(e.detail?.streamId===String(id)){setFrame(old=>e.detail.frame || old);if(e.detail.host)setHost(e.detail.host);setRevision(undefined);setState('moved');setBusy(false);}};
  window.addEventListener('studio:host-moved',moved);
  if(LEGACY_MULTI_HOST)setState('ready');
  else studio.hostStatus(id).then(async status=>{
   if(!alive)return;
   setHost(status.host);setRevision(status.currentSessionId);
   if(status.ended){navigate(`/studio/recap/${id}`,{replace:true});return;}
   if(preview&&!status.live){setState('ready');return;}
   if(status.canHost&&hostSession(id)){if(preview&&status.live)navigate(`/studio/live/${id}`,{replace:true});else setState('ready');return;}
   if(status.currentSessionId){setState('other');return;}
   const claim=await studio.claimHost(id,null);
   if(!alive)return;
   if(claim.ended){navigate(`/studio/recap/${id}`,{replace:true});return;}
   rememberHost(id,claim.sessionId);setRevision(claim.revision);if(preview&&status.live)navigate(`/studio/live/${id}`,{replace:true});else setState('ready');
  }).catch(e=>{if(alive){setRevision(null);setState('other');setError(errorText(e,"Couldn't check your host device. Try again."));}});
  return()=>{alive=false;window.removeEventListener('studio:host-moved',moved);};
 },[id,navigate,preview]);
 // These screens never open media. Refresh their read-only captions, and leave
 // for the recap if the active host ends the show while this phone is waiting.
 useEffect(()=>{
  if(!['other','moved'].includes(state))return;
  let alive=true;
  const load=()=>Promise.allSettled([studio.show(id),studio.hostStatus(id)]).then(([show,status])=>{
   if(!alive)return;
   if(show.status==='fulfilled')setSnapshot(show.value);
   if(status.status==='fulfilled'){setHost(status.value.host);setRevision(status.value.currentSessionId);if(status.value.ended)navigate(`/studio/recap/${id}`,{replace:true});}
  });
  load();const timer=setInterval(load,15000);
  return()=>{alive=false;clearInterval(timer);};
 },[state,id,navigate]);
 async function move(){setBusy(true);setError('');try{
  // Claim the revision this screen showed. Fetching a new revision before the
  // CAS would silently turn a stale concurrent click into another takeover.
  const claim=await studio.claimHost(id,revision);
  if(claim.ended){navigate(`/studio/recap/${id}`,{replace:true});return;}
  rememberHost(id,claim.sessionId);setRevision(claim.revision);if(preview)navigate(`/studio/live/${id}`,{replace:true});else setState('ready');
 }catch(e){setError(errorText(e,"Couldn't move the show. Try again."));const status=await studio.hostStatus(id).catch(()=>null);if(status){setHost(status.host);setRevision(status.currentSessionId);if(status.ended)navigate(`/studio/recap/${id}`,{replace:true});}}finally{setBusy(false);}}
 if(state==='ready')return children;
 if(state==='checking')return <div className="studio-app"><main className="st-inner"><Skeleton h={80}/><p className="hint" role="status">Checking your host device…</p></main></div>;
 return <HostDeviceState moved={state==='moved'} snapshot={snapshot} host={host} frame={frame} busy={busy || revision===undefined} error={error} onMove={move} onBack={goBack} onHome={()=>navigate('/studio',{replace:true})}/>;
}
