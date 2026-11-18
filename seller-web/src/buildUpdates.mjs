let activeWrites=0,activePayments=0;
export function holdUpdates(){activePayments++;let held=true;return ()=>{if(held){held=false;activePayments=Math.max(0,activePayments-1);}};}
export function trackUpdates(http){
 http.interceptors.request.use(config=>{if(!['get','head','options'].includes((config.method || 'get').toLowerCase())){activeWrites++;config.__updateWrite=true;}return config;});
 const finish=config=>{if(config?.__updateWrite){activeWrites=Math.max(0,activeWrites-1);delete config.__updateWrite;}};
 http.interceptors.response.use(r=>{finish(r.config);return r;},e=>{finish(e.config);return Promise.reject(e);});
}
export function canReload({visible=true,sellerLive=false,sheet=false,payment=false,editing=false,writes=0}={}){return visible&&!sellerLive&&!sheet&&!payment&&!editing&&writes===0;}
export function createUpdateCheck({version,read,reload,safe,notify=()=>{}}){
 let pending=false,loading=false,reloaded=false;
 return {get pending(){return pending;},async check(){if(loading)return;loading=true;try{const next=await read();if(next&&next!==version){pending=true;notify();}}catch{/* Offline and deploy-in-progress checks are silent. */}finally{loading=false;}},apply(){if(pending&&!reloaded&&safe()){reloaded=true;reload();return true;}return false;}};
}
export function installBuildUpdates({version,seller=false,win=window,doc=document}={}){
 if(!version)return ()=>{};
 let idleAt=Date.now(),stopped=false;
 const safe=()=>canReload({visible:doc.visibilityState!=='hidden',sellerLive:seller&&/^\/studio\/live\//.test(win.location.pathname),sheet:Boolean(doc.querySelector('[role="dialog"],.sheet,.paystack-container')),payment:activePayments>0||Boolean(doc.querySelector('[data-update-blocked="true"],iframe[src*="paystack"],iframe[src*="checkout"]')),editing:/^(INPUT|TEXTAREA|SELECT)$/.test(doc.activeElement?.tagName)||Boolean(doc.activeElement?.isContentEditable),writes:activeWrites});
 const engine=createUpdateCheck({version,read:async()=>{const r=await win.fetch(`/version.json?_=${Date.now()}`,{cache:'no-store'});if(!r.ok)return null;return (await r.json()).version;},reload:()=>win.location.reload(),safe,notify:()=>{win.__appUpdateReady=true;win.dispatchEvent(new CustomEvent('app:update-ready'));}});
 const check=()=>{if(!stopped&&doc.visibilityState!=='hidden')engine.check();};
 const activity=()=>{idleAt=Date.now();};
 const route=()=>{activity();engine.apply();};
 const visible=()=>{check();activity();};
 const originalPush=win.history.pushState,originalReplace=win.history.replaceState;
 // Wait for React to commit the new route before evaluating its safety markers.
 const laterRoute=()=>win.setTimeout(route,0);
 win.history.pushState=function(...args){const value=originalPush.apply(this,args);laterRoute();return value;};
 win.history.replaceState=function(...args){const value=originalReplace.apply(this,args);laterRoute();return value;};
 win.addEventListener('focus',visible);doc.addEventListener('visibilitychange',visible);win.addEventListener('popstate',laterRoute);
 ['pointerdown','keydown','input'].forEach(e=>doc.addEventListener(e,activity,true));
 const timer=win.setInterval(check,300000),idle=win.setInterval(()=>{if(Date.now()-idleAt>=10000)engine.apply();},1000);
 check();
 return ()=>{stopped=true;win.clearInterval(timer);win.clearInterval(idle);win.removeEventListener('focus',visible);doc.removeEventListener('visibilitychange',visible);win.removeEventListener('popstate',laterRoute);['pointerdown','keydown','input'].forEach(e=>doc.removeEventListener(e,activity,true));win.history.pushState=originalPush;win.history.replaceState=originalReplace;};
}
