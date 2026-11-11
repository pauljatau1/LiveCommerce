const mongoose=require('mongoose');
const {MongoMemoryServer}=require('mongodb-memory-server');
const express=require('express');const request=require('supertest');const jwt=require('jsonwebtoken');
jest.mock('@/services/termiiEmailService',()=>({sendPasswordResetEmail:jest.fn().mockResolvedValue(true),sendRawHTMLEmail:jest.fn().mockResolvedValue(true)}));
const Buyer=require('@models/Buyer'),Seller=require('@models/Seller'),Challenge=require('@/models/PasswordResetChallenge');
const resets=require('@/services/auth/passwordReset'),sessions=require('@/services/auth/sessions'),mail=require('@/services/termiiEmailService');
let mongo;
beforeAll(async()=>{mongo=await MongoMemoryServer.create({binary:{version:'7.0.3'}});if(mongoose.connection.readyState)await mongoose.disconnect();await mongoose.connect(mongo.getUri());await Challenge.init();});
afterAll(async()=>{await mongoose.disconnect();await mongo.stop()});
beforeEach(async()=>{await Promise.all([Buyer.deleteMany({}),Seller.deleteMany({}),Challenge.deleteMany({})]);jest.clearAllMocks()});
const create=async role=>{const M=role==='Buyer'?Buyer:Seller;const id=(await M.collection.insertOne({email:`${role.toLowerCase()}@example.test`,firstName:'Ada',password:'old',authVersion:0})).insertedId;return{id,email:`${role.toLowerCase()}@example.test`,M};};
const getCode=()=>{const html=mail.sendPasswordResetEmail.mock.calls.at(-1)[0].html;return html.match(/>(\d{6})<\/p>/)[1]};
describe.each(['Buyer','Seller'])('%s reset security',role=>{
 test('six digits, only hash in storage, fifteen minute expiry and uniform unknown reply',async()=>{const a=await create(role);const start=Date.now();const result=await resets.issue(role,a.email);expect(await resets.issue(role,'missing@example.test')).toEqual(result);const code=getCode();expect(code).toMatch(/^\d{6}$/);const c=await Challenge.findOne({account:a.id}).lean();expect(c.codeHash).not.toContain(code);expect(c.code).toBeUndefined();expect(new Date(c.expiresAt).getTime()-start).toBeGreaterThanOrEqual(899000);expect(new Date(c.expiresAt).getTime()-start).toBeLessThanOrEqual(902000);});
 test('five wrong attempts cancel it: sixth attempt with the right code fails',async()=>{const a=await create(role);await resets.issue(role,a.email);const code=getCode(),wrong=code==='111111'?'222222':'111111';for(let i=0;i<5;i++)await expect(resets.reset(role,{email:a.email,code:wrong,newPassword:'new-password-123'})).rejects.toMatchObject({status:400});await expect(resets.reset(role,{email:a.email,code,newPassword:'new-password-123'})).rejects.toMatchObject({status:400});expect((await a.M.findById(a.id).lean()).authVersion).toBe(0);});
 test('resending cancels the previous link and only the latest challenge is stored',async()=>{const a=await create(role);await resets.issue(role,a.email,{link:true});const old=mail.sendPasswordResetEmail.mock.calls.at(-1)[0].html.match(/token=([a-f0-9]+)/)[1];await resets.issue(role,a.email,{link:true});await expect(resets.verifyLink(role,old)).rejects.toMatchObject({status:400});expect(await Challenge.countDocuments({account:a.id})).toBe(1);});
 test('expired codes fail',async()=>{const a=await create(role);await resets.issue(role,a.email);const code=getCode();await Challenge.updateOne({account:a.id},{$set:{expiresAt:new Date(Date.now()-1)}});await expect(resets.reset(role,{email:a.email,code,newPassword:'new-password-123'})).rejects.toMatchObject({status:400});});
 test('success revokes old tokens, permits a fresh login token and sends confirmation once',async()=>{const a=await create(role);const token=await sessions.issueToken(a.id,role);await resets.issue(role,a.email);const code=getCode();await resets.reset(role,{email:a.email,code,newPassword:'new-password-123'});await expect(sessions.assertSession(jwt.verify(token,process.env.JWT_SECRET))).rejects.toThrow(/sign in again/);await expect(require(`@modules/${role.toLowerCase()}/services/checkToken.service`).checkToken(token)).rejects.toThrow();const protectedApp=express(); protectedApp.get('/private',require('@/middlewares/authMiddleware').verifyToken,(req,res)=>res.json({ok:true})); expect((await request(protectedApp).get('/private').set('Authorization',`Bearer ${token}`)).status).toBe(401);const fresh=await sessions.issueToken(a.id,role);await expect(sessions.assertSession(jwt.verify(fresh,process.env.JWT_SECRET))).resolves.toMatchObject({v:1});expect(mail.sendRawHTMLEmail).toHaveBeenCalledWith(expect.objectContaining({subject:expect.stringMatching(/password was changed/)}));await expect(resets.reset(role,{email:a.email,code,newPassword:'another-password'})).rejects.toMatchObject({status:400});});
 test('link reset is single-use and expires with the same challenge',async()=>{const a=await create(role);await resets.issue(role,a.email,{link:true});const html=mail.sendPasswordResetEmail.mock.calls.at(-1)[0].html;const token=html.match(/token=([a-f0-9]+)/)[1];expect(await resets.verifyLink(role,token)).toMatchObject({valid:true});await resets.reset(role,{token,newPassword:'linked-password-123'});await expect(resets.verifyLink(role,token)).rejects.toMatchObject({status:400});});
});

describe.each([['Seller','/api/sellers'],['Buyer','/api/v2/buyers']])('%s HTTP reset routes', (role, base) => {
 test('unknown email gets the same reply, and five wrong guesses block the correct code',async()=>{
  const app=require('@/app').app;
  const a=await create(role);
  const known=await request(app).post(`${base}/forgot-password`).send({email:a.email});
  const unknown=await request(app).post(`${base}/forgot-password`).send({email:'unknown@example.test'});
  expect(known.status).toBe(200);expect(unknown.status).toBe(200);expect(unknown.body).toEqual(known.body);
  const code=getCode(), wrong=code==='111111'?'222222':'111111';
  for(let i=0;i<5;i++) expect((await request(app).post(`${base}/reset-password`).send({email:a.email,code:wrong,otp:wrong,newPassword:'new-password-123'})).status).toBe(400);
  expect((await request(app).post(`${base}/reset-password`).send({email:a.email,code,otp:code,newPassword:'new-password-123'})).status).toBe(400);
 });
});
