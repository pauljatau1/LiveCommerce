// T8: docs/design/Missing Screens, supplied in PR #63.
import {Icon,Problem,TopBar} from './ui';
export const hostTime=value=>value&&Number.isFinite(Date.parse(value))?new Intl.DateTimeFormat('en-NG',{hour:'numeric',minute:'2-digit',hour12:true}).format(new Date(value)).toLowerCase():'';
export default function HostDeviceState({moved,snapshot,host,frame,busy,error,onMove,onBack,onHome}){
 const show=snapshot?.show,items=snapshot?.items || [];
 const item=items.find(i=>i.bidStatus==='active') || items.find(i=>i.isVisible) || items[0];
 const position=item?`Item ${items.indexOf(item)+1} of ${items.length}`:'';
 const device=`your ${host?.deviceName || 'other device'}`,time=hostTime(host?.startedAt);
 const actions=<><button type="button" className="btn" disabled={busy} onClick={onMove}>{busy?'Moving your show…':moved?'Move it back here':'Move the show here'}</button><button type="button" className={moved?'btn2':'link'} onClick={onHome}>Back to Home</button></>;
 if(moved)return <main className="studio-app host-device-moved">
  {(frame || item?.image)&&<img className="host-device-backdrop" src={frame || item.image} alt=""/>}
  <div className="host-device-top"><span className="pill host-device-badge">Live on your other device</span></div>
  <div className="host-device-message">{Icon.moveDevice}<h1 className="f">You moved your show to another device</h1><p>It's still live there. This camera is off.</p></div>
  <div className="host-device-footer">
   {item&&<div className="host-device-current">{item.image&&<img src={item.image} alt=""/>}<div><span className="host-device-meta">{position} · {show?.type==='drop'?'Drop':'Auction'}</span><span className="host-device-name">{item.name}</span></div></div>}
   <p className="host-device-meta">Running on {device}{time?` since ${time}`:''}</p>
   {error&&<Problem text={error}/>}{actions}
  </div>
 </main>;
 return <div className="studio-app host-device-page">
  <TopBar title="Go live" onBack={onBack}/>
  <main className="st-inner host-device-page-body">
   <div className="host-device-preview" role="img" aria-label="Show live on another device">{Icon.phoneDevice}<span className="pill p-live">● LIVE{typeof show?.viewers==='number'?` · ${show.viewers}`:''}</span></div>
   {show&&<span className="cap">{show.title}{position?` · ${position}`:''}</span>}
   <div className="host-device-footer">
    <h1>Your show is live on another device</h1>
    <p>It's streaming from {device}{time?`, started at ${time}`:''}. Buyers can only see one camera at a time.</p>
    <p className="hint">If you move it here, the other device stops.</p>
    {error&&<Problem text={error}/>}{actions}
   </div>
  </main>
 </div>;
}
