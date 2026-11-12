const mongoose=require('mongoose');
const {MongoMemoryServer}=require('mongodb-memory-server');
const request=require('supertest');
const jwt=require('jsonwebtoken');
const {app}=require('@/app');
const Buyer=require('@models/Buyer'),Seller=require('@models/Seller');
let mongo,buyer,seller,buyerToken,sellerToken;
const payload={addressType:'home',country:'NG',state:'Lagos',city:'Lekki',lga:'Eti-Osa',addressLine1:'12 Test Street',phoneNumber:'08031234567'};
beforeAll(async()=>{mongo=await MongoMemoryServer.create({binary:{version:'7.0.3'}});if(mongoose.connection.readyState)await mongoose.disconnect();await mongoose.connect(mongo.getUri());});
afterAll(async()=>{await mongoose.disconnect();await mongo.stop();});
beforeEach(async()=>{await Promise.all([Buyer.deleteMany({}),Seller.deleteMany({})]);buyer=(await Buyer.collection.insertOne({email:'buyer@example.test',firstName:'Ada',phoneNumber:'08031234567',shippingAddresses:[]})).insertedId;seller=(await Seller.collection.insertOne({email:'seller@example.test',firstName:'Sade'})).insertedId;buyerToken=jwt.sign({id:buyer,role:'Buyer'},process.env.JWT_SECRET);sellerToken=jwt.sign({id:seller,role:'Seller'},process.env.JWT_SECRET);});
test('buyer add/update accepts listed areas, saves canonical LGA and refuses arbitrary text or forged LGA',async()=>{
 const post=body=>request(app).post('/api/v2/buyers/addresses').set('Authorization',`Bearer ${buyerToken}`).send(body);
 for(const body of [{...payload,city:'Made-up Place'},{...payload,lga:'Ikeja'}]){const result=await post(body);expect(result.status).toBe(400);expect(result.body.message).toBe('Choose your area from the list.');}
 const created=await post({...payload,lga:undefined});expect(created.status).toBe(201);let address=(await Buyer.findById(buyer).lean()).shippingAddresses[0];expect(address).toMatchObject({city:'Lekki',lga:'Eti-Osa'});
 let result=await request(app).put(`/api/v2/buyers/addresses/${address._id}`).set('Authorization',`Bearer ${buyerToken}`).send({city:'Yaba',lga:'Lagos Mainland'});expect(result.status).toBe(200);address=(await Buyer.findById(buyer).lean()).shippingAddresses[0];expect(address).toMatchObject({city:'Yaba',lga:'Lagos Mainland'});
 result=await request(app).put(`/api/v2/buyers/addresses/${address._id}`).set('Authorization',`Bearer ${buyerToken}`).send({city:'Anything'});expect(result.status).toBe(400);expect(result.body.message).toBe('Choose your area from the list.');
});
test('seller pickup save records area/LGA in both addresses and returns it on read',async()=>{
 const call=body=>request(app).put('/api/v2/studio/onboarding/pickup').set('Authorization',`Bearer ${sellerToken}`).send(body);
 expect((await call({state:'Lagos',city:'Anything',addressLine1:'1 Test Road',phone:'08031234567'})).body.message).toBe('Choose your area from the list.');
 const result=await call({state:'Lagos',city:'Victoria Island',lga:'Eti-Osa',addressLine1:'1 Test Road',landmark:'Near gate',phone:'08031234567'});expect(result.status).toBe(200);expect(result.body.pickup).toMatchObject({city:'Victoria Island',lga:'Eti-Osa'});
 const saved=await Seller.findById(seller).lean();expect(saved.warehouseDetails.address).toMatchObject({city:'Victoria Island',lga:'Eti-Osa'});expect(saved.businessAddress.lga).toBe('Eti-Osa');
});
test('an existing address with no LGA and an old city is returned without refusal',async()=>{
 await Buyer.updateOne({_id:buyer},{$push:{shippingAddresses:{...payload,city:'Legacy location',lga:undefined,isActive:true}}});
 const result=await request(app).get('/api/v2/buyers/addresses').set('Authorization',`Bearer ${buyerToken}`);expect(result.status).toBe(200);expect(JSON.stringify(result.body)).toContain('Legacy location');
});
