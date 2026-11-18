const mongoose=require('mongoose'),express=require('express'),request=require('supertest');
const {MongoMemoryReplSet}=require('mongodb-memory-server');
const mockAgenda={cancel:jest.fn(async()=>1)};
jest.mock('@/config/agenda',()=>({agenda:mockAgenda}));
const Seller=require('@models/Seller'),Stream=require('@models/Stream');
const sessions=require('@/services/hostSessions');
let db,seller,show,app;const emitted=[];const io={to:room=>({emit:(event,payload)=>emitted.push({room,event,payload})})};
beforeAll(async()=>{db=await MongoMemoryReplSet.create({replSet:{count:1},binary:{version:'7.0.3'}});await mongoose.connect(db.getUri());});
afterAll(async()=>{await mongoose.disconnect();await db.stop();});
beforeEach(async()=>{
 jest.clearAllMocks();emitted.length=0;await Promise.all([Seller,Stream].map(m=>m.deleteMany({})));
 seller=(await Seller.collection.insertOne({storeName:'Sade',agoraUid:1234})).insertedId;
 show=await Stream.create({seller,title:'Friday dresses',category:'Women',channelName:'test-host',status:'live',type:'auction'});
 app=express();app.use(express.json());app.use((req,res,next)=>{req.user={id:String(seller),role:'Seller'};next();});
 const guard=sessions.guard();for(const path of ['token','resume','run-again','start-bidding','end-now','presence'])app.post('/:streamId/'+path,guard,(req,res)=>res.json({success:true}));
 app.post('/:streamId/start',sessions.guard({starting:true}),async(req,res)=>{await Stream.updateOne({_id:req.params.streamId},{$set:{status:'live'}});res.json({success:true});});
});
test('only the holder can act; takeover keeps uid, emits host_moved and cancels grace',async()=>{
 const first=await sessions.claim(show.id,seller,null,{agenda:mockAgenda,io});
 const publicStatus=await sessions.status(show.id,seller);expect(publicStatus.currentSessionId).not.toBe(first.sessionId);expect(publicStatus.canHost).toBe(false);
 const stored=await Stream.findById(show.id).select('+hostSessionId').lean();expect(stored.hostSessionId).toBe(sessions.sessionHash(first.sessionId));expect(stored.hostSessionId).not.toBe(first.sessionId);
 await request(app).post(`/${show.id}/token`).set('X-Host-Session-Id',stored.hostSessionId).expect(409);
 await request(app).post(`/${show.id}/token`).set('X-Host-Session-Id',publicStatus.currentSessionId).expect(409);
 await Stream.updateOne({_id:show._id},{$set:{hostAwayAt:new Date(),hostGraceUntil:new Date(Date.now()+120000),hostPresenceVersion:'away'}});
 for(const path of ['token','resume','run-again','start-bidding','end-now','presence']){
  await request(app).post(`/${show.id}/${path}`).set('X-Host-Session-Id',first.sessionId).expect(200);
  const stale=await request(app).post(`/${show.id}/${path}`).set('X-Host-Session-Id','foreign').expect(409);expect(stale.body.message).toBe(sessions.CONFLICT);
 }
 await Stream.collection.updateOne({_id:show._id},{$set:{showNotes:{howToBuy:'Tap Bid to join'},showNotesPinned:true,products:[{product:{productId:'dress'},minBid:1000,maxBid:10000,bidStatus:'active',auctionEndsAt:new Date(Date.now()+60000),currentBid:5000}],chatInteractions:[{id:'chat',type:'comment',user:'Ada',content:'Lovely dress',data:{}}]}});
 const before=await Stream.findById(show.id).lean();
 const second=await sessions.claim(show.id,seller,first.revision,{agenda:mockAgenda,io});
 const after=await Stream.findById(show.id).lean();for(const field of ['products','chatInteractions','showNotes','showNotesPinned'])expect(after[field]).toEqual(before[field]);
 expect(await require('@/services/hostPresence').expire({streamId:show.id,version:'away'},{now:new Date(Date.now()+180000),agenda:mockAgenda})).toBe(false);
 expect(second.uid).toBe(first.uid);expect(second.sessionId).not.toBe(first.sessionId);
 expect(emitted).toContainEqual({room:sessions.room(first.sessionId),event:'host_moved',payload:{streamId:show.id,host:expect.objectContaining({deviceName:'other device'})}});
 expect(mockAgenda.cancel).toHaveBeenCalledWith({name:'host-away-grace','data.streamId':show.id});
 expect(await Stream.findById(show.id).lean()).toMatchObject({hostAwayAt:null,hostGraceUntil:null,hostPresenceVersion:null,status:'live'});
 for(const path of ['token','resume','run-again','start-bidding','end-now','presence'])await request(app).post(`/${show.id}/${path}`).set('X-Host-Session-Id',first.sessionId).expect(409);
 await request(app).post(`/${show.id}/token`).set('X-Host-Session-Id',second.sessionId).expect(200);
});
test('simultaneous takeovers have exactly one winner',async()=>{
 const first=await sessions.claim(show.id,seller,null,{agenda:mockAgenda,io});
 const results=await Promise.allSettled([sessions.claim(show.id,seller,first.revision,{agenda:mockAgenda,io}),sessions.claim(show.id,seller,first.revision,{agenda:mockAgenda,io})]);
 expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(results.find(r=>r.status==='rejected').reason.status).toBe(409);
 const current=await sessions.status(show.id,seller,results.find(r=>r.status==='fulfilled').value.sessionId);expect(current.canHost).toBe(true);
});
test('takeover cannot race an in-flight money/control action',async()=>{
 const first=await sessions.claim(show.id,seller,null,{agenda:mockAgenda,io}),release=await sessions.acquire(show.id,seller,first.sessionId);
 await expect(sessions.claim(show.id,seller,first.revision,{agenda:mockAgenda,io})).rejects.toMatchObject({status:409});await release();
 expect((await sessions.claim(show.id,seller,first.revision,{agenda:mockAgenda,io})).sessionId).not.toBe(first.sessionId);
});
test('another live show is refused with its title',async()=>{
 const second=await Stream.create({seller,title:'Saturday shoes',category:'Shoes',channelName:'second',status:'scheduled',type:'auction'});
 const host=await sessions.claim(second.id,seller,null,{agenda:mockAgenda,io});
 const response=await request(app).post(`/${second.id}/start`).set('X-Host-Session-Id',host.sessionId).expect(409);expect(response.body.message).toBe("You're already live with Friday dresses. End it first.");expect((await Stream.findById(second.id)).status).toBe('scheduled');expect(response.body.code).toBe('already_live');expect((await sessions.status(second.id,seller)).currentSessionId).toBeNull();
});
test('two concurrent starts cannot leave two live shows',async()=>{
 await Stream.updateOne({_id:show.id},{$set:{status:'scheduled'}});
 const second=await Stream.create({seller,title:'Saturday shoes',category:'Shoes',channelName:'second',status:'scheduled',type:'auction'});
 const firstHost=await sessions.claim(show.id,seller,null,{agenda:mockAgenda,io}),secondHost=await sessions.claim(second.id,seller,null,{agenda:mockAgenda,io});
 const responses=await Promise.all([request(app).post(`/${show.id}/start`).set('X-Host-Session-Id',firstHost.sessionId),request(app).post(`/${second.id}/start`).set('X-Host-Session-Id',secondHost.sessionId)]);
 expect(responses.map(r=>r.status).sort()).toEqual([200,409]);expect(await Stream.countDocuments({seller,status:'live'})).toBe(1);
});
test('missing session is refused; ended shows cannot be claimed',async()=>{
 await request(app).post(`/${show.id}/token`).expect(409);await Stream.updateOne({_id:show.id},{$set:{status:'ended'}});expect(await sessions.claim(show.id,seller,null,{agenda:mockAgenda,io})).toEqual({ended:true});
});
test('host device captions use a whitelisted label and the successful claim time',async()=>{
 const now=new Date('2026-11-18T18:02:00Z');
 const host=await sessions.claim(show.id,seller,null,{agenda:mockAgenda,io,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',now});
 const status=await sessions.status(show.id,seller,host.sessionId);
 expect(status.host).toEqual({deviceName:'iPhone',startedAt:now});
 expect(status.canHost).toBe(true);
 expect(sessions.deviceName('<script>untrusted</script>')).toBe('other device');
 expect(sessions.deviceName('Mozilla Android')).toBe('Android phone');
});
