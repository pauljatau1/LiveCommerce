const mongoose=require('mongoose');
const {MongoMemoryServer}=require('mongodb-memory-server');
const request=require('supertest');
const jwt=require('jsonwebtoken');
jest.mock('@/services/email/mailer',()=>({send:jest.fn(),configuration:jest.fn(()=>({email:'configured',redirect:true}))}));
const mailer=require('@/services/email/mailer');
const {app}=require('@/app');
const Admin=require('@/models/Admin');
let mongo,token;
beforeAll(async()=>{mongo=await MongoMemoryServer.create({binary:{version:'7.0.3'}});if(mongoose.connection.readyState)await mongoose.disconnect();await mongoose.connect(mongo.getUri());const id=(await Admin.collection.insertOne({email:'admin@example.test'})).insertedId;token=jwt.sign({id,role:'Admin'},process.env.JWT_SECRET);});
afterAll(async()=>{await mongoose.disconnect();await mongo.stop();});
beforeEach(()=>{mailer.send.mockReset();mailer.send.mockResolvedValue({id:'resend-test-1',provider:'resend'});});
test('health includes only email status and redirect flag',async()=>{
 const res=await request(app).get('/health');expect(res.body).toMatchObject({email:'configured',redirect:true});expect(JSON.stringify(res.body)).not.toMatch(/admin@example|RESEND_API_KEY|EMAIL_FROM/);
});
test('test-email refuses guests and non-admins',async()=>{
 expect((await request(app).post('/api/v2/admin/test-email').send({to:'owner@example.test'})).status).toBe(401);
 const buyer=jwt.sign({id:new mongoose.Types.ObjectId(),role:'Buyer'},process.env.JWT_SECRET);
 expect((await request(app).post('/api/v2/admin/test-email').set('Authorization',`Bearer ${buyer}`).send({to:'owner@example.test'})).status).toBe(403);expect(mailer.send).not.toHaveBeenCalled();
});
test('admin sends password-changed HTML/text template and gets Resend id',async()=>{
 const res=await request(app).post('/api/v2/admin/test-email').set('Authorization',`Bearer ${token}`).send({to:'owner@example.test'});
 expect(res.status).toBe(200);expect(res.body).toEqual({id:'resend-test-1'});expect(mailer.send).toHaveBeenCalledWith(expect.objectContaining({to:'owner@example.test',html:expect.stringContaining('Your password was changed'),text:expect.stringContaining('your password has been changed'),tags:[{name:'type',value:'test-email'}],idempotencyKey:expect.stringMatching(/^test-email\//)}));
});
test('validation and provider failure return plain errors, without private details',async()=>{
 expect((await request(app).post('/api/v2/admin/test-email').set('Authorization',`Bearer ${token}`).send({to:'bad'})).status).toBe(400);
 mailer.send.mockRejectedValue(new Error('private API payload'));
 const res=await request(app).post('/api/v2/admin/test-email').set('Authorization',`Bearer ${token}`).send({to:'owner@example.test'});expect(res.status).toBe(503);expect(res.body.message).toContain('Check the email settings');expect(JSON.stringify(res.body)).not.toContain('private');
});
