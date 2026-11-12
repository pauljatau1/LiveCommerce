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

test('Google addresses save coordinates, accept a mapped neighbourhood, and retain metadata on read',async()=>{
 const google={...payload,city:'Lekki Phase 1',latitude:6.45,longitude:3.47,addressSource:'google',formattedAddress:'12 Test Street, Lekki Phase 1, Lagos'};
 const response=await request(app).post('/api/v2/buyers/addresses').set('Authorization',`Bearer ${buyerToken}`).send(google);expect(response.status).toBe(201);
 let address=(await Buyer.findById(buyer).lean()).shippingAddresses[0];expect(address).toMatchObject({city:google.city,latitude:6.45,longitude:3.47,addressSource:'google'});
 const edited=await request(app).put(`/api/v2/buyers/addresses/${address._id}`).set('Authorization',`Bearer ${buyerToken}`).send({...payload});expect(edited.status).toBe(200);
 address=(await Buyer.findById(buyer).lean()).shippingAddresses[0];expect(address.latitude).toBeNull();expect(address.addressSource).toBe('manual');
 const result=await request(app).put('/api/v2/studio/onboarding/pickup').set('Authorization',`Bearer ${sellerToken}`).send({...google,phone:'08031234567'});expect(result.status).toBe(200);expect(result.body.pickup).toMatchObject({latitude:6.45,longitude:3.47,addressSource:'google'});
});
test('Google coordinates do not bypass service-state or range validation',async()=>{
 const save=body=>request(app).post('/api/v2/buyers/addresses').set('Authorization',`Bearer ${buyerToken}`).send({...payload,addressSource:'google',latitude:6.5,longitude:3.4,...body});
 expect((await save({state:'Abuja'})).status).toBe(422);
 expect((await save({latitude:999})).status).toBe(400);
 expect((await save({longitude:null})).status).toBe(400);
});
test('inline phone save is buyer-only and normalises Nigerian numbers',async()=>{
 const save=(token,phoneNumber)=>request(app).put('/api/v2/buyers/profile/phone').set('Authorization',`Bearer ${token}`).send({phoneNumber});
 expect((await save(sellerToken,'08031234567')).status).toBe(403);
 expect((await save(buyerToken,'123')).status).toBe(400);
 expect((await save(buyerToken,'0803 123 4567')).status).toBe(200);
 expect((await Buyer.findById(buyer)).phoneNumber).toBe('08031234567');
});
test('change password requires current password and invalidates other sessions',async()=>{
 const bcrypt=require('bcrypt');await Buyer.updateOne({_id:buyer},{$set:{password:await bcrypt.hash('OldPassword123',10)}});
 const change=body=>request(app).post('/api/v2/buyers/profile/change-password').set('Authorization',`Bearer ${buyerToken}`).send(body);
 expect((await change({currentPassword:'wrong',newPassword:'NewPassword123'})).status).toBe(400);
 const result=await change({currentPassword:'OldPassword123',newPassword:'NewPassword123'});expect(result.status).toBe(200);expect(result.body.token).toBeTruthy();
 expect((await request(app).get('/api/v2/buyers/profile').set('Authorization',`Bearer ${buyerToken}`)).status).toBe(401);
 expect((await request(app).get('/api/v2/buyers/profile').set('Authorization',`Bearer ${result.body.token}`)).status).toBe(200);
});
test('guest and seller outside-state notifications deduplicate',async()=>{
 const Waitlist=require('@models/DeliveryWaitlist');await Waitlist.deleteMany({});
 for(let i=0;i<2;i++)expect((await request(app).post('/api/v2/watch/waitlist').send({state:'Ogun',email:'guest@example.test'})).status).toBe(200);
 for(let i=0;i<2;i++)expect((await request(app).post('/api/v2/watch/waitlist').set('Authorization',`Bearer ${sellerToken}`).send({state:'Ogun'})).status).toBe(200);
 expect(await Waitlist.countDocuments({state:'ogun'})).toBe(2);
});

test.each(['8031234567','+2348031234567','0803123456','abc08031234567'])('buyer and seller phone writes reject %s with the same message',async phone=>{
 const message=require('@utils/phone').PHONE_ERROR;
 const buyerPhone=await request(app).put('/api/v2/buyers/profile/phone').set('Authorization',`Bearer ${buyerToken}`).send({phoneNumber:phone});
 const buyerAddress=await request(app).post('/api/v2/buyers/addresses').set('Authorization',`Bearer ${buyerToken}`).send({...payload,phoneNumber:phone});
 const sellerPickup=await request(app).put('/api/v2/studio/onboarding/pickup').set('Authorization',`Bearer ${sellerToken}`).send({...payload,phone});
 for(const result of [buyerPhone,buyerAddress,sellerPickup]){expect(result.status).toBe(400);expect(result.body.message).toBe(message);}
});

test('pickup saves one normalised courier phone in warehouse and account fields',async()=>{
 await Seller.updateOne({_id:seller},{$set:{phoneNumber:null,'warehouseDetails.contactNumber':'081085565429'}});
 const result=await request(app).put('/api/v2/studio/onboarding/pickup').set('Authorization',`Bearer ${sellerToken}`).send({...payload,phone:'0803 123 4567'});expect(result.status).toBe(200);
 const saved=await Seller.findById(seller).lean();expect(saved.phoneNumber).toBe('08031234567');expect(saved.warehouseDetails.contactNumber).toBe(saved.phoneNumber);
});
test('courier phone repair updates only the owned address and works with legacy city data',async()=>{
 await Buyer.updateOne({_id:buyer},{$push:{shippingAddresses:{...payload,city:'Old city label',phoneNumber:'081085565429',isActive:true}}});const address=(await Buyer.findById(buyer)).shippingAddresses[0];
 const call=(token,phoneNumber,addressId=String(address._id))=>request(app).put('/api/v2/buyers/profile/courier-phone').set('Authorization',`Bearer ${token}`).send({addressId,phoneNumber});
 expect((await call(buyerToken,'081085565429')).status).toBe(400);expect((await call(sellerToken,'08031234567')).status).toBe(403);
 expect((await call(buyerToken,'0803 123 4567',String(new mongoose.Types.ObjectId()))).status).toBe(404);
 expect((await call(buyerToken,'0803 123 4567')).status).toBe(200);const saved=await Buyer.findById(buyer).lean();expect(saved.shippingAddresses[0]).toMatchObject({city:'Old city label',phoneNumber:'08031234567'});
});
test('the real delivery-quote route returns a price for a Lagos warehouse-only contact',async()=>{
 const sb=require('@services/shipbubble'),spies=[];const stub=(name,value)=>{const spy=jest.spyOn(sb,name).mockImplementation(value);spies.push(spy);};
 stub('isConfigured',()=>true);let code=0;stub('validateAddress',async()=>({address_code:++code}));stub('categoryIdFor',async()=>1);stub('boxFor',async()=>({length:20,width:20,height:20}));stub('fetchRates',async()=>({request_token:'test',couriers:[{courier_id:'test',courier_name:'Test Courier',rate_card_amount:2450,total:2350}]}));
 try{
  await Seller.updateOne({_id:seller},{$set:{phoneNumber:null,'warehouseDetails.contactNumber':'08031234567','warehouseDetails.address':{...payload}}});
  const Stream=require('@models/Stream'),Product=require('@models/Product');const product=(await Product.collection.insertOne({name:'Adire Bubu',price:11000,weight:.5,seller})).insertedId;const stream=(await Stream.collection.insertOne({seller,status:'live',products:[]})).insertedId;
  const result=await request(app).post(`/api/v2/watch/${stream}/delivery-quote`).send({productId:String(product),address:{...payload,addressLine2:'By the gate'}});
  expect(result.status).toBe(200);expect(result.body).toMatchObject({available:true,amount:2450});expect(sb.validateAddress).toHaveBeenCalledWith(expect.objectContaining({phone:'08031234567'}));
 }finally{for(const spy of spies)spy.mockRestore();}
});
test('Home reports the effective pickup phone and the stored verification reason',async()=>{
 const host={...payload};await Seller.updateOne({_id:seller},{$set:{phoneNumber:null,'warehouseDetails.contactNumber':'081085565429','warehouseDetails.address':host}});
 let r=await request(app).get('/api/v2/studio/home').set('Authorization',`Bearer ${sellerToken}`);expect(r.status).toBe(200);expect(r.body.courierPhoneInvalid).toBe(true);
 await Seller.updateOne({_id:seller},{$set:{'warehouseDetails.contactNumber':'08031234567'}});const service=require('@services/deliveryService'),account=await Seller.findById(seller).lean(),key=service.addressKey(service.sellerPickup(account));
 await Seller.updateOne({_id:seller},{$set:{pickupValidation:{key,kind:'phone',message:"Shipbubble couldn't verify your pickup phone number"}}});
 r=await request(app).get('/api/v2/studio/home').set('Authorization',`Bearer ${sellerToken}`);expect(r.body.courierPhoneInvalid).toBe(false);expect(r.body.pickupProblem).toMatch(/pickup phone number/);
 await Seller.updateOne({_id:seller},{$set:{'warehouseDetails.contactNumber':'08031234568'}});r=await request(app).get('/api/v2/studio/home').set('Authorization',`Bearer ${sellerToken}`);expect(r.body.pickupProblem).toBeNull();
});
