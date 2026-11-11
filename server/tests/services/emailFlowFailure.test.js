const mongoose=require('mongoose');
const {MongoMemoryServer}=require('mongodb-memory-server');
const request=require('supertest');
jest.mock('@/services/email/mailer',()=>({send:jest.fn(),configuration:()=>({email:'configured',redirect:true})}));
const mailer=require('@/services/email/mailer');
const {app}=require('@/app');
const Buyer=require('@models/Buyer');
const Seller=require('@models/Seller');
let mongo;
beforeAll(async()=>{mongo=await MongoMemoryServer.create({binary:{version:'7.0.3'}});if(mongoose.connection.readyState)await mongoose.disconnect();await mongoose.connect(mongo.getUri());});
afterAll(async()=>{await mongoose.disconnect();await mongo.stop();});
beforeEach(async()=>{await Promise.all([Buyer.deleteMany({}),Seller.deleteMany({})]);mailer.send.mockReset();mailer.send.mockResolvedValue({id:'test',provider:'resend'});});
test.each([false,true])('OTP buyer signup keeps its creation reply when email fails=%s',async fails=>{
 if(fails)mailer.send.mockRejectedValue(new Error('Email unavailable'));
 const res=await request(app).post('/api/buyer/register').send({firstName:'Ada',lastName:'Test',username:'ada',email:'ada@example.test',password:'secure-password-123',phoneNumber:'+2348012345678',country:'Nigeria'});
 expect(res.status).toBe(201);expect(res.body).toMatchObject({user:{email:'ada@example.test'},token:expect.any(String)});
 expect(mailer.send).toHaveBeenCalledWith(expect.objectContaining({to:'ada@example.test',html:expect.stringContaining('code'),text:expect.any(String),tags:[{name:'type',value:'verification-code'}]}));
});
test.each(['Buyer','Seller'])('%s reset stays generic when the actual mailer rejects',async role=>{
 const Model=role==='Buyer'?Buyer:Seller;await Model.collection.insertOne({email:'ada@example.test',firstName:'Ada',authVersion:0,password:'unused'});
 const engine=require('@/services/auth/passwordReset');mailer.send.mockRejectedValue(new Error('Private provider error'));
 const known=await engine.issue(role,'ada@example.test');const unknown=await engine.issue(role,'missing@example.test');expect(known).toEqual(unknown);expect(known.message).toMatch(/If an account/);
 expect(mailer.send).toHaveBeenCalledWith(expect.objectContaining({idempotencyKey:expect.stringMatching(/^password-reset\//),tags:[{name:'type',value:'password-reset'}]}));
});
test.each([false,true])('seller registration remains successful when mailer fails=%s',async fails=>{
 if(fails)mailer.send.mockRejectedValue(new Error('Email unavailable'));
 const register=require('@modules/seller/services/register.service').register;
 const result=await register({firstName:'Ada',lastName:'Test',storeName:'Ada Shop',email:'ada@example.test',password:'secure-password-123',phoneNumber:'+2348012345678',accountType:'individual'});
 expect(result).toMatchObject({user:{email:'ada@example.test'},token:expect.any(String)});
 await new Promise(resolve=>setImmediate(resolve));expect(mailer.send).toHaveBeenCalled();
});
test('seller/buyer order notifications work without any SendGrid credentials',async()=>{
 const previous=process.env.SENDGRID_API_KEY;delete process.env.SENDGRID_API_KEY;
 const notifications=require('@/controllers/notificationController');
 await notifications.sendEmailNotification({email:'seller@example.test',firstName:'Ada'},{type:'new_order',title:'New Order Received',data:{items:[]}});
 expect(mailer.send).toHaveBeenCalledWith(expect.objectContaining({to:'seller@example.test',subject:expect.any(String),html:expect.stringContaining('New Order')}));
 mailer.send.mockClear();
 await notifications.sendEmailToBuyer({email:'buyer@example.test',firstName:'Ada'},{type:'order_placed',data:{items:[]}});
 expect(mailer.send).toHaveBeenCalledWith(expect.objectContaining({to:'buyer@example.test',subject:expect.any(String),html:expect.any(String)}));
 if(previous===undefined)delete process.env.SENDGRID_API_KEY;else process.env.SENDGRID_API_KEY=previous;
});
