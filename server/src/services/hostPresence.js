const {randomUUID} = require('crypto');
const Stream = require('../models/Stream');
const GRACE_MS = 2 * 60 * 1000;
const JOB = 'host-away-grace';
const enabled = () => process.env.LEGACY_HOST_DISCONNECT !== 'true';
const agendaOf = () => require('../config/agenda').agenda;
function announce(stream,away) {
  const io=require('../socket/socketManager').getIO();
  io?.to(`stream_notifications_${stream._id}`).emit('host_presence_changed',{streamId:String(stream._id),away,graceUntil:stream.hostGraceUntil || null});
}
async function mark(streamId,sellerId,away,{now=new Date(),agenda=agendaOf()}={}) {
  let stream=await Stream.findOne({_id:streamId,seller:sellerId}).lean();
  if(!stream)throw Object.assign(new Error("We couldn't find your show."),{status:404});
  if(stream.status==='ended')return {ended:true};
  if(stream.hostGraceEnding)return {ending:true};
  if(stream.status!=='live'||!enabled())return {away:false};
  if(!away) {
    if(stream.hostGraceUntil && new Date(stream.hostGraceUntil)<=now) {await expire({streamId,version:stream.hostPresenceVersion},{now,agenda});const after=await Stream.findById(streamId).select('status').lean();return after?.status==='ended'?{ended:true}:{ending:true};}
    const restored=await Stream.findOneAndUpdate({_id:streamId,status:'live',hostGraceEnding:{$ne:true},$or:[{hostGraceUntil:null},{hostGraceUntil:{$gt:now}}]},{$set:{hostAwayAt:null,hostGraceUntil:null,hostPresenceVersion:null}},{new:true}).lean();
    if(!restored){const after=await Stream.findById(streamId).select('status').lean();return after?.status==='ended'?{ended:true}:{ending:true};}
    await agenda.cancel({name:JOB,'data.streamId':String(streamId)});
    announce(restored,false);return {away:false};
  }
  if(stream.hostAwayAt){await agenda.schedule(stream.hostGraceUntil,JOB,{streamId:String(streamId),sellerId:String(sellerId),version:stream.hostPresenceVersion});return {away:true,graceUntil:stream.hostGraceUntil};}
  const version=randomUUID(),graceUntil=new Date(now.getTime()+GRACE_MS);
  const claimed=await Stream.findOneAndUpdate({_id:streamId,status:'live',hostAwayAt:null,hostGraceEnding:{$ne:true}},{$set:{hostAwayAt:now,hostGraceUntil:graceUntil,hostPresenceVersion:version}},{new:true}).lean();
  if(!claimed)return {away:true};
  await agenda.schedule(graceUntil,JOB,{streamId:String(streamId),sellerId:String(sellerId),version});
  announce(claimed,true);return {away:true,graceUntil};
}
async function expire({streamId,version},{now=new Date(),agenda=agendaOf(),end}={}) {
  if(!enabled())return false;
  // A returning phone and an expiring job compete for this persisted state.
  // A stale job cannot end a newer session or a show already resumed.
  const stream=await Stream.findOneAndUpdate({_id:streamId,status:'live',hostPresenceVersion:version,hostGraceUntil:{$lte:now},$or:[{hostGraceClaimUntil:null},{hostGraceClaimUntil:{$lte:now}}]},{$set:{hostGraceEnding:true,hostGraceClaimUntil:new Date(now.getTime()+30000)}},{new:true}).lean();
  if(!stream)return false;
  const io=require('../socket/socketManager').getIO();
  const req={io,params:{streamId:String(streamId)},body:{},user:{id:String(stream.seller)},app:{get:n=>n==='io'?io:null},get:()=>null};
  const res={statusCode:200,status(n){this.statusCode=n;return this;},json(data){this.data=data;return this;}};
  try {
    await (end || require('../controllers/streamController').endStream)(req,res);
    if(res.statusCode>=400)throw new Error("Couldn't finish the show yet. Please try again.");
  } catch(error) {
    await Stream.updateOne({_id:streamId,hostPresenceVersion:version},{$set:{hostGraceClaimUntil:null}});
    throw error;
  }
  await agenda.cancel({name:JOB,'data.streamId':String(streamId)});
  return true;
}
// Other studio tabs use seller sockets too. Closing Money or Me must never
// start a grace period for the camera's still-connected host socket.
async function disconnectedHost(socket,io) {
  const streamId=socket.data?.hostStreamId,sellerId=socket.data?.hostSellerId;
  if(!streamId||!sellerId)return false;
  const peers=await io.in(`stream_notifications_${streamId}`).fetchSockets();
  if(peers.some(peer=>peer.id!==socket.id&&peer.data?.hostStreamId===streamId&&peer.data?.hostSellerId===sellerId))return false;
  await mark(streamId,sellerId,true);return true;
}
module.exports={mark,expire,disconnectedHost,GRACE_MS,JOB,enabled};
