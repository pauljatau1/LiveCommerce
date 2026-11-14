const mongoose=require('mongoose'),express=require('express'),request=require('supertest');
const {MongoMemoryReplSet}=require('mongodb-memory-server');
const mockAgenda={schedule:jest.fn(async()=>({})),cancel:jest.fn(async()=>1),jobs:jest.fn(async()=>[])};
jest.mock('@/config/agenda',()=>({agenda:mockAgenda}));
let mockSeller;
jest.mock('@/middlewares/authMiddleware',()=>({verifyToken:(req,res,next)=>{req.user={id:String(mockSeller),role:'Seller'};next();},isSeller:(req,res,next)=>next(),isBuyer:(req,res,next)=>next()}));
jest.mock('@/services/deliveryService',()=>({...jest.requireActual('@/services/deliveryService'),settleShow:jest.fn(async()=>[])}));
const Seller=require('@models/Seller'),Buyer=require('@models/Buyer'),Product=require('@models/Product'),Stream=require('@models/Stream'),Order=require('@models/Order'),ShowDelivery=require('@/models/ShowDelivery');
const service=require('@/services/hostPresence');let db,show,product,buyer;const now=new Date('2026-11-14T12:00:00Z');
beforeAll(async()=>{const io={to:()=>io,in:()=>io,emit:jest.fn(),fetchSockets:async()=>[]};jest.spyOn(require('@/socket/socketManager'),'getIO').mockReturnValue(io);db=await MongoMemoryReplSet.create({replSet:{count:1},binary:{version:'7.0.3'}});await mongoose.connect(db.getUri());await Promise.all([Order,ShowDelivery].map(m=>m.createCollection()));});
afterAll(async()=>{require('@/services/auctionClock').clock().shutdown();await mongoose.disconnect();await db.stop();});
beforeEach(async()=>{jest.clearAllMocks();await Promise.all([Seller,Buyer,Product,Stream,Order,ShowDelivery].map(m=>m.deleteMany({})));mockSeller=(await Seller.collection.insertOne({firstName:'Sade',lastName:'Test',storeName:'Sade shop',phoneNumber:'08031234567',email:'host@example.test',warehouseDetails:{address:{addressLine1:'1 Allen Avenue',city:'Ikeja',state:'Lagos'},contactNumber:'08031234567'}})).insertedId;product=(await Product.collection.insertOne({seller:mockSeller,name:'Adire Gown',category:'Women',price:10000,stock:2,status:'active',images:[],inventory:{sku:'GRACE'},seo:{slug:'grace'}})).insertedId;show=await Stream.create({seller:mockSeller,title:'Grace show',category:'Women',channelName:'grace',type:'auction',status:'live',products:[{product:{productId:product,name:'Adire Gown',quantity:2},minBid:1000,maxBid:100000,bidStatus:'active',isVisible:true}]});buyer=await Buyer.create({firstName:'Ada',lastName:'Test',username:'grace-buyer',email:'buyer@example.test',authProvider:'google',phoneNumber:'08031234567',wallet:{balance:50000,onHoldAmount:0},shippingAddresses:[{addressLine1:'2 Admiralty Way',city:'Lekki',state:'Lagos',country:'NG'}]});});
test('hidden schedules a persisted two-minute deadline; return cancels it; stale job cannot end show',async()=>{const away=await service.mark(show._id,mockSeller,true,{now});expect(new Date(away.graceUntil).getTime()-now.getTime()).toBe(120000);expect(mockAgenda.schedule).toHaveBeenCalledWith(away.graceUntil,service.JOB,expect.objectContaining({streamId:String(show._id)}));const data=mockAgenda.schedule.mock.calls[0][2];await service.mark(show._id,mockSeller,false,{now:new Date(now.getTime()+60000)});expect(mockAgenda.cancel).toHaveBeenCalled();expect(await service.expire(data,{now:new Date(now.getTime()+120001)})).toBe(false);expect((await Stream.findById(show._id).lean()).status).toBe('live');});
test('no return ends via normal auction settlement and exposes the recap',async()=>{const bids=require('@/services/streamBidService');expect(await bids.placeBid({streamId:show._id,productId:String(product),buyer,bidAmount:5000,maxBid:100000})).toMatchObject({ok:true});await service.mark(show._id,mockSeller,true,{now});const data=mockAgenda.schedule.mock.calls[0][2];expect(await service.expire(data,{now:new Date(now.getTime()+120001)})).toBe(true);expect((await Stream.findById(show._id).lean()).status).toBe('ended');expect(await Order.countDocuments()).toBe(1);expect((await Buyer.findById(buyer._id).lean()).wallet.onHoldAmount).toBe(0);const app=express();app.use('/studio',require('@/routes/studioRoutes'));const r=await request(app).get(`/studio/shows/${show._id}/recap`).expect(200);expect(r.body.itemsSold).toBe(1);expect(r.body.show.status).toBe('ended');expect(await service.mark(show._id,mockSeller,false,{now:new Date(now.getTime()+130000)})).toMatchObject({ended:true});});
test('only the owner can change presence',async()=>{await expect(service.mark(show._id,new mongoose.Types.ObjectId(),true,{now})).rejects.toMatchObject({status:404});expect(mockAgenda.schedule).not.toHaveBeenCalled();});

test('expiry waits for an in-flight settlement without releasing money, then retries safely',async()=>{
 const bids=require('@/services/streamBidService');await bids.placeBid({streamId:show._id,productId:String(product),buyer,bidAmount:5000,maxBid:100000});
 await Stream.updateOne({_id:show._id},{$set:{'products.0.bidStatus':'ongoing'}});await service.mark(show._id,mockSeller,true,{now});const data=mockAgenda.schedule.mock.calls[0][2],due=new Date(now.getTime()+120001);
 await expect(service.expire(data,{now:due})).rejects.toThrow('finish the show');expect((await Buyer.findById(buyer._id).lean()).wallet.onHoldAmount).toBe(5000);expect((await Stream.findById(show._id).lean()).status).toBe('live');expect(await service.mark(show._id,mockSeller,false,{now:due})).toEqual({ending:true});
 expect(await require('@/services/auctionOrderService').createAuctionOrder({streamId:show._id,productId:String(product),buyerId:buyer._id,bidAmount:5000})).toMatchObject({success:true});
 await Stream.updateOne({_id:show._id},{$set:{'products.0.bidStatus':'ended'}});expect(await service.expire(data,{now:new Date(due.getTime()+10000)})).toBe(true);expect(await Order.countDocuments()).toBe(1);expect((await Buyer.findById(buyer._id).lean()).wallet.balance).toBe(45000);
});

test('closing an unrelated studio tab or an old host socket cannot pause the active host',async()=>{
 expect(await service.disconnectedHost({id:'me',data:{}},{in:()=>{throw Error('unrelated tab queried')}})).toBe(false);
 const socket={id:'old',data:{hostStreamId:String(show._id),hostSellerId:String(mockSeller)}};
 expect(await service.disconnectedHost(socket,{in:()=>({fetchSockets:async()=>[{id:'current',data:socket.data}]})})).toBe(false);expect(mockAgenda.schedule).not.toHaveBeenCalled();
 expect(await service.disconnectedHost(socket,{in:()=>({fetchSockets:async()=>[]})})).toBe(true);expect(mockAgenda.schedule).toHaveBeenCalled();
});

test('legacy disconnect setting switches the new grace behaviour off',async()=>{
 process.env.LEGACY_HOST_DISCONNECT='true';
 try{expect(await service.mark(show._id,mockSeller,true,{now})).toEqual({away:false});expect(mockAgenda.schedule).not.toHaveBeenCalled();expect(await service.expire({streamId:String(show._id),version:'old'},{now})).toBe(false);}finally{delete process.env.LEGACY_HOST_DISCONNECT;}
});
