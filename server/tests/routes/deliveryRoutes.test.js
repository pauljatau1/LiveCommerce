const mongoose = require('mongoose');
const express = require('express');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('@/middlewares/authMiddleware', () => ({
  verifyToken: (req, res, next) => { req.user = { id: String(new (require('mongoose').Types.ObjectId)()) }; next(); },
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
});
