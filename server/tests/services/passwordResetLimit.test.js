const mongoose = require('mongoose');
const {MongoMemoryServer} = require('mongodb-memory-server');
const express = require('express');
const request = require('supertest');
const Counter = require('@/models/PasswordResetThrottle');
const {createPasswordResetLimit, pathMatches} = require('@/middlewares/passwordResetLimit');
let mongo, app;
beforeAll(async () => {
 mongo = await MongoMemoryServer.create({binary:{version:'7.0.3'}});
 if(mongoose.connection.readyState) await mongoose.disconnect();
 await mongoose.connect(mongo.getUri());
});
afterAll(async () => {await mongoose.disconnect(); await mongo.stop();});
beforeEach(async () => {
 await Counter.deleteMany({});
 app = express(); app.set('trust proxy', 1); app.use(express.json());
 app.use(createPasswordResetLimit()); app.use((req,res) => res.json({ok:true}));
});
const post = (path, email, ip='192.0.2.1') => request(app).post(path).set('X-Forwarded-For',ip).send({email});
test.each(['buyer','seller','v2/buyers','v2/buyers/auth','v2/sellers','sellers'])('%s protects all reset and resend endpoints', role => {
 for (const endpoint of ['forgot-password','forgot-password-sms','request-password-reset','reset-password','verify-reset-token','reset-password-with-token','resend-otp','resend-code']) expect(pathMatches(`/api/${role}/${endpoint}`)).toBe(true);
 expect(pathMatches(`/api/${role}/login`)).toBe(false);
});
test.each(['forgot-password','resend-otp','request-password-reset'])('%s email quota survives a different IP and normalises case', async endpoint => {
 for(let i=0;i<5;i++) expect((await post(`/api/seller/${endpoint}`, 'Ada@Example.test', `192.0.2.${i+1}`)).status).toBe(200);
 expect((await post(`/api/seller/${endpoint}`, ' ada@example.test ', '192.0.2.99')).status).toBe(429);
});
test.each(['reset-password','verify-reset-token','reset-password-with-token'])('%s has a per-email verification quota', async endpoint => {
 for(let i=0;i<20;i++) expect((await post(`/api/buyer/${endpoint}`, 'ada@example.test', `192.0.2.${i+1}`)).status).toBe(200);
 expect((await post(`/api/buyer/${endpoint}`, 'ada@example.test', '192.0.2.99')).status).toBe(429);
});
test('IP quota limits rotating email addresses and endpoints', async () => {
 for(let i=0;i<30;i++) expect((await post('/api/seller/forgot-password', `person${i}@example.test`)).status).toBe(200);
 expect((await post('/api/buyer/reset-password','new@example.test')).status).toBe(429);
});

test('token and code verification share one email quota even if the token request supplies another email', async () => {
 const id=(await require('@models/Buyer').collection.insertOne({email:'link@example.test'})).insertedId;
 const token='a'.repeat(64);
 await require('@/models/PasswordResetChallenge').create({account:id,role:'Buyer',linkHash:require('@/services/auth/passwordReset').hash(token),expiresAt:new Date(Date.now()+60000)});
 for(let i=0;i<20;i++) expect((await request(app).post('/api/buyer/verify-reset-token').set('X-Forwarded-For',`192.0.2.${i+1}`).send({token,email:`spoof${i}@example.test`})).status).toBe(200);
 expect((await post('/api/buyer/reset-password','link@example.test','192.0.2.99')).status).toBe(429);
});
