// Persisted ownership and short action leases: a takeover cannot race a host
// control already changing an auction. Legacy behaviour is opt-in for rollback.
const {randomUUID,randomInt,createHash}=require('crypto');
const sessionHash=id=>createHash('sha256').update(String(id)).digest('hex');
const Stream=require('../models/Stream');
const Seller=require('../models/Seller');
const enabled=()=>process.env.LEGACY_MULTI_HOST!=='true';
const CONFLICT='This show is live on another device.';
const error=(message=CONFLICT,status=409)=>Object.assign(new Error(message),{status,code:status===409?'host_conflict':'host_busy'});
const free=(field)=>({$or:[{[field]:null},{[field]:{$lte:new Date()}}]});
const delay=()=>new Promise(resolve=>setTimeout(resolve,50));
const deviceName=ua=>/iPhone/i.test(ua || '')?'iPhone':/iPad/i.test(ua || '')?'iPad':/Android/i.test(ua || '')?'Android phone':/Macintosh|Mac OS/i.test(ua || '')?'Mac':/Windows/i.test(ua || '')?'Windows computer':'other device';
const hostInfo=stream=>({deviceName:stream.hostDeviceName || 'other device',startedAt:stream.hostSessionStartedAt || stream.actualStartTime || null});
const room=id=>`host_session_${sessionHash(id)}`;
async function owned(id,sellerId){
 const stream=await Stream.findOne({_id:id,seller:sellerId}).select('+hostSessionId +hostSessionRevision').lean();
 if(!stream)throw error("We couldn't find your show.",404);
 return stream;
}
// The public revision is for CAS only; never disclose the active bearer ID
// to another device. Only the winning claimant receives its secret session ID.
async function status(id,sellerId,sessionId){
 const stream=await owned(id,sellerId);
 return {host:hostInfo(stream),currentSessionId:stream.hostSessionRevision || null,canHost:!enabled()||Boolean(sessionId&&sessionHash(sessionId)===stream.hostSessionId),live:stream.status==='live',ended:stream.status==='ended'};
}
async function claim(id,sellerId,expectedSessionId,{agenda,io,userAgent,now=new Date()}={}){
 const current=await owned(id,sellerId);
 if(current.status==='ended')return {ended:true};
 if(current.hostGraceEnding)throw Object.assign(error('Your show is finishing. Open the recap in a moment.',409),{code:'show_ending'});
 if((current.hostSessionRevision || null)!==(expectedSessionId || null))throw error();
 const seller=await Seller.findById(sellerId).select('agoraUid').lean();
 const sessionId=randomUUID(),revision=randomUUID();
 const stream=await Stream.findOneAndUpdate({_id:id,seller:sellerId,hostSessionId:current.hostSessionId || null,hostSessionRevision:expectedSessionId || null,hostGraceEnding:{$ne:true},status:{$ne:'ended'},...free('hostActionUntil')},{$set:{hostSessionId:sessionHash(sessionId),hostSessionRevision:revision,hostDeviceName:deviceName(userAgent),hostSessionStartedAt:now,agoraUid:current.agoraUid || seller?.agoraUid || randomInt(1000,999000),hostAwayAt:null,hostGraceUntil:null,hostPresenceVersion:null}},{new:true}).select('+hostSessionId +hostSessionRevision').lean();
 if(!stream)throw error();
 // Invalidate the old grace nonce in the same CAS, before cancelling the job.
 // A temporarily unavailable agenda cannot strand an already-moved host.
 try{await (agenda || require('../config/agenda').agenda).cancel({name:require('./hostPresence').JOB,'data.streamId':String(id)});}catch{console.warn('[host-session] Could not cancel obsolete grace job');}
 const sockets=io || require('../socket/socketManager').getIO();
 if(current.hostSessionId)sockets?.to(`host_session_${current.hostSessionId}`).emit('host_moved',{streamId:String(id),host:hostInfo(stream)});
 sockets?.to(`stream_notifications_${id}`).emit('host_presence_changed',{streamId:String(id),away:false,graceUntil:null});
 return {sessionId,revision,uid:stream.agoraUid};
}
async function acquire(id,sellerId,sessionId){
 if(!enabled())return async()=>{};
 await owned(id,sellerId);
 if(!sessionId)throw error();
 const token=randomUUID();
 for(let attempt=0;attempt<100;attempt++){
  const stream=await Stream.findOneAndUpdate({_id:id,seller:sellerId,hostSessionId:sessionHash(sessionId),...free('hostActionUntil')},{$set:{hostActionToken:token,hostActionUntil:new Date(Date.now()+120000)}},{new:true}).select('_id').lean();
  if(stream)return ()=>Stream.updateOne({_id:id,hostActionToken:token},{$unset:{hostActionToken:1,hostActionUntil:1}});
  const current=await owned(id,sellerId);
  if(current.hostSessionId!==sessionHash(sessionId))throw error();
  await delay();
 }
 throw error('Your last action is still finishing. Try again in a moment.',503);
}
async function startLease(sellerId,id){
 const token=randomUUID();
 for(let attempt=0;attempt<200;attempt++){
  const seller=await Seller.findOneAndUpdate({_id:sellerId,...free('hostStartUntil')},{$set:{hostStartToken:token,hostStartUntil:new Date(Date.now()+120000)}},{new:true}).select('_id').lean();
  if(seller){
   const release=()=>Seller.updateOne({_id:sellerId,hostStartToken:token},{$unset:{hostStartToken:1,hostStartUntil:1}});
   try{const other=await Stream.findOne({seller:sellerId,status:'live',_id:{$ne:id}}).select('title').lean();if(other)throw Object.assign(error(`You're already live with ${other.title}. End it first.`,409),{code:'already_live'});}catch(e){await release();throw e;}
   return release;
  }
  await delay();
 }
 throw error('Your show is still starting. Try again in a moment.',503);
}
// A refused start is not a live host. Clear its reservation while the action
// lease is still held, so reopening that planned show cannot look like takeover.
async function dropReservation(id,sellerId,sessionId){
 if(!sessionId)return;
 await Stream.updateOne({_id:id,seller:sellerId,hostSessionId:sessionHash(sessionId),status:{$nin:['live','ended']}},{$set:{hostSessionId:null,hostSessionRevision:null,hostDeviceName:null,hostSessionStartedAt:null}});
}
function guard({starting=false}={}){
 return async(req,res,next)=>{
  if(!enabled()||req.user?.role!=='Seller')return next();
  let release,releaseStart;
  try{
   const id=req.params.streamId || req.params.id;
   release=await acquire(id,req.user.id,req.get('X-Host-Session-Id'));
   if(starting)releaseStart=await startLease(req.user.id,id);
   let done=false;const cleanup=()=>{if(done)return;done=true;(async()=>{try{if(starting&&res.statusCode>=400)await dropReservation(id,req.user.id,req.get('X-Host-Session-Id'));}finally{await Promise.all([release?.(),releaseStart?.()]);}})().catch(()=>console.warn('[host-session] Could not release action lease'));};
   // A disconnected HTTP client does not mean its DB action has finished.
   // Keep the lease until the response finishes (or its bounded crash lease expires).
   res.once('finish',cleanup);next();
  }catch(e){try{if(starting&&release)await dropReservation(req.params.streamId || req.params.id,req.user.id,req.get('X-Host-Session-Id'));}catch{console.warn('[host-session] Could not clear start reservation');}finally{try{await Promise.all([release?.(),releaseStart?.()]);}catch{console.warn('[host-session] Could not release action lease');}}res.status(e.status || 503).json({code:e.code || 'host_busy',message:e.status?e.message:"Couldn't check your host device. Try again."});}
 };
}
module.exports={deviceName,sessionHash,enabled,CONFLICT,status,claim,acquire,startLease,guard,room};
