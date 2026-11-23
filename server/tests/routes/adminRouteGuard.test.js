const mongoose = require('mongoose');
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Every /api/admin route must refuse a buyer's or seller's login.
// Staging before this change let a buyer token read /api/admin/sellers.
let mongo; let app;
describe('admin routes refuse non-admin logins', () => {
  const saved = process.env.ADMIN_EMAILS;
  beforeAll(async () => {
    process.env.ADMIN_EMAILS = 'paul@example.com';
    mongo = await MongoMemoryServer.create();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    await mongoose.connect(mongo.getUri());
    app = express(); app.use(express.json()); app.use('/api/admin', require('@/routes/adminRoutes'));
  });
  afterAll(async () => { process.env.ADMIN_EMAILS = saved; await mongoose.disconnect(); await mongo.stop(); });

  const token = (role) => jwt.sign({ id: String(new mongoose.Types.ObjectId()), role }, process.env.JWT_SECRET);
  const paths = ['/api/admin/sellers', '/api/admin/sellers/statistics', '/api/admin/overview', '/api/admin/buyers',
    '/api/admin/withdrawals', '/api/admin/financial/summary', `/api/admin/orders/${new mongoose.Types.ObjectId()}/show-delivery`,
    `/api/admin/sellers/${new mongoose.Types.ObjectId()}/wallet/adjustments`];

  it.each(['Buyer', 'Seller'])('a %s login gets 401/403 on every admin read', async (role) => {
    for (const path of paths) {
      const res = await request(app).get(path).set('Authorization', `Bearer ${token(role)}`);
      expect([401, 403]).toContain(res.status);
    }
  });
  it('a wallet change with a buyer login is refused', async () => {
    const res = await request(app).post(`/api/admin/sellers/${new mongoose.Types.ObjectId()}/wallet/add`).set('Authorization', `Bearer ${token('Buyer')}`).send({ amount: 1000, reason: 'Trying it on' });
    expect([401, 403]).toContain(res.status);
  });
});
