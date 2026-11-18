import test from 'node:test';
import assert from 'node:assert/strict';
import {canReload,createUpdateCheck} from '../buyer-web/src/buildUpdates.mjs';
export function updateTests(){
 test('new version waits for safe idle/route state and reloads once',async()=>{
  let reloads=0,state={sheet:true},notices=0;
  const engine=createUpdateCheck({version:'old',read:async()=> 'new',safe:()=>canReload(state),reload:()=>reloads++,notify:()=>notices++});
  await engine.check();assert.equal(engine.pending,true);assert.equal(notices,1);assert.equal(engine.apply(),false);
  for(const blocked of [{sellerLive:true},{payment:true},{editing:true},{writes:1},{visible:false}]){state=blocked;assert.equal(engine.apply(),false);}
  state={};assert.equal(engine.apply(),true);assert.equal(reloads,1);engine.apply();assert.equal(reloads,1);
 });
 test('same version and offline checks never reload',async()=>{
  for(const read of [async()=> 'current',async()=>{throw Error('offline');}]){
   const engine=createUpdateCheck({version:'current',read,safe:()=>true,reload:()=>assert.fail('unexpected reload')});await engine.check();assert.equal(engine.apply(),false);
  }
 });
}

import {installBuildUpdates,holdUpdates,trackUpdates} from '../buyer-web/src/buildUpdates.mjs';
export function browserPolicyTests(){
 test('installed checker respects actual dialog, focus, payment, writes and route policy',async()=>{
  const originalNow=Date.now;let now=0,reloads=0,requests=0,dialog=true,payment=false;
  Date.now=()=>now;
  const doc=new EventTarget();Object.assign(doc,{visibilityState:'visible',activeElement:{tagName:'BODY'},querySelector:selector=>selector.includes('role="dialog"')?dialog:payment});
  const win=new EventTarget(),intervals=new Map();
  Object.assign(win,{location:{pathname:'/wallet',reload:()=>reloads++},history:{pushState(_state,_unused,path){win.location.pathname=path;},replaceState(_state,_unused,path){win.location.pathname=path;}},fetch:async()=>{requests++;return {ok:true,json:async()=>({version:'next'})}},setTimeout:fn=>fn(),setInterval:(fn,ms)=>{intervals.set(ms,fn);return ms;},clearInterval:id=>intervals.delete(id)});
  let stop,release;
  try{
   stop=installBuildUpdates({version:'old',win,doc});await new Promise(resolve=>setImmediate(resolve));
   assert.equal(win.__appUpdateReady,true);now=11000;intervals.get(1000)();assert.equal(reloads,0);
   dialog=false;doc.activeElement={tagName:'INPUT'};win.history.pushState({},'', '/orders');assert.equal(reloads,0);
   doc.activeElement={tagName:'BODY'};payment=true;win.history.pushState({},'', '/orders');assert.equal(reloads,0);
   payment=false;release=holdUpdates();win.history.pushState({},'', '/orders');assert.equal(reloads,0);release();
   let requestHook,responseHook;trackUpdates({interceptors:{request:{use:fn=>requestHook=fn},response:{use:fn=>responseHook=fn}}});const config=requestHook({method:'post'});
   win.history.pushState({},'', '/orders');assert.equal(reloads,0);responseHook({config});
   doc.visibilityState='hidden';win.history.pushState({},'', '/orders');assert.equal(reloads,0);
   const before=requests;intervals.get(300000)();assert.equal(requests,before);doc.visibilityState='visible';doc.dispatchEvent(new Event('visibilitychange'));await new Promise(resolve=>setImmediate(resolve));assert(requests>before);
   win.history.pushState({},'', '/orders');assert.equal(reloads,1);
  }finally{release?.();stop?.();Date.now=originalNow;}
 });
 test('live seller gets an update note; recap route can reload',async()=>{
  let reloads=0;const doc=new EventTarget();Object.assign(doc,{visibilityState:'visible',activeElement:{tagName:'BODY'},querySelector:()=>null});
  const win=new EventTarget();Object.assign(win,{location:{pathname:'/studio/live/show',reload:()=>reloads++},history:{pushState(_s,_u,path){win.location.pathname=path;},replaceState(){}},fetch:async()=>({ok:true,json:async()=>({version:'new'})}),setTimeout:fn=>fn(),setInterval:()=>1,clearInterval(){}});
  const stop=installBuildUpdates({version:'old',seller:true,win,doc});
  try{await new Promise(resolve=>setImmediate(resolve));assert.equal(win.__appUpdateReady,true);win.history.pushState({},'', '/studio/live/show');assert.equal(reloads,0);win.history.pushState({},'', '/studio/recap/show');assert.equal(reloads,1);}finally{stop();}
 });
}

import {readFileSync} from 'node:fs';
test('independent Render app roots ship identical updater and build plugin',()=>{
 for(const file of ['src/buildUpdates.mjs','buildVersion.mjs'])assert.equal(readFileSync(new URL('../buyer-web/'+file,import.meta.url),'utf8'),readFileSync(new URL('../seller-web/'+file,import.meta.url),'utf8'));
});
