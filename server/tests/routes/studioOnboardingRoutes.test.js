const mongoose = require('mongoose');
const express = require('express');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mockSellerId;
jest.mock('@/middlewares/authMiddleware', () => ({
  verifyToken: (req, res, next) => { req.user = { id: String(mockSellerId), role: 'Seller' }; next(); },
  isSeller: (req, res, next) => next(),
}));
jest.mock('@/services/bankService', () => ({
  getBankList: jest.fn(async () => [{ code: '058', name: 'GTBank', active: true }, { code: '999', name: 'Old Bank', active: false }]),
  verifyBankAccount: jest.fn(async (acct) => {
    if (acct === '0000000000') throw new Error('Could not resolve account name');
    return { account_number: acct, account_name: 'TOLULOPE ADEYEMI', bank_id: 9 };
  }),
}));

const Seller = require('@models/Seller');
let mongoServer; let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({ binary: { version: '7.0.3' } });
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  await mongoose.connect(mongoServer.getUri());
  app = express();
  app.use(express.json());
  app.use('/api/v2/studio/onboarding', require('@/routes/studioOnboardingRoutes'));
});
afterAll(async () => { await mongoose.disconnect(); await mongoServer.stop(); });
beforeEach(async () => {
  await Seller.deleteMany({});
  mockSellerId = (await Seller.collection.insertOne({ firstName: 'Tolu', email: 't@example.com', agoraUid: 5, hasFilledAddress: false, hasFilledBusinessAddress: false })).insertedId;
});

describe('Getting started', () => {
  it('walks through store, pickup and bank, in plain words when something is missing', async () => {
    let r = await request(app).get('/api/v2/studio/onboarding').expect(200);
    expect(r.body).toMatchObject({ store: { done: false }, pickup: { done: false }, bank: { done: false }, categories: ['Women', 'Men', 'Thrift', 'Shoes', 'Bags', 'Accessories'] });

    expect((await request(app).put('/api/v2/studio/onboarding/store').send({ storeName: 'T' }).expect(400)).body.message).toMatch(/store name/);
    r = await request(app).put('/api/v2/studio/onboarding/store').send({ storeName: 'Tolu Thrift', aboutStore: 'Thrift from Yaba', categories: ['Women', 'Thrift', 'Anime'] }).expect(200);
    expect(r.body.store).toMatchObject({ storeName: 'Tolu Thrift', categories: ['Women', 'Thrift'], done: true });

    expect((await request(app).put('/api/v2/studio/onboarding/pickup').send({ state: 'Lagos', city: 'Yaba', addressLine1: '14 Herbert Macaulay Way', phone: '123' }).expect(400)).body.message).toMatch(/phone number/);
    r = await request(app).put('/api/v2/studio/onboarding/pickup').send({ state: 'Lagos', city: 'Yaba', addressLine1: '14 Herbert Macaulay Way', landmark: 'by the bus stop', phone: '0803 123 4567' }).expect(200);
    expect(r.body.pickup).toMatchObject({ city: 'Yaba', landmark: 'by the bus stop', done: true });
    const saved = await Seller.findById(mockSellerId).lean();
    expect(saved).toMatchObject({ hasFilledAddress: true, hasFilledBusinessAddress: true, warehouseDetails: { contactNumber: '08031234567' } });

    expect((await request(app).get('/api/v2/studio/onboarding/banks').expect(200)).body.banks).toEqual([{ code: '058', name: 'GTBank' }]);
    expect((await request(app).post('/api/v2/studio/onboarding/bank/check').send({ bankCode: '058', accountNumber: '0123456789' }).expect(200)).body.accountName).toBe('TOLULOPE ADEYEMI');
    expect((await request(app).post('/api/v2/studio/onboarding/bank/check').send({ bankCode: '058', accountNumber: '0000000000' }).expect(422)).body.message).toMatch(/couldn't find that bank account/);
    expect((await request(app).post('/api/v2/studio/onboarding/bank/check').send({ bankCode: '058', accountNumber: '12345' }).expect(400)).body.message).toMatch(/10 digits/);
  });

  it('saves the account name from Paystack, never from the form', async () => {
    const r = await request(app).put('/api/v2/studio/onboarding/bank').send({ bankCode: '058', bankName: 'GTBank', accountNumber: '0123456789', accountName: 'SOMEONE ELSE' }).expect(200);
    expect(r.body.bank).toMatchObject({ bankName: 'GTBank', last4: '6789', accountName: 'TOLULOPE ADEYEMI', done: true });
    const saved = await Seller.findById(mockSellerId).lean();
    expect(saved.bankDetails).toMatchObject({ accountName: 'TOLULOPE ADEYEMI', bankIdentifierCode: '058' });
    expect(saved.isBankVerified).toBe(true);
  });
});

describe('launch pickup area',()=>{
 it('rejects pickup outside Lagos and allows Ogun after a setting change',async()=>{
  const body={state:'Ogun',city:'Ota',addressLine1:'1 Test Road',phone:'08031234567'};
  expect((await request(app).put('/api/v2/studio/onboarding/pickup').send(body).expect(400)).body.message).toMatch(/within Lagos/);
  const original=process.env.SERVICE_STATES;
  try{process.env.SERVICE_STATES='Lagos,Ogun';await request(app).put('/api/v2/studio/onboarding/pickup').send(body).expect(200);}
  finally{if(original===undefined)delete process.env.SERVICE_STATES;else process.env.SERVICE_STATES=original;}
 });
});
