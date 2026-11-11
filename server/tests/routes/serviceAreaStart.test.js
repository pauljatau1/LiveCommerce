const mongoose=require('mongoose');
const express=require('express');
const request=require('supertest');
const {MongoMemoryServer}=require('mongodb-memory-server');
const Seller=require('@models/Seller');
const Stream=require('@models/Stream');
const {startStream}=require('@/controllers/streamController');
let mongo,app,sellerId,show;
beforeAll(async()=>{mongo=await MongoMemoryServer.create({binary:{version:'7.0.3'}});if(mongoose.connection.readyState)await mongoose.disconnect();await mongoose.connect(mongo.getUri());app=express();app.post('/start/:streamId',(req,res,next)=>{req.user={id:sellerId,role:'Seller'};next()},startStream);});
afterAll(async()=>{await mongoose.disconnect();await mongo.stop()});
beforeEach(async()=>{await Seller.deleteMany({});await Stream.deleteMany({});sellerId=(await Seller.collection.insertOne({firstName:'Sade',email:'sade-start@example.test',sellerAddress:{state:'Ogun',city:'Ota',addressLine1:'1 Test Street'}})).insertedId;show=await Stream.create({seller:sellerId,title:'Test show',category:'Women',channelName:'launch-test',status:'ended',type:'auction'});});
it('refuses go-live outside the pickup area before changing a show',async()=>{const r=await request(app).post(`/start/${show._id}`).expect(422);expect(r.body).toMatchObject({code:'out_of_area',message:expect.stringMatching(/Update your pickup address/)});expect((await Stream.findById(show._id).lean()).status).toBe('ended');});
it('lets Lagos and newly enabled Ogun pass the area check',async()=>{
 await Seller.updateOne({_id:sellerId},{$set:{'sellerAddress.state':'Lagos'}});
 expect((await request(app).post(`/start/${show._id}`).expect(400)).body.message).toMatch(/already ended/);
 await Seller.updateOne({_id:sellerId},{$set:{'sellerAddress.state':'Ogun'}});
 const before=process.env.SERVICE_STATES;try{process.env.SERVICE_STATES='Lagos,Ogun';expect((await request(app).post(`/start/${show._id}`).expect(400)).body.message).toMatch(/already ended/);}finally{if(before===undefined)delete process.env.SERVICE_STATES;else process.env.SERVICE_STATES=before;}
});
