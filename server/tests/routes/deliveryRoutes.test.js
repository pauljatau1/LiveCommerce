const mongoose = require('mongoose');
const express = require('express');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('@/middlewares/authMiddleware', () => ({
  verifyToken: (req, res, next) => { req.user = { id:req.headers['x-buyer'] || String(new (require('mongoose').Types.ObjectId)()) }; next(); },
  isSeller: (req, res, next) => next(),
  isBuyer: (req, res, next) => next(),
}));

let mongo; let app;
describe('delivery routes', () => {
  const saved = process.env.SHIPBUBBLE_API_KEY;
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    await mongoose.connect(mongo.getUri());
    require('@models/Buyer'); require('@models/Seller'); require('@models/Stream');
    app = express(); app.use(express.json()); app.use('/api/v2/deliveries', require('@/routes/deliveryRoutes'));
  });
  afterAll(async () => { process.env.SHIPBUBBLE_API_KEY = saved; await mongoose.disconnect(); await mongo.stop(); });

  it('tells the seller studio when it runs on a Shipbubble sandbox key (for the test courier buttons)', async () => {
    process.env.SHIPBUBBLE_API_KEY = 'sb_sandbox_x';
    expect((await request(app).get('/api/v2/deliveries/seller').expect(200)).body.sandbox).toBe(true);
    process.env.SHIPBUBBLE_API_KEY = 'sb_prod_x';
    expect((await request(app).get('/api/v2/deliveries/seller').expect(200)).body.sandbox).toBe(false);
  });
  it('retries only the owning buyer name/phone repair, using existing settlement and booking',async()=>{
    const ShowDelivery=require('@/models/ShowDelivery'),service=require('@/services/deliveryService'),buyer=new mongoose.Types.ObjectId(),seller=new mongoose.Types.ObjectId();
    const result=await ShowDelivery.collection.insertOne({buyer,seller,status:'needs_fix',fix:{party:'buyer',kind:'name'},items:[]});
    const settle=jest.spyOn(service,'settle').mockResolvedValue({status:'paid'}),book=jest.spyOn(service,'book').mockResolvedValue({status:'booked'});
    await request(app).post(`/api/v2/deliveries/${result.insertedId}/retry`).expect(404);expect(settle).not.toHaveBeenCalled();
    const res=await request(app).post(`/api/v2/deliveries/${result.insertedId}/retry`).set('x-buyer',String(buyer)).expect(200);expect(res.body.delivery.fix.kind).toBe('name');expect(settle).toHaveBeenCalledWith(result.insertedId);expect(book).toHaveBeenCalledWith({sellerId:seller,deliveryId:result.insertedId});
    settle.mockClear();book.mockClear();await ShowDelivery.updateOne({_id:result.insertedId},{$set:{'fix.party':'seller'}});await request(app).post(`/api/v2/deliveries/${result.insertedId}/retry`).set('x-buyer',String(buyer)).expect(200);expect(settle).not.toHaveBeenCalled();expect(book).not.toHaveBeenCalled();jest.restoreAllMocks();
  });

});
