const mongoose = require('mongoose');
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('@/services/email/mailer', () => ({ send: jest.fn().mockResolvedValue({ id: 'email-1' }), configuration: () => ({}) }));
const mailer = require('@/services/email/mailer');

let mongo; let app; let Admin; let AdminInvite;
const token = (admin) => jwt.sign({ id: String(admin._id), role: 'admin', av: admin.authVersion || 0 }, process.env.JWT_SECRET);
const as = (admin) => ({ Authorization: `Bearer ${token(admin)}` });

describe('admin team access', () => {
  const saved = process.env.ADMIN_EMAILS;
  let owner;
  beforeAll(async () => {
    process.env.ADMIN_EMAILS = 'owner@example.com';
    mongo = await MongoMemoryServer.create();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    await mongoose.connect(mongo.getUri());
    Admin = require('@models/Admin'); AdminInvite = require('@models/AdminInvite');
    require('@models/Seller'); require('@models/Withdrawal');
    app = express(); app.use(express.json());
    app.use('/api/admin', require('@/routes/adminRoutes'));
    app.use('/api/v2/admin', require('@/modules/adminv2/routes/admin.routes'));
  });
  afterAll(async () => { process.env.ADMIN_EMAILS = saved; await mongoose.disconnect(); await mongo.stop(); });
  beforeEach(async () => {
    await Promise.all([Admin.deleteMany({}), AdminInvite.deleteMany({})]);
    mailer.send.mockClear();
    owner = await Admin.create({ username: 'owner', email: 'owner@example.com', password: 'OwnerPass!234' });
  });

  const invite = (body, who = owner) => request(app).post('/api/admin/team/invites').set(as(who)).send(body);
  const linkToken = (res) => res.body.link.split('/invite/')[1];
  const accept = (t, username = 'tunde', password = 'LongPassword1') => request(app).post('/api/admin/invites/accept').send({ token: t, username, password });

  it('a super admin invites someone with a ready-made role; they accept and get exactly that access', async () => {
    const res = await invite({ email: 'Tunde@Example.com', roleTemplate: 'finance' }).expect(201);
    expect(res.body.emailed).toBe(true);
    expect(mailer.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'tunde@example.com' }));
    expect(mailer.send.mock.calls[0][0].html).toContain(res.body.link);

    const t = linkToken(res);
    const preview = await request(app).get(`/api/admin/invites/${t}`).expect(200);
    expect(preview.body).toMatchObject({ email: 'tunde@example.com' });
    expect(preview.body.access).toMatch(/Withdrawals \(manage\)/);

    await accept(t).expect(201);
    await accept(t, 'someoneelse').expect(410); // one use only

    const tunde = await Admin.findOne({ email: 'tunde@example.com' }).lean();
    const h = as(tunde);
    const profile = await request(app).get('/api/admin/profile').set(h).expect(200);
    expect(profile.body.password).toBeUndefined();
    expect(profile.body.access).toMatchObject({ super: false, permissions: { withdrawals: 'manage', payments: 'view', sellers: 'view', products: 'none' } });

    await request(app).get('/api/admin/withdrawals').set(h).expect((r) => expect(r.status).not.toBe(403));
    const noArea = await request(app).get('/api/admin/products').set(h).expect(403);
    expect(noArea.body.message).toMatch(/don't have access to Products/);
    const viewOnly = await request(app).put(`/api/admin/sellers/${new mongoose.Types.ObjectId()}/verify`).set(h).expect(403);
    expect(viewOnly.body.message).toMatch(/can view Sellers but not change it/);
    await request(app).get('/api/admin/team').set(h).expect(403);
    await request(app).get('/api/v2/admin/errors').set(h).expect(403);
  });

  it('custom areas adjust a role, wallet changes are manage-or-nothing, and an empty access set is refused', async () => {
    await invite({ email: 'x@example.com', permissions: {} }).expect(400);
    const res = await invite({ email: 'ada@example.com', roleTemplate: 'support', permissions: { products: 'manage', wallets: 'view', bogus: 'manage' } }).expect(201);
    const inv = await AdminInvite.findById(res.body.invite._id).lean();
    expect(inv.permissions).toMatchObject({ products: 'manage', wallets: 'none', orders: 'view' });
    expect(inv.permissions.bogus).toBeUndefined();
  });

  it('only super admins manage the team; changes and removals apply on the next request', async () => {
    const res = await invite({ email: 'bola@example.com', roleTemplate: 'operations' });
    await accept(linkToken(res), 'bola').expect(201);
    let bola = await Admin.findOne({ email: 'bola@example.com' }).lean();
    const h = as(bola);
    await invite({ email: 'z@example.com', roleTemplate: 'viewer' }, bola).expect(403);
    await request(app).get('/api/admin/sellers').set(h).expect((r) => expect(r.status).not.toBe(403));

    await request(app).patch(`/api/admin/team/members/${bola._id}`).set(as(owner)).send({ roleTemplate: 'content' }).expect(200);
    await request(app).get('/api/admin/sellers').set(h).expect(403);

    await request(app).delete(`/api/admin/team/members/${bola._id}`).set(as(owner)).expect(200);
    await request(app).get('/api/admin/categories').set(h).expect((r) => expect([401, 403]).toContain(r.status)); // locked out at once
    bola = await Admin.findById(bola._id).lean();
    await request(app).get('/api/admin/categories').set(as(bola)).expect(403); // and no access even with a fresh token

    await request(app).patch(`/api/admin/team/members/${owner._id}`).set(as(owner)).send({ roleTemplate: 'viewer' }).expect(400);
  });

  it('a removed person can be invited again; cancelled and expired links do not work', async () => {
    const first = await invite({ email: 'kemi@example.com', roleTemplate: 'support' });
    await accept(linkToken(first), 'kemi').expect(201);
    const kemi = await Admin.findOne({ email: 'kemi@example.com' });
    await invite({ email: 'kemi@example.com', roleTemplate: 'viewer' }).expect(409);
    await request(app).delete(`/api/admin/team/members/${kemi._id}`).set(as(owner)).expect(200);
    const again = await invite({ email: 'kemi@example.com', roleTemplate: 'finance' }).expect(201);
    await accept(linkToken(again), 'kemi').expect(201);
    const back = await Admin.findOne({ email: 'kemi@example.com' }).lean();
    expect(back.active).toBe(true);
    expect(back.permissions.withdrawals).toBe('manage');

    const cancelled = await invite({ email: 'tobi@example.com', roleTemplate: 'viewer' });
    await request(app).delete(`/api/admin/team/invites/${cancelled.body.invite._id}`).set(as(owner)).expect(200);
    await request(app).get(`/api/admin/invites/${linkToken(cancelled)}`).expect(410);

    const expiring = await invite({ email: 'eze@example.com', roleTemplate: 'viewer' });
    await AdminInvite.updateOne({ _id: expiring.body.invite._id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    await accept(linkToken(expiring), 'eze').expect(410);
  });

  it('an old account that is neither an owner nor invited has no access', async () => {
    const old = await Admin.collection.insertOne({ username: 'oldauqli', email: 'bolu@auqli.com', password: 'x', authVersion: 0 });
    await request(app).get('/api/admin/sellers').set(as({ _id: old.insertedId })).expect(403);
  });
});
